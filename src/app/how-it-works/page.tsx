import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How It Works | VibeScan",
  description: "Learn how VibeScan scans your code and what we check for.",
};

const sectionStyle = { padding: "3rem 1.5rem", maxWidth: "720px", margin: "0 auto" } as const;

export default function HowItWorksPage() {
  return (
    <main>
      <header
        style={{
          padding: "3rem 1.5rem 2rem",
          textAlign: "center",
          background: "linear-gradient(180deg, #f0fdfa 0%, #fff 100%)",
        }}
      >
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <h1
            style={{
              fontSize: "clamp(1.5rem, 4vw, 2rem)",
              fontWeight: 700,
              margin: "0 0 0.5rem",
              color: "#1e293b",
            }}
          >
            How VibeScan works
          </h1>
          <p style={{ fontSize: "1.0625rem", color: "#64748b", margin: 0 }}>
            A clear look at what we do and what we check.
          </p>
        </div>
      </header>

      <section style={{ ...sectionStyle, paddingTop: "2rem", paddingBottom: "2rem", borderTop: "1px solid #e2e8f0" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, margin: "0 0 1rem", color: "#1e293b" }}>
          What “code scan” means
        </h2>
        <p style={{ fontSize: "1.0625rem", color: "#334155", margin: 0, lineHeight: 1.7 }}>
          When you upload a zip of your app, we analyze the <strong>source code</strong> inside it. We don’t run your app or execute anything — we only read the code and look for patterns that are often associated with security risks. Think of it like a spell-check for security: we flag potential issues and explain them in plain English so you know what to fix and why.
        </p>
      </section>

      <section style={{ ...sectionStyle, paddingTop: "2rem", paddingBottom: "2rem", borderTop: "1px solid #e2e8f0" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, margin: "0 0 1rem", color: "#1e293b" }}>
          What we check today
        </h2>
        <p style={{ fontSize: "1.0625rem", color: "#334155", margin: 0, lineHeight: 1.7 }}>
          VibeScan uses <strong>Semgrep</strong>, an industry-standard static analysis engine, with a rule set focused on common security issues. Right now we run Semgrep’s default security rules (“auto” config) on your code. That includes checks for:
        </p>
        <ul
          style={{
            margin: "1rem 0 0",
            paddingLeft: "1.25rem",
            color: "#334155",
            fontSize: "1.0625rem",
            lineHeight: 1.6,
          }}
        >
          <li>Unsafe system calls (command injection risk)</li>
          <li>Injection-prone code patterns (e.g. SQL, NoSQL, XSS)</li>
          <li>Risky coding patterns that can lead to security issues</li>
        </ul>
        <p style={{ fontSize: "1.0625rem", color: "#334155", margin: "1rem 0 0", lineHeight: 1.7 }}>
          We translate Semgrep’s findings into a simple report: what we found, where it is, why it matters, and what to do next. No jargon required.
        </p>
      </section>

      <section style={{ ...sectionStyle, paddingTop: "2rem", paddingBottom: "2rem", borderTop: "1px solid #e2e8f0" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, margin: "0 0 1rem", color: "#1e293b" }}>
          What’s coming soon
        </h2>
        <p style={{ fontSize: "1.0625rem", color: "#334155", margin: 0, lineHeight: 1.7 }}>
          We’re working on more checks and features, including:
        </p>
        <ul
          style={{
            margin: "1rem 0 0",
            paddingLeft: "1.25rem",
            color: "#334155",
            fontSize: "1.0625rem",
            lineHeight: 1.6,
          }}
        >
          <li>Secrets and credentials in code</li>
          <li>Dependency and supply-chain checks</li>
          <li>More rule sets and frameworks</li>
        </ul>
        <p style={{ fontSize: "0.9375rem", color: "#64748b", margin: "1rem 0 0", lineHeight: 1.5 }}>
          Have feedback or a feature request? We’d love to hear from you as we build.
        </p>
      </section>

      <section
        style={{
          ...sectionStyle,
          paddingTop: "2rem",
          paddingBottom: "3rem",
          borderTop: "1px solid #e2e8f0",
          textAlign: "center",
        }}
      >
        <Link
          href="/scan"
          style={{
            display: "inline-block",
            padding: "0.875rem 2rem",
            fontSize: "1.0625rem",
            fontWeight: 600,
            color: "white",
            background: "#0f766e",
            borderRadius: "8px",
            textDecoration: "none",
          }}
        >
          Run a Vibe Scan — $9
        </Link>
      </section>
    </main>
  );
}
