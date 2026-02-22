import { NextRequest, NextResponse } from "next/server";
import AdmZip from "adm-zip";
import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";
import os from "os";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * POST /api/scan
 * Body: multipart/form-data with field "file" (zip file).
 * Extracts the zip to a temp dir, runs Semgrep, returns raw results.
 */
export async function POST(request: NextRequest) {
  let workDir: string | null = null;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file uploaded. Use form field 'file' with a zip file." },
        { status: 400 }
      );
    }

    const buf = Buffer.from(await file.arrayBuffer());
    if (buf.length === 0) {
      return NextResponse.json(
        { error: "Uploaded file is empty." },
        { status: 400 }
      );
    }

    workDir = path.join(os.tmpdir(), `vibescan-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);
    await fs.mkdir(workDir, { recursive: true });

    const zip = new AdmZip(buf);
    zip.extractAllTo(workDir, true);

    const semgrep = spawn("semgrep", ["scan", "--config", "auto", "--json", "--quiet", workDir], {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let semgrepNotFound = false;
    semgrep.stdout?.on("data", (chunk) => { stdout += chunk; });
    semgrep.stderr?.on("data", (chunk) => { stderr += chunk; });
    semgrep.on("error", (err) => {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") semgrepNotFound = true;
    });

    const exitCode = await new Promise<number>((resolve) => {
      semgrep.on("close", (code) => resolve(code ?? 127));
    });

    if (semgrepNotFound || exitCode === 127) {
      return NextResponse.json(
        {
          error: "Scanning is not available on this server. The Semgrep tool is not installed here. Run VibeScan locally (npm run dev) to scan your code.",
        },
        { status: 503 }
      );
    }

    let results: unknown;
    try {
      results = stdout ? JSON.parse(stdout) : { results: [], errors: [] };
    } catch {
      results = {
        results: [],
        errors: [],
        rawStdout: stdout,
        rawStderr: stderr,
        exitCode,
      };
    }

    return NextResponse.json({
      success: exitCode === 0 || exitCode === 1,
      exitCode,
      semgrep: results,
      stderr: stderr || undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Scan failed", detail: message },
      { status: 500 }
    );
  } finally {
    if (workDir) {
      try {
        await fs.rm(workDir, { recursive: true, force: true });
      } catch {
        // ignore cleanup errors
      }
    }
  }
}
