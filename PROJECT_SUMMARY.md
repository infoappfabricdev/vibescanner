# VibeScan – Project Summary

## 1. Full project architecture

**What VibeScan is:** Security scanning for non-technical people who build apps with AI (Lovable, Bolt, Cursor). The user uploads a zip of app code; the app runs Semgrep and shows a plain-English report with fix suggestions.

**Stack:** Next.js (App Router), deploy on Vercel. Scanning in production is done by a separate **scan-service** (Flask + Semgrep in Docker) on Railway; Vercel calls it via `SCAN_SERVICE_URL`. Payment via Stripe Checkout; optional coupon codes (e.g. DEVTEST) bypass payment via signed tokens.

**Pages:** `/` (landing), `/how-it-works`, `/trust`, `/pricing`, `/checkout`, `/scan`. Nav in `src/components/Nav.tsx`; no “Run a Vibe Scan” in nav (CTAs on Pricing and elsewhere).

**Flow:**

- **Checkout:** User can enter a coupon code (POST /api/validate-coupon) or click “Continue to payment” (POST /api/create-checkout-session → redirect to Stripe). Valid coupon (e.g. DEVTEST) → redirect to `/scan?coupon_token=...`. Paid Stripe → redirect to `/scan?session_id=...`.
- **Scan page:** Reads `session_id` or `coupon_token` from URL. Verifies via GET /api/verify-session or GET /api/verify-coupon. If missing or invalid → redirect to `/checkout`. If valid → show upload form; on submit, POST /api/scan with file and same proof (session_id or coupon_token).
- **Scan API:** Accepts either valid Stripe `session_id` or valid `coupon_token`. If neither valid → 403. If valid, runs scan locally (Semgrep) or forwards to scan-service when `SCAN_SERVICE_URL` is set.

**Key modules:** `src/lib/coupon.ts` (valid codes list, sign/verify token); `src/lib/semgrep-report.ts` (build report from raw Semgrep JSON). APIs: create-checkout-session, verify-session, validate-coupon, verify-coupon, scan.

---

## 2. Contents of key files and environment variables

### src/lib/coupon.ts

```ts
import crypto from "crypto";

export const VALID_COUPON_CODES: Record<
  string,
  { bypassPayment: boolean }
> = {
  // To revoke DEVTEST: either remove this line (empty {} is fine) or set bypassPayment to false. Redeploy for it to take effect.
  DEVTEST: { bypassPayment: true },
};

function getSecret(): string | undefined {
  return (
    process.env.COUPON_SECRET?.trim() ||
    process.env.STRIPE_SECRET_KEY?.trim()
  );
}

function base64urlEncode(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64urlDecode(str: string): Buffer | null {
  try {
    const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    return Buffer.from(padded, "base64");
  } catch {
    return null;
  }
}

export function signToken(code: string): string | null {
  const secret = getSecret();
  if (!secret) return null;
  const payload = JSON.stringify({ code });
  const payloadB64 = base64urlEncode(Buffer.from(payload, "utf8"));
  const sig = crypto.createHmac("sha256", secret).update(payloadB64).digest();
  const sigB64 = base64urlEncode(sig);
  return `${payloadB64}.${sigB64}`;
}

export function verifyCouponToken(token: string): { valid: boolean; code?: string } {
  const secret = getSecret();
  if (!secret) return { valid: false };
  const dot = token.indexOf(".");
  if (dot === -1) return { valid: false };
  const payloadB64 = token.slice(0, dot);
  const sigB64 = token.slice(dot + 1);
  const sigBuf = base64urlDecode(sigB64);
  const expectedSig = crypto.createHmac("sha256", secret).update(payloadB64).digest();
  if (!sigBuf || sigBuf.length !== expectedSig.length || !crypto.timingSafeEqual(sigBuf, expectedSig)) {
    return { valid: false };
  }
  const payloadBuf = base64urlDecode(payloadB64);
  if (!payloadBuf) return { valid: false };
  let payload: { code?: string };
  try {
    payload = JSON.parse(payloadBuf.toString("utf8"));
  } catch {
    return { valid: false };
  }
  const code = payload?.code;
  if (!code || typeof code !== "string") return { valid: false };
  const entry = VALID_COUPON_CODES[code];
  if (!entry?.bypassPayment) return { valid: false };
  return { valid: true, code };
}

export function isCodeValidForBypass(code: string): boolean {
  const entry = VALID_COUPON_CODES[code];
  return Boolean(entry?.bypassPayment);
}
```

