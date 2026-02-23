"use client";

import { useState } from "react";
import Link from "next/link";
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

export default function ScanPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const findings: ReportFinding[] = result ? buildReport(result) : [];
  const hasFindings = findings.length > 0;

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
        Upload a zip of your app code. We’ll check it for issues and explain everything in plain English.
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
