"use client";

import { useState } from "react";
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

export default function Home() {
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
    <main style={{ maxWidth: "720px", margin: "0 auto" }}>
      <h1>VibeScan</h1>
      <p>Upload a zip of your app code to run a security scan. We’ll explain any issues in plain English.</p>

      <form onSubmit={handleSubmit} style={{ marginTop: "1rem" }}>
        <input
          type="file"
          accept=".zip"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setError(null);
          }}
        />
        <button type="submit" disabled={loading} style={{ marginLeft: "0.5rem" }}>
          {loading ? "Scanning…" : "Scan"}
        </button>
      </form>

      {error && (
        <p style={{ color: "#c53030", marginTop: "1rem" }}>{error}</p>
      )}

      {result && !error && (
        <div style={{ marginTop: "2rem" }}>
          {hasFindings ? (
            <>
              <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>
                We found {findings.length} {findings.length === 1 ? "issue" : "issues"}
              </h2>
              <p style={{ color: "#555", marginBottom: "1.5rem" }}>
                Each one is explained below in simple terms, with why it matters and what to do next.
              </p>
              {findings.map((f, i) => (
                <FindingCard key={`${f.file}-${f.line}-${i}`} f={f} index={i} />
              ))}
            </>
          ) : (
            <p style={{ fontSize: "1.125rem", color: "#276749" }}>
              No security issues were found. Your code looks good from this scan.
            </p>
          )}
        </div>
      )}
    </main>
  );
}
