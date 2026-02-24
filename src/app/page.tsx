"use client";

import Link from "next/link";
import Container from "@/components/ui/Container";
import Card from "@/components/ui/Card";
import { ButtonPrimary, ButtonSecondary } from "@/components/ui/Button";

const sectionPadding = { paddingTop: "4rem", paddingBottom: "4rem" } as const;
const stepNumStyle = {
  width: "2rem",
  height: "2rem",
  borderRadius: "50%",
  background: "var(--brand)",
  color: "white",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 600,
  fontSize: "0.875rem",
  marginRight: "0.75rem",
} as const;

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
              Security checks for AI-built apps — with fixes you can copy and paste.
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
              Currently scans source code for common security issues.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap", marginTop: "2.5rem" }}>
              <ButtonPrimary href="/checkout">Run a Vibe Scan</ButtonPrimary>
              <ButtonSecondary href="/pricing">See pricing</ButtonSecondary>
            </div>
          </div>
        </Container>
      </section>

      {/* How it works (3 steps) */}
      <section style={{ ...sectionPadding, borderTop: "1px solid #E2E8F0" }}>
        <Container>
          <div style={{ maxWidth: "42rem", margin: "0 auto", textAlign: "left" }}>
            <h2 style={{ margin: "0 0 2rem", color: "var(--text)" }}>
              How it works
            </h2>
            <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
            <li style={{ display: "flex", alignItems: "flex-start", marginBottom: "1.5rem" }}>
              <span style={stepNumStyle}>1</span>
              <div>
                <strong style={{ display: "block", marginBottom: "0.25rem" }}>Upload your app</strong>
                <span style={{ color: "var(--text-muted)", fontSize: "0.9375rem" }}>
                  Zip your project (e.g. from Lovable, Bolt, or Cursor) and upload it.
                </span>
              </div>
            </li>
            <li style={{ display: "flex", alignItems: "flex-start", marginBottom: "1.5rem" }}>
              <span style={stepNumStyle}>2</span>
              <div>
                <strong style={{ display: "block", marginBottom: "0.25rem" }}>We scan your code for security risks</strong>
                <span style={{ color: "var(--text-muted)", fontSize: "0.9375rem" }}>
                  VibeScan analyzes your code for common patterns that could lead to security vulnerabilities.
                </span>
              </div>
            </li>
            <li style={{ display: "flex", alignItems: "flex-start" }}>
              <span style={stepNumStyle}>3</span>
              <div>
                <strong style={{ display: "block", marginBottom: "0.25rem" }}>Get a clear report + fixes</strong>
                <span style={{ color: "var(--text-muted)", fontSize: "0.9375rem" }}>
                  See what’s wrong, why it matters, and how to fix it — in plain English.
                </span>
              </div>
            </li>
          </ol>
          </div>
        </Container>
      </section>

      {/* Example report teaser */}
      <section
        style={{
          ...sectionPadding,
          borderTop: "1px solid #E2E8F0",
          background: "var(--bg)",
        }}
      >
        <Container>
          <div style={{ maxWidth: "42rem", margin: "0 auto", textAlign: "left" }}>
            <h2 style={{ margin: "0 0 0.5rem", color: "var(--text)" }}>
              Example of what you'll see
            </h2>
            <p style={{ color: "var(--text-muted)", margin: "0 0 1.5rem", fontSize: "1rem", lineHeight: 1.625 }}>
              Every finding in your report looks like this — clear, actionable, and in plain English.
            </p>
          </div>
          <div style={{ maxWidth: "640px", margin: "0 auto" }}>
          <Card
            style={{
              borderColor: "var(--warn)",
              maxWidth: "640px",
              padding: "2rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  color: "var(--warn)",
                }}
              >
                medium
              </span>
              <span
                style={{
                  color: "var(--text-muted)",
                  fontSize: "0.8125rem",
                  fontFamily: "var(--font-mono), ui-monospace, monospace",
                }}
              >
                src/api/helper.js (line 42)
              </span>
            </div>
            <h3 style={{ margin: "0 0 0.75rem", color: "var(--text)" }}>
              Unsafe use of user input in system command
            </h3>
            <p style={{ margin: "0 0 1rem", lineHeight: 1.625, color: "var(--text)" }}>
              This code passes user-provided input into a system command. If an attacker can control that input, they could run arbitrary commands on the server.
            </p>
            <p style={{ margin: "0 0 1rem", lineHeight: 1.625, color: "var(--text)" }}>
              <strong>Why it matters:</strong> This could let someone access or change your app’s data, or harm your users.
            </p>
            <p style={{ margin: 0, lineHeight: 1.625, color: "var(--text)" }}>
              <strong>What to do:</strong> Avoid building commands from user input. Use a safe API or allowlist specific values instead.
            </p>
          </Card>
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
          <ul
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "1.5rem 2rem",
              listStyle: "none",
              margin: 0,
              padding: 0,
              justifyContent: "center",
              fontSize: "0.9375rem",
              color: "var(--text-muted)",
            }}
          >
            <li>Fast scan — results in minutes</li>
            <li>Plain-English reports</li>
            <li>Code-level security checks</li>
          </ul>
        </Container>
      </section>

      {/* CTA */}
      <section
        style={{
          textAlign: "center",
          padding: "4rem 1.5rem 5rem",
          borderTop: "1px solid #E2E8F0",
        }}
      >
        <ButtonPrimary href="/checkout">Run a Vibe Scan — $9</ButtonPrimary>
        <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", margin: "0.75rem 0 0", lineHeight: 1.5 }}>
          One-time scan. No subscription.
        </p>
      </section>
    </>
  );
}
