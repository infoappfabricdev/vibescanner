"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { buildReport, type ReportFinding } from "@/lib/semgrep-report";
import Container from "@/components/ui/Container";
import Card from "@/components/ui/Card";

function FindingCard({ f, index }: { f: ReportFinding; index: number }) {
  const [copied, setCopied] = useState(false);
  const severityColors: Record<string, string> = {
    high: "var(--danger)",
    medium: "var(--warn)",
    low: "var(--warn)",
    info: "var(--brand)",
  };
  const color = severityColors[f.severity] ?? "var(--text-muted)";

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(f.fixPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <section
      style={{
        border: `1px solid ${color}`,
        borderRadius: "12px",
        padding: "1.5rem 1.75rem",
        marginBottom: "1.25rem",
        background: "#ffffff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
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
        <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
          #{index + 1} · {f.file}
          {f.line != null ? ` (line ${f.line})` : ""}
        </span>
      </div>
      <h3 style={{ margin: "0 0 0.5rem", color: "var(--text)" }}>{f.title}</h3>
      <p style={{ margin: "0 0 0.75rem", lineHeight: 1.625, color: "var(--text)" }}>
        {f.explanation}
      </p>
      <p style={{ margin: "0 0 0.75rem", lineHeight: 1.625, color: "var(--text)" }}>
        <strong>Why it matters:</strong> {f.whyItMatters}
      </p>
      <p style={{ margin: "0 0 0.75rem", lineHeight: 1.625, color: "var(--text)" }}>
        <strong>What to do:</strong> {f.fixSuggestion}
      </p>
      <button
        type="button"
        onClick={handleCopy}
        style={{
          marginTop: "0.75rem",
          padding: "0.5rem 0.75rem",
          fontSize: "0.875rem",
          fontWeight: 500,
          color: "var(--brand)",
          background: "transparent",
          border: "1px solid var(--brand)",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        {copied ? "Copied!" : "Copy prompt for AI tool"}
      </button>
    </section>
  );
}

const sectionPadding = { paddingTop: "4rem", paddingBottom: "4rem" } as const;

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
      <main style={{ ...sectionPadding, textAlign: "center" }}>
        <Container>
          <p style={{ color: "var(--text-muted)" }}>Checking payment…</p>
        </Container>
      </main>
    );
  }

  if (!paymentValid) {
    return (
      <main style={{ ...sectionPadding, textAlign: "center" }}>
        <Container>
          <p style={{ color: "var(--text-muted)" }}>Checking…</p>
        </Container>
      </main>
    );
  }

  return (
    <main
      style={{
        ...sectionPadding,
        background: "var(--bg)",
        minHeight: "60vh",
      }}
    >
      <Container>
        <h1 style={{ margin: "0 0 0.5rem", color: "var(--text)" }}>
          Run your Vibe Scan
        </h1>
        <p style={{ color: "var(--text-muted)", margin: "0 0 1.5rem", fontSize: "0.9375rem" }}>
          Upload a zip of your app code. We’ll check it for issues and explain everything in plain English.
        </p>

        <Card style={{ marginBottom: "2rem" }}>
          <p style={{ margin: "0 0 1.25rem", fontSize: "1rem", color: "var(--text)", lineHeight: 1.625 }}>
            Select a .zip of your project (e.g. from Lovable, Bolt, or Cursor), then start the scan. Results usually appear within a few minutes.
          </p>
          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "0.75rem",
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
              className="btn-primary"
              style={{
                padding: "0.75rem 1.5rem",
                fontSize: "0.9375rem",
                fontWeight: 500,
                color: "white",
                background: "#2563EB",
                border: "none",
                borderRadius: "8px",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Scanning…" : "Run Vibe Scan"}
            </button>
          </form>
          <p style={{ margin: "1rem 0 0", fontSize: "0.875rem", color: "var(--text-muted)" }}>
            $9 per scan. One-time charge. No subscription.
          </p>
        </Card>

        {error && (
          <p style={{ color: "var(--danger)", marginTop: "0.5rem", fontSize: "0.9375rem" }}>{error}</p>
        )}

        {result && !error && (
          <div style={{ marginTop: "2rem" }}>
            {hasFindings ? (
              <>
                <h2 style={{ marginBottom: "0.5rem", color: "var(--text)" }}>
                  We found {findings.length} {findings.length === 1 ? "issue" : "issues"}
                </h2>
                <p style={{ color: "var(--text-muted)", marginBottom: "1.25rem", fontSize: "0.9375rem" }}>
                  Each one is explained below in simple terms, with why it matters and what to do next.
                </p>
                {findings.map((f, i) => (
                  <FindingCard key={`${f.file}-${f.line}-${i}`} f={f} index={i} />
                ))}
              </>
            ) : (
              <p style={{ fontSize: "1.0625rem", color: "var(--success)", fontWeight: 500 }}>
                No security issues were found. Your code looks good from this scan.
              </p>
            )}
          </div>
        )}

        <p style={{ marginTop: "2rem", fontSize: "0.875rem", color: "var(--text-muted)" }}>
          <Link href="/pricing" style={{ color: "var(--brand)", textDecoration: "none" }}>
            One-time scan — $9. No subscription.
          </Link>
        </p>
      </Container>
    </main>
  );
}

export default function ScanPage() {
  return (
    <Suspense fallback={
      <main style={{ ...sectionPadding, textAlign: "center" }}>
        <Container>
          <p style={{ color: "var(--text-muted)" }}>Loading…</p>
        </Container>
      </main>
    }>
      <ScanPageContent />
    </Suspense>
  );
}
