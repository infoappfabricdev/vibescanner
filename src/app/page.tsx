"use client";

import Container from "@/components/ui/Container";
import Card from "@/components/ui/Card";
import { ButtonPrimary, ButtonSecondary } from "@/components/ui/Button";

const sectionPadding = { paddingTop: "4rem", paddingBottom: "4rem" } as const;

export default function Home() {
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
              Find security issues before your users do — with fixes you can copy and paste.
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
              Built for AI-generated apps, indie hackers, and fast-moving teams.
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
            Most security tools tell you what&apos;s wrong. VibeScan tells you how to fix it.
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
                No security expertise required. We explain each issue in simple terms.
              </p>
            </div>
            <div>
              <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.0625rem", fontWeight: 600, color: "var(--text)" }}>
                Fixes you can use immediately
              </h3>
              <p style={{ margin: 0, fontSize: "0.9375rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
                Get copy-paste prompts you can use with your AI coding tool or share with a developer.
              </p>
            </div>
            <div>
              <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.0625rem", fontWeight: 600, color: "var(--text)" }}>
                Fast results
              </h3>
              <p style={{ margin: 0, fontSize: "0.9375rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
                Upload your app and get a full report in minutes.
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
            Most security tools tell you what&apos;s wrong.
            <br />
            VibeScan tells you how to fix it.
          </h2>
          <p style={{ color: "var(--text-muted)", margin: "0 0 2rem", fontSize: "1rem", lineHeight: 1.625, textAlign: "center" }}>
            We translate security findings into plain English with actionable fixes.
          </p>

          {/* Two-column comparison */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "2rem",
              marginBottom: "2.5rem",
            }}
          >
            <div
              style={{
                padding: "1.5rem",
                borderRadius: "12px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
              }}
            >
              <h3 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 600, color: "var(--text)" }}>
                Typical security tools
              </h3>
              <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none", fontSize: "0.9375rem", color: "var(--text-muted)", lineHeight: 1.75 }}>
                <li>❌ Technical jargon</li>
                <li>❌ Hard to understand severity</li>
                <li>❌ No actionable fixes</li>
                <li>❌ Requires security expertise</li>
                <li>❌ Long, unstructured reports</li>
              </ul>
            </div>
            <div
              style={{
                padding: "1.5rem",
                borderRadius: "12px",
                background: "var(--card)",
                border: "2px solid var(--brand)",
              }}
            >
              <h3 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 600, color: "var(--brand)" }}>
                VibeScan
              </h3>
              <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none", fontSize: "0.9375rem", color: "var(--text)", lineHeight: 1.75 }}>
                <li>✅ Plain English explanations</li>
                <li>✅ Clear risk explanations</li>
                <li>✅ Copy-paste fixes</li>
                <li>✅ Built for non-security developers</li>
                <li>✅ Prioritized, actionable report</li>
              </ul>
            </div>
          </div>

          {/* Example comparison */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1.5rem",
            }}
          >
            <div>
              <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-muted)" }}>
                Typical output
              </h4>
              <div
                style={{
                  padding: "1.25rem",
                  borderRadius: "8px",
                  background: "#f3f4f6",
                  fontFamily: "var(--font-mono), ui-monospace, monospace",
                  fontSize: "0.8125rem",
                  color: "var(--text)",
                  lineHeight: 1.6,
                }}
              >
                Rule: js.security.audit.detect-non-literal-regexp
                <br />
                Severity: WARNING
                <br />
                Message: RegExp called with non-literal argument...
              </div>
            </div>
            <div>
              <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.875rem", fontWeight: 600, color: "var(--text)" }}>
                VibeScan output
              </h4>
              <Card style={{ padding: "1.25rem", borderColor: "var(--border)" }}>
                <p style={{ margin: "0 0 0.75rem", fontSize: "0.9375rem", lineHeight: 1.6, color: "var(--text)" }}>
                  <strong>Problem:</strong>
                  <br />
                  User input is being used inside a regex.
                </p>
                <p style={{ margin: "0 0 0.75rem", fontSize: "0.9375rem", lineHeight: 1.6, color: "var(--text)" }}>
                  <strong>Why this matters:</strong>
                  <br />
                  An attacker could cause your app to hang or crash.
                </p>
                <p style={{ margin: 0, fontSize: "0.9375rem", lineHeight: 1.6, color: "var(--text)" }}>
                  <strong>How to fix:</strong>
                  <br />
                  Validate or sanitize the input before using it in RegExp.
                </p>
              </Card>
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
            Ready to launch with confidence?
          </h2>
          <ButtonPrimary href="/checkout">Run a Vibe Scan — $9</ButtonPrimary>
        </Container>
      </section>
    </>
  );
}
