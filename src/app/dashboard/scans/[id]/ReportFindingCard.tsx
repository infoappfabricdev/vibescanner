"use client";

import type { ReportFinding } from "@/lib/semgrep-report";
import CopyFixPromptButton, { FixPromptDisclaimer } from "@/components/ui/CopyFixPromptButton";

export default function ReportFindingCard({ f, index }: { f: ReportFinding; index: number }) {
  const severityColors: Record<string, string> = {
    critical: "#b91c1c",
    high: "var(--danger)",
    medium: "var(--warn)",
    low: "var(--warn)",
    info: "var(--brand)",
  };
  const color = severityColors[f.severity] ?? "var(--text-muted)";
  const scannerLabel = f.scanner === "gitleaks" ? "Gitleaks" : "Semgrep";

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
      <p style={{ margin: "0 0 0.75rem", lineHeight: 1.625, color: "var(--text)" }}>{f.explanation}</p>
      <p style={{ margin: "0 0 0.75rem", lineHeight: 1.625, color: "var(--text)" }}>
        <strong>Why it matters:</strong> {f.whyItMatters}
      </p>
      <p style={{ margin: "0 0 0.75rem", lineHeight: 1.625, color: "var(--text)" }}>
        <strong>What to do:</strong> {f.fixSuggestion}
      </p>
      <div
        style={{
          background: "#f1f5f9",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          padding: "1rem 1.25rem",
          marginTop: "0.75rem",
          fontSize: "0.875rem",
          lineHeight: 1.6,
          color: "var(--text)",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {f.fixPrompt}
      </div>
      <FixPromptDisclaimer />
      <div style={{ marginTop: "0.75rem" }}>
        <CopyFixPromptButton fixPrompt={f.fixPrompt} />
      </div>
    </section>
  );
}
