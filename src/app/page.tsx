"use client";

import { useState } from "react";
import Container from "@/components/ui/Container";
import { ButtonPrimary, ButtonSecondary } from "@/components/ui/Button";

const sectionPadding = { paddingTop: "4rem", paddingBottom: "4rem" } as const;

const FIX_PROMPT_EXAMPLE = `You are a senior security engineer. Fix this issue safely.

Issue: Detect Non Literal Regexp (ReDoS risk)
File: src/lib/highlightText.tsx (line 25)

Current code:
const re = new RegExp(userInput, "i");

Goal:
Prevent user-controlled input from creating a dynamic RegExp.

Fix:
- Do NOT pass raw user input into new RegExp().
- Replace with one of:
  A) Escape userInput so it becomes a literal match, OR
  B) Use a safe allowlist of patterns, OR
  C) Avoid RegExp entirely (e.g., string includes) if possible.
- Keep existing behavior and add/adjust tests if needed.

Return:
1) The updated code (minimal diff)
2) A brief explanation of why this is safer`;

const TYPICAL_OUTPUT_TEXT = `Rule: js.security.audit.detect-non-literal-regexp
Severity: WARNING

Message:
RegExp() called with a $ARG function argument. This may allow an attacker to trigger a Regular Expression Denial of Service (ReDoS), as regex evaluation can block the main thread.

If user-controlled input is used, this can lead to application slowdown or unresponsiveness. It is recommended to avoid dynamic regex construction or ensure that inputs are properly validated.

Consider using safe, pre-defined patterns, or a validation/sanitization library to mitigate potential ReDoS vulnerabilities.`;

const BOX_PADDING = "1.25rem";
const BOX_RADIUS = "8px";
const BODY_FONT_SIZE = "0.875rem";
const BODY_LINE_HEIGHT = 1.5;

