"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { buildReport, type ReportFinding } from "@/lib/semgrep-report";
import { createClient } from "@/lib/supabase/client";
import Container from "@/components/ui/Container";
import Card from "@/components/ui/Card";

function FindingCard({ f, index }: { f: ReportFinding; index: number }) {
  const [copied, setCopied] = useState(false);
  const severityColors: Record<string, string> = {
    critical: "#b91c1c",
    high: "var(--danger)",
    medium: "var(--warn)",
    low: "var(--warn)",
    info: "var(--brand)",
  };
  const color = severityColors[f.severity] ?? "var(--text-muted)";
  const scannerLabel = f.scanner === "gitleaks" ? "Gitleaks" : "Semgrep";

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
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
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
        <span
          style={{
            fontSize: "0.6875rem",
            color: "var(--text-muted)",
            textTransform: "capitalize",
            padding: "0.1rem 0.35rem",
            border: "1px solid var(--border)",
            borderRadius: "4px",
          }}
        >
          {scannerLabel}
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
      <p style={{ margin: "0.75rem 0 0.5rem", fontSize: "0.875rem", fontWeight: 500, color: "var(--text)" }}>
        Copy this prompt into your AI coding tool:
      </p>
      <div
        style={{
          background: "#f1f5f9",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          padding: "1rem 1.25rem",
          marginBottom: "0.75rem",
          fontFamily: "inherit",
          fontSize: "0.875rem",
          lineHeight: 1.6,
          color: "var(--text)",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {f.fixPrompt}
      </div>
      <button
        type="button"
        onClick={handleCopy}
        style={{
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
  const [ready, setReady] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creditsChecked, setCreditsChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/auth?next=/scan");
        return;
      }

      if (sessionId) {
        const res = await fetch("/api/credit-from-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId }),
        });
        if (res.ok) {
          if (typeof window !== "undefined" && window.history.replaceState) {
            window.history.replaceState({}, "", "/scan");
          }
        }
      }

      const credRes = await fetch("/api/credits");
      if (cancelled) return;
      if (credRes.status === 401) {
        router.replace("/auth?next=/scan");
        return;
      }
      const credData = (await credRes.json()) as { credits?: number };
      const credits = credData.credits ?? 0;
      setCreditsChecked(true);
      if (credits === 0) {
        router.replace("/pricing");
        return;
      }
      setReady(true);
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [sessionId, router]);

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

  const findings: ReportFinding[] = Array.isArray(result?.report)
    ? (result.report as ReportFinding[])
    : result
      ? buildReport(result)
      : [];
  const hasFindings = findings.length > 0;

  if (!creditsChecked || !ready) {
    return (
      <main style={{ ...sectionPadding, textAlign: "center" }}>
        <Container>
          <p style={{ color: "var(--text-muted)" }}>Checking credits…</p>
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
          Upload a zip of your app code. We’ll check it for issues and explain everything in plain English. One credit will be used.
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
            <Link href="/dashboard" style={{ color: "var(--brand)", textDecoration: "none" }}>Dashboard</Link>
            {" · "}
            <Link href="/pricing" style={{ color: "var(--brand)", textDecoration: "none" }}>Get more credits</Link>
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
          <Link href="/dashboard" style={{ color: "var(--brand)", textDecoration: "none" }}>
            View all scans in dashboard
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
