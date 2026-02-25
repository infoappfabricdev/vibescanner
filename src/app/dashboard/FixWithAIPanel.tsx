"use client";

import { useState } from "react";

function buildFixPrompt(
  title: string,
  file: string,
  line: number | null,
  description: string,
  existingPrompt: string
): string {
  if (existingPrompt && existingPrompt.trim()) {
    return existingPrompt.trim();
  }
  const location = line != null ? `${file} (line ${line})` : file;
  return `You are fixing a security issue in a codebase.

Issue:
${title}

Location:
${location}

Description:
${description}

Fix this issue securely. Return only the updated code.`;
}

type Props = {
  title: string;
  explanation: string;
  whyItMatters: string;
  fixPrompt: string;
  file: string;
  line: number | null;
  codeSnippet?: string;
};

export default function FixWithAIPanel({
  title,
  explanation,
  whyItMatters,
  fixPrompt,
  file,
  line,
  codeSnippet,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const promptText = buildFixPrompt(title, file, line, explanation, fixPrompt);

  function handleCopyPrompt() {
    navigator.clipboard.writeText(promptText);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  }

  function handleCopyCode() {
    if (codeSnippet) {
      navigator.clipboard.writeText(codeSnippet);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  }

  return (
    <div style={{ flex: "1 1 auto", minWidth: 0 }}>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        style={{
          display: "inline-block",
          padding: "0.5rem 1.25rem",
          fontSize: "0.875rem",
          fontWeight: 500,
          color: "#fff",
          background: "var(--brand)",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          boxShadow: "0 1px 2px rgba(37, 99, 235, 0.2)",
        }}
      >
        {expanded ? "Hide fix" : "Show fix"}
      </button>
      {expanded && (
        <div
          style={{
            marginTop: "1rem",
            padding: "1.25rem 1.5rem",
            background: "#f9fafb",
            border: "1px solid var(--border)",
            borderRadius: "12px",
          }}
        >
          <h4
            style={{
              margin: "0 0 1rem",
              fontSize: "1rem",
              fontWeight: 600,
              color: "var(--text)",
            }}
          >
            How to fix this
          </h4>

          <section style={{ marginBottom: "1.25rem" }}>
            <h5
              style={{
                margin: "0 0 0.375rem",
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.02em",
              }}
            >
              What&apos;s happening
            </h5>
            <p
              style={{
                margin: 0,
                fontSize: "0.875rem",
                lineHeight: 1.6,
                color: "var(--text)",
              }}
            >
              {explanation}
            </p>
          </section>

          <section style={{ marginBottom: "1.25rem" }}>
            <h5
              style={{
                margin: "0 0 0.375rem",
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.02em",
              }}
            >
              Why this matters
            </h5>
            <p
              style={{
                margin: 0,
                fontSize: "0.875rem",
                lineHeight: 1.6,
                color: "var(--text)",
              }}
            >
              {whyItMatters}
            </p>
          </section>

          {codeSnippet && (
            <section style={{ marginBottom: "1.25rem" }}>
              <h5
                style={{
                  margin: "0 0 0.375rem",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.02em",
                }}
              >
                Problematic code
              </h5>
              <pre
                style={{
                  margin: "0 0 0.5rem",
                  padding: "1rem 1.25rem",
                  background: "#fff",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "0.8125rem",
                  lineHeight: 1.5,
                  overflow: "auto",
                  color: "var(--text)",
                  fontFamily: "var(--font-mono), ui-monospace, monospace",
                }}
              >
                {codeSnippet}
              </pre>
              <button
                type="button"
                onClick={handleCopyCode}
                style={{
                  padding: "0.375rem 0.75rem",
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  color: "var(--text)",
                  background: "#fff",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                {copiedCode ? "Copied!" : "Copy code"}
              </button>
            </section>
          )}

          <section>
            <h5
              style={{
                margin: "0 0 0.5rem",
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.02em",
              }}
            >
              Fix prompt (copy into your AI tool)
            </h5>
            <pre
              style={{
                margin: "0 0 0.75rem",
                padding: "1rem 1.25rem",
                background: "#fff",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                fontSize: "0.8125rem",
                lineHeight: 1.5,
                overflow: "auto",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                color: "var(--text)",
                fontFamily: "var(--font-mono), ui-monospace, monospace",
              }}
            >
              {promptText}
            </pre>
            <button
              type="button"
              onClick={handleCopyPrompt}
              style={{
                padding: "0.5rem 1rem",
                fontSize: "0.8125rem",
                fontWeight: 500,
                color: "#fff",
                background: "var(--brand)",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              {copiedPrompt ? "Copied!" : "Copy prompt"}
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
