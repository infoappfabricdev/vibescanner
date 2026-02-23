"use client";

import Link from "next/link";

const sectionStyle = { padding: "3rem 1.5rem", maxWidth: "720px", margin: "0 auto" } as const;
const stepNumStyle = {
  width: "2rem",
  height: "2rem",
  borderRadius: "50%",
  background: "#0f766e",
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
      <header
        style={{
          padding: "4rem 1.5rem 3rem",
          textAlign: "center",
          background: "linear-gradient(180deg, #f0fdfa 0%, #fff 100%)",
        }}
      >
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <h1
            style={{
              fontSize: "clamp(1.75rem, 4vw, 2.25rem)",
              fontWeight: 700,
              margin: "0 0 1rem",
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
            }}
          >
            Is your app safe to launch?
          </h1>
          <p
            style={{
              fontSize: "1.125rem",
              color: "#475569",
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            Built with AI? VibeScan checks your code for security issues and gives you a clear report — plus fixes you can copy and paste.
          </p>
          <p
            style={{
              fontSize: "0.9375rem",
              color: "#64748b",
              margin: "0.5rem 0 0",
              lineHeight: 1.5,
            }}
          >
            Currently scans source code for common security issues.
          </p>
        </div>
      </header>

      {/* What it does (short) */}
      <section style={{ ...sectionStyle, paddingTop: "2rem", paddingBottom: "1.5rem" }}>
        <p
          style={{
            fontSize: "1.0625rem",
            color: "#334155",
            margin: 0,
            lineHeight: 1.7,
          }}
        >
          VibeScan analyzes your app’s source code for common security risks and explains them in plain English. See what we found, why it matters, and what to do next — no jargon, no guessing. Fix issues yourself or copy the fix prompts into your AI tool.
        </p>
      </section>

      {/* How it works (3 steps) */}
      <section
        style={{
          ...sectionStyle,
          paddingTop: "2rem",
          paddingBottom: "2rem",
          borderTop: "1px solid #e2e8f0",
        }}
      >
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: 600,
            margin: "0 0 1.5rem",
            color: "#1e293b",
          }}
        >
          How it works
        </h2>
        <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
          <li style={{ display: "flex", alignItems: "flex-start", marginBottom: "1.25rem" }}>
            <span style={stepNumStyle}>1</span>
            <div>
              <strong style={{ display: "block", marginBottom: "0.25rem" }}>Upload your app</strong>
              <span style={{ color: "#64748b", fontSize: "0.9375rem" }}>
                Zip your project (e.g. from Lovable, Bolt, or Cursor) and upload it.
              </span>
            </div>
          </li>
          <li style={{ display: "flex", alignItems: "flex-start", marginBottom: "1.25rem" }}>
            <span style={stepNumStyle}>2</span>
            <div>
              <strong style={{ display: "block", marginBottom: "0.25rem" }}>We scan your code for security risks</strong>
              <span style={{ color: "#64748b", fontSize: "0.9375rem" }}>
                VibeScan analyzes your code for common patterns that could lead to security vulnerabilities.
              </span>
            </div>
          </li>
          <li style={{ display: "flex", alignItems: "flex-start" }}>
            <span style={stepNumStyle}>3</span>
            <div>
              <strong style={{ display: "block", marginBottom: "0.25rem" }}>Get a clear report + fixes</strong>
              <span style={{ color: "#64748b", fontSize: "0.9375rem" }}>
                See what’s wrong, why it matters, and how to fix it — in plain English.
              </span>
            </div>
          </li>
        </ol>
      </section>

      {/* Example report teaser */}
      <section
        style={{
          ...sectionStyle,
          paddingTop: "2rem",
          paddingBottom: "2rem",
          borderTop: "1px solid #e2e8f0",
          background: "#f8fafc",
        }}
      >
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: 600,
            margin: "0 0 0.75rem",
            color: "#1e293b",
          }}
        >
          Example of what you’ll see
        </h2>
        <p style={{ color: "#64748b", margin: "0 0 1rem", fontSize: "0.9375rem" }}>
          Every finding in your report looks like this — clear, actionable, and in plain English.
        </p>
        <section
          style={{
            border: "1px solid #c05621",
            borderRadius: "8px",
            padding: "1rem 1.25rem",
            background: "#fafafa",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                textTransform: "uppercase",
                color: "#c05621",
              }}
            >
              medium
            </span>
            <span style={{ color: "#666", fontSize: "0.875rem" }}>
              Example · src/api/helper.js (line 42)
            </span>
          </div>
          <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.125rem" }}>
            Unsafe use of user input in system command
          </h3>
          <p style={{ margin: "0 0 0.75rem", lineHeight: 1.5, color: "#333" }}>
            This code passes user-provided input into a system command. If an attacker can control that input, they could run arbitrary commands on the server.
          </p>
          <p style={{ margin: "0 0 0.75rem", lineHeight: 1.5 }}>
            <strong>Why it matters:</strong> This could let someone access or change your app’s data, or harm your users.
          </p>
          <p style={{ margin: 0, lineHeight: 1.5 }}>
            <strong>What to do:</strong> Avoid building commands from user input. Use a safe API or allowlist specific values instead.
          </p>
        </section>
      </section>

      {/* CTA */}
      <section
        style={{
          textAlign: "center",
          padding: "2rem 1.5rem 4rem",
          borderTop: "1px solid #e2e8f0",
        }}
      >
        <Link
          href="/checkout"
          style={{
            display: "inline-block",
            padding: "0.875rem 2rem",
            fontSize: "1.0625rem",
            fontWeight: 600,
            color: "white",
            background: "#0f766e",
            borderRadius: "8px",
            textDecoration: "none",
            boxShadow: "0 1px 3px rgba(15, 118, 110, 0.25)",
          }}
        >
          Run a Vibe Scan — $9
        </Link>
        <p
          style={{
            fontSize: "0.875rem",
            color: "#64748b",
            margin: "0.75rem 0 0",
            lineHeight: 1.5,
          }}
        >
          One-time scan. No subscription.
        </p>
      </section>
    </>
  );
}
