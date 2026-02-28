"use client";

import { useState } from "react";
import type { ReportFinding } from "@/lib/semgrep-report";
import type { FalsePositiveLikelihood } from "../../types";
import CopyFixPromptButton, { FixPromptDisclaimer } from "@/components/ui/CopyFixPromptButton";

type FindingWithFP = ReportFinding & {
  false_positive_likelihood?: FalsePositiveLikelihood | null;
  false_positive_reason?: string | null;
};

export default function ReportFindingCard({
  f,
  index,
  findingId,
}: {
  f: FindingWithFP;
  index: number;
  findingId?: string | null;
}) {
  const severityColors: Record<string, string> = {
    critical: "#b91c1c",
    high: "var(--danger)",
    medium: "var(--warn)",
    low: "var(--warn)",
    info: "var(--brand)",
  };
  const fpLikelihood = f.false_positive_likelihood ?? null;
  const isPossibleOrLikelyFp =
    fpLikelihood === "possible_fp" || fpLikelihood === "likely_fp";
  const borderColor = isPossibleOrLikelyFp
    ? "#2563eb"
    : severityColors[f.severity] ?? "var(--text-muted)";
  const scannerLabel = f.scanner === "gitleaks" ? "Gitleaks" : "Semgrep";

  const [feedbackVerdict, setFeedbackVerdict] = useState<"confirmed_fp" | "not_fp" | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  async function submitFeedback(verdict: "confirmed_fp" | "not_fp") {
    if (!findingId || feedbackVerdict != null) return;
    setFeedbackLoading(true);
    try {
      const res = await fetch("/api/false-positive-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ finding_id: findingId, user_verdict: verdict }),
      });
      if (res.ok) setFeedbackVerdict(verdict);
    } finally {
      setFeedbackLoading(false);
    }
  }

  return (
    <section
      style={{
        border: `1px solid ${borderColor}`,
        borderRadius: "12px",
        padding: "1.5rem 1.75rem",
        marginBottom: "1.25rem",
        background: isPossibleOrLikelyFp ? "rgba(37, 99, 235, 0.04)" : "#ffffff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
        <span
          style={{
            fontSize: "0.75rem",
            fontWeight: 600,
            textTransform: "uppercase",
            color: borderColor,
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
      {fpLikelihood === "likely_fp" && (
        <div style={{ marginBottom: "0.75rem" }}>
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "#2563eb",
              padding: "0.2rem 0.5rem",
              borderRadius: "4px",
              background: "rgba(37, 99, 235, 0.12)",
            }}
          >
            Likely false positive
          </span>
          {f.false_positive_reason && (
            <p style={{ margin: "0.35rem 0 0", fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
              {f.false_positive_reason}
            </p>
          )}
        </div>
      )}
      {fpLikelihood === "possible_fp" && (
        <div style={{ marginBottom: "0.75rem" }}>
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "#2563eb",
              padding: "0.2rem 0.5rem",
              borderRadius: "4px",
              background: "rgba(37, 99, 235, 0.12)",
            }}
          >
            Possibly false positive
          </span>
          {f.false_positive_reason && (
            <p style={{ margin: "0.35rem 0 0", fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
              {f.false_positive_reason}
            </p>
          )}
        </div>
      )}
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
      <div className="no-print">
        <FixPromptDisclaimer />
        <div style={{ marginTop: "0.75rem" }}>
          <CopyFixPromptButton fixPrompt={f.fixPrompt} />
        </div>
      </div>
      {findingId && isPossibleOrLikelyFp && (
        <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Was this a false positive?</span>
          {feedbackVerdict === "confirmed_fp" ? (
            <span style={{ fontSize: "0.8125rem", color: "var(--success)" }}>✓ Yes, false positive</span>
          ) : feedbackVerdict === "not_fp" ? (
            <span style={{ fontSize: "0.8125rem", color: "var(--text)" }}>✗ No, real issue</span>
          ) : (
            <>
              <button
                type="button"
                onClick={() => submitFeedback("confirmed_fp")}
                disabled={feedbackLoading}
                style={{
                  fontSize: "0.8125rem",
                  padding: "0.25rem 0.5rem",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  background: "#fff",
                  cursor: feedbackLoading ? "not-allowed" : "pointer",
                  color: "var(--text)",
                }}
              >
                ✓ Yes, false positive
              </button>
              <button
                type="button"
                onClick={() => submitFeedback("not_fp")}
                disabled={feedbackLoading}
                style={{
                  fontSize: "0.8125rem",
                  padding: "0.25rem 0.5rem",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  background: "#fff",
                  cursor: feedbackLoading ? "not-allowed" : "pointer",
                  color: "var(--text)",
                }}
              >
                ✗ No, real issue
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
