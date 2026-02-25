import type { Metadata } from "next";
import Container from "@/components/ui/Container";
import { ButtonPrimary } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "How It Works | VibeScan",
  description: "Learn how VibeScan scans your code and what we check for.",
};

const sectionPadding = { paddingTop: "4rem", paddingBottom: "4rem" } as const;

export default function HowItWorksPage() {
  return (
    <main>
      <header
        style={{
          padding: "4rem 1.5rem 4rem",
          textAlign: "center",
          background: "linear-gradient(180deg, #eff6ff 0%, var(--card) 100%)",
        }}
      >
        <Container>
          <div style={{ maxWidth: "42rem", margin: "0 auto", textAlign: "left" }}>
            <h1 style={{ margin: "0 0 0.5rem", color: "var(--text)" }}>
              How VibeScan works
            </h1>
            <p style={{ fontSize: "1.125rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.625 }}>
              A clear look at what we do and what we check.
            </p>
          </div>
        </Container>
      </header>

      <section style={{ ...sectionPadding, borderTop: "1px solid var(--border)" }}>
        <Container>
          <div style={{ maxWidth: "42rem", margin: "0 auto", textAlign: "left" }}>
            <h2 style={{ margin: "0 0 1rem", color: "var(--text)" }}>
              What "code scan" means
            </h2>
            <p style={{ fontSize: "1rem", color: "var(--text)", margin: 0, lineHeight: 1.625 }}>
              When you upload a zip of your app, we analyze the <strong>source code</strong> inside it. We don&apos;t run your app or execute anything — we only read the code and look for patterns that are often associated with security risks. <strong>We don&apos;t run your app; we only analyze code.</strong> Think of it like a spell-check for security: we flag potential issues and explain them in plain English so you know what to fix and why.
            </p>
          </div>
        </Container>
      </section>

      <section style={{ ...sectionPadding, borderTop: "1px solid var(--border)" }}>
        <Container>
          <div style={{ maxWidth: "42rem", margin: "0 auto", textAlign: "left" }}>
            <h2 style={{ margin: "0 0 1rem", color: "var(--text)" }}>
              What we check today
            </h2>
            <p style={{ fontSize: "1rem", color: "var(--text)", margin: 0, lineHeight: 1.625 }}>
              We look for common security issues and turn them into a simple report: what we found, where it is, why it matters, and what to do next. No jargon required. Today we check for:
            </p>
            <ul
              style={{
                margin: "1rem 0 0",
                paddingLeft: "1.25rem",
                color: "var(--text)",
                fontSize: "1.0625rem",
                lineHeight: 1.6,
              }}
            >
              <li>Injection-prone patterns (SQL, NoSQL, XSS)</li>
              <li>Unsafe command and system calls</li>
              <li>Risky auth and session patterns</li>
              <li>Common misconfigurations and insecure defaults</li>
            </ul>
          </div>
        </Container>
      </section>

      <section style={{ ...sectionPadding, borderTop: "1px solid var(--border)" }}>
        <Container>
          <div style={{ maxWidth: "42rem", margin: "0 auto", textAlign: "left" }}>
            <h2 style={{ margin: "0 0 1rem", color: "var(--text)" }}>
              What's coming soon
            </h2>
            <p style={{ fontSize: "1rem", color: "var(--text)", margin: 0, lineHeight: 1.625 }}>
            We're working on more checks and features, including:
          </p>
          <ul
            style={{
              margin: "1rem 0 0",
              paddingLeft: "1.25rem",
              color: "var(--text)",
              fontSize: "1.0625rem",
              lineHeight: 1.6,
            }}
          >
            <li>Secrets and credentials detection</li>
            <li>Dependency and supply-chain checks</li>
            <li>Framework-specific rules</li>
          </ul>
          <p style={{ fontSize: "0.9375rem", color: "var(--text-muted)", margin: "1rem 0 0", lineHeight: 1.625 }}>
            Have feedback or a feature request? We'd love to hear from you as we build.
          </p>
          </div>
        </Container>
      </section>

      <section
        style={{
          ...sectionPadding,
          paddingBottom: "3rem",
          borderTop: "1px solid #E2E8F0",
          textAlign: "center",
        }}
      >
        <Container>
          <ButtonPrimary href="/checkout">Run a Vibe Scan — $9</ButtonPrimary>
        </Container>
      </section>
    </main>
  );
}