### src/app/checkout/page.tsx

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";

export default function CheckoutPage() {
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [goingToStripe, setGoingToStripe] = useState(false);

  async function handleApplyCoupon(e: React.FormEvent) {
    e.preventDefault();
    setCouponError(null);
    const code = couponCode.trim();
    if (!code) return;
    try {
      const res = await fetch("/api/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = (await res.json()) as { valid?: boolean; token?: string };
      if (data.valid && data.token) {
        window.location.href = `/scan?coupon_token=${encodeURIComponent(data.token)}`;
        return;
      }
      setCouponError("Invalid code.");
    } catch {
      setCouponError("Something went wrong.");
    }
  }

  async function handleContinueToPayment() {
    setCheckoutError(null);
    setGoingToStripe(true);
    try {
      const res = await fetch("/api/create-checkout-session", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) {
        setCheckoutError(data.error || "Something went wrong.");
        setGoingToStripe(false);
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setCheckoutError("Could not start checkout.");
    } catch {
      setCheckoutError("Something went wrong.");
    }
    setGoingToStripe(false);
  }

  return (
    <main
      style={{
        padding: "3rem 1.5rem",
        maxWidth: "480px",
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: "1.5rem", fontWeight: 600, margin: "0 0 0.5rem", color: "#1e293b" }}>
        Checkout
      </h1>
      <p style={{ color: "#64748b", margin: "0 0 1.5rem", fontSize: "0.9375rem" }}>
        Run a one-time Vibe Scan for $9, or enter a coupon code for a free scan.
      </p>

      <form
        onSubmit={handleApplyCoupon}
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
        }}
      >
        <input
          type="text"
          placeholder="Coupon code"
          value={couponCode}
          onChange={(e) => {
            setCouponCode(e.target.value);
            setCouponError(null);
          }}
          style={{
            padding: "0.5rem 0.75rem",
            fontSize: "1rem",
            border: "1px solid #e2e8f0",
            borderRadius: "6px",
            minWidth: "140px",
          }}
        />
        <button
          type="submit"
          style={{
            padding: "0.5rem 1rem",
            fontSize: "0.9375rem",
            fontWeight: 600,
            color: "white",
            background: "#0f766e",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Apply
        </button>
      </form>
      {couponError && (
        <p style={{ color: "#c53030", marginTop: "-0.75rem", marginBottom: "1rem", fontSize: "0.875rem" }}>
          {couponError}
        </p>
      )}

      <p style={{ color: "#64748b", marginBottom: "0.75rem", fontSize: "0.875rem" }}>
        Or pay with card:
      </p>
      <button
        type="button"
        onClick={handleContinueToPayment}
        disabled={goingToStripe}
        style={{
          display: "block",
          padding: "0.75rem 1.5rem",
          fontSize: "1rem",
          fontWeight: 600,
          color: "white",
          background: "#0f766e",
          border: "none",
          borderRadius: "8px",
          cursor: goingToStripe ? "not-allowed" : "pointer",
        }}
      >
        {goingToStripe ? "Taking you to checkout…" : "Continue to payment — $9"}
      </button>
      {checkoutError && (
        <p style={{ color: "#c53030", marginTop: "0.75rem", fontSize: "0.875rem" }}>
          {checkoutError}
        </p>
      )}

      <p style={{ marginTop: "1.5rem", fontSize: "0.875rem" }}>
        <Link href="/pricing" style={{ color: "#0f766e", textDecoration: "none" }}>
          Back to pricing
        </Link>
      </p>
    </main>
  );
}
```

### src/app/scan/page.tsx

```tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { buildReport, type ReportFinding } from "@/lib/semgrep-report";

function FindingCard({ f, index }: { f: ReportFinding; index: number }) {
  const severityColors = {
    high: "#c53030",
    medium: "#c05621",
    low: "#b7791f",
    info: "#2b6cb0",
  };
  const color = severityColors[f.severity];

  return (
    <section
      style={{
        border: `1px solid ${color}`,
        borderRadius: "8px",
        padding: "1rem 1.25rem",
        marginBottom: "1rem",
        background: "#fafafa",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <span
          style={{
            fontSize: "0.75rem",
            fontWeight: 600,
            textTransform: "uppercase",
            color,
          }}
        >
          {f.severity}
        </span>
        <span style={{ color: "#666", fontSize: "0.875rem" }}>
          #{index + 1} · {f.file}
          {f.line != null ? ` (line ${f.line})` : ""}
        </span>
      </div>
      <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.125rem" }}>{f.title}</h3>
      <p style={{ margin: "0 0 0.75rem", lineHeight: 1.5, color: "#333" }}>
        {f.explanation}
      </p>
      <p style={{ margin: "0 0 0.75rem", lineHeight: 1.5 }}>
        <strong>Why it matters:</strong> {f.whyItMatters}
      </p>
      <p style={{ margin: 0, lineHeight: 1.5 }}>
        <strong>What to do:</strong> {f.fixSuggestion}
      </p>
    </section>
  );
}

const sectionStyle = { padding: "3rem 1.5rem", maxWidth: "720px", margin: "0 auto" } as const;

function ScanPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");
  const couponToken = searchParams.get("coupon_token");
  const [paymentValid, setPaymentValid] = useState<boolean | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) {
      fetch(`/api/verify-session?session_id=${encodeURIComponent(sessionId)}`)
        .then((res) => res.json())
        .then((data: { valid?: boolean }) => {
          if (data.valid) setPaymentValid(true);
          else router.replace("/checkout");
        })
        .catch(() => router.replace("/checkout"));
      return;
    }
    if (couponToken) {
      fetch(`/api/verify-coupon?token=${encodeURIComponent(couponToken)}`)
        .then((res) => res.json())
        .then((data: { valid?: boolean }) => {
          if (data.valid) setPaymentValid(true);
          else router.replace("/checkout");
        })
        .catch(() => router.replace("/checkout"));
      return;
    }
    router.replace("/checkout");
  }, [sessionId, couponToken, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Please select a zip file.");
      return;
    }
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.set("file", file);
      if (sessionId) formData.set("session_id", sessionId);
      else if (couponToken) formData.set("coupon_token", couponToken);

      const res = await fetch("/api/scan", {
        method: "POST",
        body: formData,
      });

      const data = (await res.json()) as Record<string, unknown>;

      if (!res.ok) {
        const msg = data.error ?? data.detail ?? `Request failed: ${res.status}`;
        setError(typeof msg === "string" ? msg : String(msg));
        return;
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setLoading(false);
    }
  }

  const findings: ReportFinding[] = result ? buildReport(result) : [];
  const hasFindings = findings.length > 0;

  if (paymentValid === null) {
    return (
      <main style={{ ...sectionStyle, paddingTop: "2.5rem", textAlign: "center" }}>
        <p style={{ color: "#64748b" }}>Checking payment…</p>
      </main>
    );
  }

  if (!paymentValid) {
    return (
      <main style={{ ...sectionStyle, paddingTop: "2.5rem", textAlign: "center" }}>
        <p style={{ color: "#64748b" }}>Checking…</p>
      </main>
    );
  }

  return (
    <main
      style={{
        ...sectionStyle,
        paddingTop: "2.5rem",
        paddingBottom: "4rem",
        background: "#f8fafc",
        minHeight: "60vh",
      }}
    >
      <h1 style={{ fontSize: "1.5rem", fontWeight: 600, margin: "0 0 0.5rem", color: "#1e293b" }}>
        Run your Vibe Scan
      </h1>
      <p style={{ color: "#64748b", margin: "0 0 1.5rem", fontSize: "0.9375rem" }}>
        Upload a zip of your app code. We'll check it for issues and explain everything in plain English.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "0.75rem",
          marginBottom: "1rem",
        }}
      >
        <input
          type="file"
          accept=".zip"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setError(null);
          }}
          style={{ fontSize: "0.9375rem" }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "0.5rem 1.25rem",
            fontSize: "0.9375rem",
            fontWeight: 600,
            color: "white",
            background: "#0f766e",
            border: "none",
            borderRadius: "6px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Scanning…" : "Scan"}
        </button>
      </form>

      {error && (
        <p style={{ color: "#c53030", marginTop: "0.5rem", fontSize: "0.9375rem" }}>{error}</p>
      )}

      {result && !error && (
        <div style={{ marginTop: "2rem" }}>
          {hasFindings ? (
            <>
              <h2 style={{ fontSize: "1.125rem", marginBottom: "0.5rem", color: "#1e293b" }}>
                We found {findings.length} {findings.length === 1 ? "issue" : "issues"}
              </h2>
              <p style={{ color: "#64748b", marginBottom: "1.25rem", fontSize: "0.9375rem" }}>
                Each one is explained below in simple terms, with why it matters and what to do next.
              </p>
              {findings.map((f, i) => (
                <FindingCard key={`${f.file}-${f.line}-${i}`} f={f} index={i} />
              ))}
            </>
          ) : (
            <p style={{ fontSize: "1.0625rem", color: "#0f766e", fontWeight: 500 }}>
              No security issues were found. Your code looks good from this scan.
            </p>
          )}
        </div>
      )}

      <p style={{ marginTop: "2rem", fontSize: "0.875rem", color: "#64748b" }}>
        <Link href="/pricing" style={{ color: "#0f766e", textDecoration: "none" }}>
          One-time scan — $9. No subscription.
        </Link>
      </p>
    </main>
  );
}

