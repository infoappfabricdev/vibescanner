import { NextRequest, NextResponse } from "next/server";
import AdmZip from "adm-zip";
import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";
import os from "os";
import Stripe from "stripe";
import { verifyCouponToken } from "@/lib/coupon";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

async function requirePaidSession(sessionId: string | null): Promise<NextResponse | null> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  if (!sessionId || typeof sessionId !== "string") {
    return NextResponse.json(
      { error: "Payment required. Complete checkout to run a scan." },
      { status: 403 }
    );
  }
  try {
    const stripe = new Stripe(secretKey);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Payment required. Complete checkout to run a scan." },
        { status: 403 }
      );
    }
    return null;
  } catch {
    return NextResponse.json(
      { error: "Invalid or expired payment session. Please pay again from the checkout page." },
      { status: 403 }
    );
  }
}

/**
 * POST /api/scan
 * Body: multipart/form-data with "file" (zip) and either "session_id" (Stripe) or "coupon_token".
 * Requires a valid paid Stripe session or a valid coupon token.
 */
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const couponToken = formData.get("coupon_token");
  if (couponToken && typeof couponToken === "string") {
    const result = verifyCouponToken(couponToken);
    if (result.valid) {
      // Allow scan; no Stripe required
    } else {
      return NextResponse.json(
        { error: "Payment required. Complete checkout to run a scan." },
        { status: 403 }
      );
    }
  } else {
    const sessionId = formData.get("session_id");
    const paymentError = await requirePaidSession(sessionId as string | null);
    if (paymentError) return paymentError;
  }

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
