import { NextRequest, NextResponse } from "next/server";
import AdmZip from "adm-zip";
import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildReport, type ReportFinding } from "@/lib/semgrep-report";
import { enrichFixPromptsWithClaude } from "@/lib/enrich-fix-prompts";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

function countSeverities(findings: ReportFinding[]) {
  let high = 0;
  let medium = 0;
  let low = 0;
  for (const f of findings) {
    if (f.severity === "high") high++;
    else if (f.severity === "medium") medium++;
    else low++;
  }
  return { high, medium, low };
}

/**
 * POST /api/scan
 * Body: multipart/form-data with "file" (zip).
 * Requires auth. Deducts 1 credit, runs scan, saves report to scans table.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Sign in to run a scan." }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: creditsRow } = await admin
    .from("scan_credits")
    .select("credits_remaining")
    .eq("user_id", user.id)
    .maybeSingle();
  const credits = creditsRow?.credits_remaining ?? 0;
  if (credits < 1) {
    return NextResponse.json(
      { error: "No credits remaining. Get more credits to run a scan." },
      { status: 403 }
    );
  }

  await admin
    .from("scan_credits")
    .update({
      credits_remaining: credits - 1,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

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

  let scanServiceUrl = process.env.SCAN_SERVICE_URL?.trim();
  if (scanServiceUrl) {
    if (!/^https?:\/\//i.test(scanServiceUrl)) {
      scanServiceUrl = "https://" + scanServiceUrl;
    }
    const base = scanServiceUrl.replace(/\/$/, "");
    try {
      const forwardForm = new FormData();
      forwardForm.append("file", new Blob([buf]), file.name || "app.zip");
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 55000);
      const res = await fetch(`${base}/scan`, {
        method: "POST",
        body: forwardForm,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await res.json().catch(() => ({ error: "Scan service returned invalid JSON" }));
      let findings = buildReport(data as Record<string, unknown>);
      if (findings.length > 0) {
        const fixPrompts = await enrichFixPromptsWithClaude(findings);
        if (fixPrompts) {
          findings = findings.map((f, i) => ({ ...f, fixPrompt: fixPrompts[i] }));
        }
      }
      (data as Record<string, unknown>).report = findings;
      const { high, medium, low } = countSeverities(findings);
      await admin.from("scans").insert({
        user_id: user.id,
        findings: findings as unknown as Record<string, unknown>[],
        finding_count: findings.length,
        high_count: high,
        medium_count: medium,
        low_count: low,
      });
      return NextResponse.json(data, { status: res.status });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const isTimeout = err instanceof Error && err.name === "AbortError";
      return NextResponse.json(
        {
          error: isTimeout
            ? "Scan timed out. Try a smaller zip or try again."
            : "Scan service unavailable. Please try again later.",
          detail: message,
        },
        { status: isTimeout ? 504 : 502 }
      );
    }
  }

  let workDir: string | null = null;

  try {
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

    const response: Record<string, unknown> = {
      success: exitCode === 0 || exitCode === 1,
      exitCode,
      semgrep: results,
      stderr: stderr || undefined,
    };
    let findings = buildReport(response);
    if (findings.length > 0) {
      const fixPrompts = await enrichFixPromptsWithClaude(findings);
      if (fixPrompts) {
        findings = findings.map((f, i) => ({ ...f, fixPrompt: fixPrompts[i] }));
      }
    }
    response.report = findings;
    const { high, medium, low } = countSeverities(findings);
    await admin.from("scans").insert({
      user_id: user.id,
      findings: findings as unknown as Record<string, unknown>[],
      finding_count: findings.length,
      high_count: high,
      medium_count: medium,
      low_count: low,
    });
    return NextResponse.json(response);
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