export default function ScanPage() {
  return (
    <Suspense fallback={
      <main style={{ ...sectionStyle, paddingTop: "2.5rem", textAlign: "center" }}>
        <p style={{ color: "#64748b" }}>Loading…</p>
      </main>
    }>
      <ScanPageContent />
    </Suspense>
  );
}
```

### src/app/api/scan/route.ts

```ts
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
```

### src/app/api/validate-coupon/route.ts

```ts
import { NextRequest, NextResponse } from "next/server";
import { isCodeValidForBypass, signToken } from "@/lib/coupon";

export async function POST(request: NextRequest) {
  let body: { code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ valid: false }, { status: 400 });
  }
  const code = typeof body?.code === "string" ? body.code.trim().toUpperCase() : "";
  if (!code) {
    return NextResponse.json({ valid: false }, { status: 200 });
  }
  if (!isCodeValidForBypass(code)) {
    return NextResponse.json({ valid: false }, { status: 200 });
  }
  const token = signToken(code);
  if (!token) {
    return NextResponse.json(
      { valid: false, error: "Coupon signing not configured." },
      { status: 500 }
    );
  }
  return NextResponse.json({ valid: true, token });
}
```

### src/app/api/verify-coupon/route.ts

```ts
import { NextRequest, NextResponse } from "next/server";
import { verifyCouponToken } from "@/lib/coupon";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token || typeof token !== "string") {
    return NextResponse.json({ valid: false }, { status: 200 });
  }
  const result = verifyCouponToken(token);
  return NextResponse.json({ valid: result.valid }, { status: 200 });
}
```

### Environment variables

| Variable | Required | Purpose |
|----------|----------|--------|
| `STRIPE_SECRET_KEY` | Yes (for payment) | Create Checkout Sessions, verify paid sessions. Also used as fallback for coupon signing if `COUPON_SECRET` is unset. |
| `NEXT_PUBLIC_APP_URL` | Yes (production) | Base URL for Stripe success/cancel redirects (e.g. `https://vibescan.co`). |
| `COUPON_SECRET` | No | Signs coupon tokens. If unset, `STRIPE_SECRET_KEY` is used. |
| `SCAN_SERVICE_URL` | No (production scan) | When set, POST /api/scan forwards the zip to this URL instead of running Semgrep locally. |

Example `.env.local` (do not commit real keys):

```
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 3. Deviations from the original plan

- **Scan page protection:** The plan originally had a “Payment required” block with a CTA link. Implemented as a **simple redirect** to `/checkout` when there is no valid `session_id` or `coupon_token` (or verification fails). No “Payment required” copy; minimal by design for future Supabase auth replacement.
- **Coupon token:** No expiry. Validity is re-checked on every use (scan page load and scan API) against the **current** `VALID_COUPON_CODES` list in `src/lib/coupon.ts`. Revoke by removing the code (or setting `bypassPayment: false`) and redeploying.
- **Checkout:** No auto-redirect to Stripe on load; user sees coupon field and “Continue to payment — $9” explicitly.

---

## 4. Current known issues / TODOs

- **Auth:** Scan access is intentionally minimal (URL params + redirect). To be replaced with **Supabase authentication** later.
- **Coupon reuse:** A valid coupon token can be used for multiple scans (no “one scan per coupon” limit). Could be added later (e.g. with Supabase or a usage table).
- No `TODO`/`FIXME` comments in `src/`; product-level follow-ups: add Supabase auth, optionally enforce one scan per coupon if desired.
