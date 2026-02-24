import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/ui/Container";
import { ButtonPrimary } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Pricing | VibeScan",
  description: "Simple, one-time pricing for security scans. No subscription required.",
};

const sectionPadding = { paddingTop: "4rem", paddingBottom: "4rem" } as const;

export default function PricingPage() {
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
              Pricing
            </h1>
            <p style={{ fontSize: "1.125rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.625 }}>
              One-time scans. No surprise charges.
            </p>
          </div>
        </Container>
      </header>

      <section
        style={{
          ...sectionPadding,
          borderTop: "1px solid #E2E8F0",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        <Container>
          <div style={{ maxWidth: "42rem", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* $9 one-time scan */}
          <div
            style={{
              border: "2px solid var(--brand)",
              borderRadius: "12px",
              padding: "2rem",
              background: "#ffffff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "1.75rem", fontWeight: 600, color: "var(--text)" }}>$9</span>
              <span style={{ fontSize: "1rem", color: "var(--text-muted)" }}>per scan</span>
            </div>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 600, margin: "0 0 0.75rem", color: "var(--text)" }}>
              One-time scan
            </h2>
            <p style={{ fontSize: "0.9375rem", color: "var(--text)", margin: "0 0 1rem", lineHeight: 1.6 }}>
              Run a security scan whenever you need it. Upload a zip of your app, get a plain-English report with findings and fix suggestions. No subscription, no recurring charge.
            </p>
            <ul
              style={{
                margin: "0 0 1rem",
                paddingLeft: "1.25rem",
                fontSize: "0.9375rem",
                color: "var(--text)",
                lineHeight: 1.6,
              }}
            >
              <li>One-time payment</li>
              <li>Plain-English report with what we found, why it matters, and what to do</li>
              <li>Fix suggestions you can copy into your AI tool or share with a developer</li>
              <li>No subscription — pay only when you scan</li>
            </ul>
            <ButtonPrimary href="/checkout">Run a Vibe Scan — $9</ButtonPrimary>
          </div>

          {/* Coming soon: subscription */}
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              padding: "2rem",
              background: "#ffffff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "1.75rem", fontWeight: 600, color: "var(--text-muted)" }}>$29</span>
              <span style={{ fontSize: "1rem", color: "var(--text-muted)" }}>/month</span>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  background: "var(--border)",
                  padding: "0.2rem 0.5rem",
                  borderRadius: "4px",
                  marginLeft: "0.5rem",
                }}
              >
                Coming soon
              </span>
            </div>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 600, margin: "0 0 0.75rem", color: "var(--text-muted)" }}>
              Subscription
            </h2>
            <p style={{ fontSize: "0.9375rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
              Unlimited scans and more features. We're building this next — stay tuned.
            </p>
          </div>
          </div>
        </Container>
      </section>

      <section style={{ paddingTop: "1.5rem", paddingBottom: "3rem", borderTop: "1px solid var(--border)" }}>
        <Container>
          <div style={{ maxWidth: "42rem", margin: "0 auto" }}>
          <p style={{ fontSize: "0.9375rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
            Questions about pricing? Check out <Link href="/how-it-works" style={{ color: "var(--brand)", textDecoration: "none" }}>How it works</Link> or <Link href="/trust" style={{ color: "var(--brand)", textDecoration: "none" }}>Trust & privacy</Link>.
          </p>
          </div>
        </Container>
      </section>
    </main>
  );
}