export default function Home() {
  const [fixPromptCopied, setFixPromptCopied] = useState(false);

  function copyFixPrompt() {
    navigator.clipboard.writeText(FIX_PROMPT_EXAMPLE).then(() => {
      setFixPromptCopied(true);
      setTimeout(() => setFixPromptCopied(false), 2000);
    });
  }
  return (
    <>
      {/* Hero */}
      <section
        style={{
          padding: "5rem 1.5rem 5rem",
          textAlign: "center",
          background: "linear-gradient(180deg, #eff6ff 0%, var(--bg) 100%)",
        }}
      >
        <Container>
          <div style={{ maxWidth: "42rem", margin: "0 auto" }}>
            <h1 style={{ margin: "0 0 1.5rem", color: "var(--text)" }}>
              Is your app safe to launch?
            </h1>
            <p
              style={{
                fontSize: "1.125rem",
                color: "var(--text-muted)",
                margin: 0,
                lineHeight: 1.625,
              }}
            >
              Find security issues — and get copy-paste fix prompts you can run in your AI coding tool.
            </p>
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--text-muted)",
                margin: "0.5rem 0 0",
                lineHeight: 1.5,
                opacity: 0.9,
              }}
            >
              Built for AI-built apps, indie hackers, and fast-moving teams.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap", marginTop: "2.5rem" }}>
              <ButtonPrimary href="/checkout">Run a Vibe Scan — $9</ButtonPrimary>
              <ButtonSecondary href="/how-it-works">See how it works</ButtonSecondary>
            </div>
          </div>
        </Container>
      </section>

      {/* Why VibeScan */}
      <section style={{ ...sectionPadding, borderTop: "1px solid #E2E8F0" }}>
        <Container>
          <h2 style={{ margin: "0 0 2rem", color: "var(--text)", textAlign: "center" }}>
            Most tools tell you what&apos;s wrong. VibeScan gives you the fix.
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "2rem",
            }}
          >
            <div>
              <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.0625rem", fontWeight: 600, color: "var(--text)" }}>
                Plain English, not jargon
              </h3>
              <p style={{ margin: 0, fontSize: "0.9375rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
                We explain each issue in simple terms — no security expertise required.
              </p>
            </div>
            <div>
              <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.0625rem", fontWeight: 600, color: "var(--text)" }}>
                Fix prompts you can paste
              </h3>
              <p style={{ margin: 0, fontSize: "0.9375rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
                Copy-paste prompts to fix issues in Cursor, ChatGPT, or your dev workflow.
              </p>
            </div>
            <div>
              <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.0625rem", fontWeight: 600, color: "var(--text)" }}>
                Fix issues in minutes
              </h3>
              <p style={{ margin: 0, fontSize: "0.9375rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
                Run a scan and start fixing problems right away.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Why VibeScan is different */}
      <section
        style={{
          ...sectionPadding,
          borderTop: "1px solid #E2E8F0",
          background: "var(--bg)",
        }}
      >
        <Container>
          <h2 style={{ margin: "0 0 0.5rem", color: "var(--text)", textAlign: "center" }}>
            Most tools tell you what&apos;s wrong.
            <br />
            VibeScan gives you the fix.
          </h2>
          <p style={{ color: "var(--text-muted)", margin: "0 0 2rem", fontSize: "1rem", lineHeight: 1.625, textAlign: "center" }}>
            We turn security findings into copy-paste fix prompts you can run in your AI coding tool.
          </p>

          {/* Single comparison module: LEFT = bad, RIGHT = good */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              padding: "1.5rem",
              overflow: "hidden",
            }}
          >
            <div className="comparison-columns">
              {/* LEFT column: Most tools (bad) */}
              <div style={{ minWidth: 0 }}>
                <div style={{ marginBottom: "0.75rem" }}>
                  <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text)" }}>Most tools</div>
                  <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-muted)", marginTop: "0.25rem", opacity: 0.95 }}>Built for security engineers</div>
                </div>
                <div
                  style={{
                    padding: "1.25rem",
                    borderRadius: "8px",
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    marginBottom: "1rem",
                  }}
                >
                  <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none", fontSize: "0.9375rem", color: "var(--text-muted)", lineHeight: 1.75 }}>
                    <li>❌ Technical jargon</li>
                    <li>❌ Hard to understand severity</li>
                    <li>❌ No actionable fixes</li>
                    <li>❌ Requires security expertise</li>
                    <li>❌ Long, unstructured reports</li>
                  </ul>
                </div>
                <div style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                  What most tools give you
                </div>
                <div
                  style={{
                    padding: BOX_PADDING,
                    borderRadius: BOX_RADIUS,
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  }}
                >
                  <div style={{ fontSize: BODY_FONT_SIZE, fontWeight: 600, color: "var(--text)", marginBottom: "0.5rem" }}>
                    Typical output
                  </div>
                  <pre
                    style={{
                      margin: 0,
                      fontFamily: "var(--font-mono), ui-monospace, monospace",
                      fontSize: BODY_FONT_SIZE,
                      lineHeight: BODY_LINE_HEIGHT,
                      color: "var(--text)",
                      wordBreak: "break-word",
                      whiteSpace: "pre-wrap",
                      overflow: "auto",
                    }}
                  >
                    {TYPICAL_OUTPUT_TEXT}
                  </pre>
                </div>
              </div>

              {/* RIGHT column: VibeScan (good) */}
              <div style={{ minWidth: 0 }}>
                <div style={{ marginBottom: "0.75rem" }}>
                  <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--brand)" }}>VibeScan</div>
                  <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-muted)", marginTop: "0.25rem", opacity: 0.95 }}>Built for AI developers</div>
                </div>
                <div
                  style={{
                    padding: "1.25rem",
                    borderRadius: "8px",
                    background: "#eff6ff",
                    border: "1px solid var(--brand)",
                    marginBottom: "1rem",
                  }}
                >
                  <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none", fontSize: "0.9375rem", color: "var(--text)", lineHeight: 1.75 }}>
                    <li>✅ Plain English explanations</li>
                    <li>✅ Clear risk explanations</li>
                    <li>✅ Copy-paste fix prompts</li>
                    <li>✅ Works with your AI coding tools</li>
                    <li>✅ Prioritized, actionable report</li>
                  </ul>
                </div>
                <div style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                  What you actually need
                </div>
                <div
                  style={{
                    padding: BOX_PADDING,
                    borderRadius: BOX_RADIUS,
                    background: "#eff6ff",
                    border: "1px solid var(--brand)",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  }}
                >
                  <div style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                    Plain-English explanation
                  </div>
                  <div style={{ fontSize: BODY_FONT_SIZE, lineHeight: BODY_LINE_HEIGHT, color: "var(--text)" }}>
                    <div style={{ marginBottom: "0.5rem" }}><strong>Problem:</strong> User input is used inside a regex.</div>
                    <div style={{ marginBottom: "0.5rem" }}><strong>Why it matters:</strong> An attacker could cause your app to hang or crash.</div>
                    <div><strong>What to do:</strong> Validate or sanitize the input before using it in RegExp.</div>
                  </div>
                  <div style={{ borderTop: "1px solid var(--border)", marginTop: "1rem", marginBottom: "1rem", paddingTop: "1rem" }} />
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>
                      Fix prompt (copy/paste)
                    </div>
                    <button
                      type="button"
                      onClick={copyFixPrompt}
                      style={{
                        padding: "0.375rem 0.75rem",
                        fontSize: BODY_FONT_SIZE,
                        fontWeight: 500,
                        borderRadius: "8px",
                        color: "#fff",
                        background: "var(--brand)",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      {fixPromptCopied ? "Copied" : "Copy prompt"}
                    </button>
                  </div>
                  <pre
                    style={{
                      margin: 0,
                      padding: "0.75rem 1rem",
                      borderRadius: "6px",
                      background: "#ffffff",
                      border: "1px solid var(--brand)",
                      fontFamily: "var(--font-mono), ui-monospace, monospace",
                      fontSize: BODY_FONT_SIZE,
                      lineHeight: BODY_LINE_HEIGHT,
                      color: "var(--text)",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      overflow: "auto",
                    }}
                  >
                    {FIX_PROMPT_EXAMPLE}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Trust strip */}
      <section
        style={{
          padding: "4rem 1.5rem",
          borderTop: "1px solid #E2E8F0",
          background: "#ffffff",
        }}
      >
        <Container>
          <p
            style={{
              margin: 0,
              textAlign: "center",
              fontSize: "0.9375rem",
              color: "var(--text-muted)",
            }}
          >
            • Fast scans (minutes) • Plain-English reports • No code stored after scanning
          </p>
        </Container>
      </section>

      {/* Final CTA */}
      <section
        style={{
          textAlign: "center",
          padding: "4rem 1.5rem 5rem",
          borderTop: "1px solid #E2E8F0",
        }}
      >
        <Container>
          <h2 style={{ margin: "0 0 1.5rem", fontSize: "1.25rem", fontWeight: 600, color: "var(--text)" }}>
            Ready to fix your security issues?
          </h2>
          <ButtonPrimary href="/checkout">Run a Vibe Scan — $9</ButtonPrimary>
        </Container>
      </section>
    </>
  );
}
