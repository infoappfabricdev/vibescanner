import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing | VibeScan",
  description: "Simple, one-time pricing for security scans. No subscription required.",
};

const sectionStyle = { padding: "3rem 1.5rem", maxWidth: "720px", margin: "0 auto" } as const;

export default function PricingPage() {
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
            Pricing
          </h1>
          <p style={{ fontSize: "1.0625rem", color: "#64748b", margin: 0 }}>
            One-time scans. No surprise charges.
          </p>
        </div>
      </header>

      <section
        style={{
          ...sectionStyle,
          paddingTop: "2rem",
          paddingBottom: "2rem",
          borderTop: "1px solid #e2e8f0",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        {/* $9 one-time scan */}
        <div
          style={{
            border: "2px solid #0f766e",
            borderRadius: "12px",
            padding: "1.5rem 1.75rem",
            background: "#f0fdfa",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "1.75rem", fontWeight: 700, color: "#1e293b" }}>$9</span>
            <span style={{ fontSize: "1rem", color: "#64748b" }}>per scan</span>
          </div>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 600, margin: "0 0 0.75rem", color: "#1e293b" }}>
            One-time scan
          </h2>
          <p style={{ fontSize: "0.9375rem", color: "#334155", margin: "0 0 1rem", lineHeight: 1.6 }}>
            Run a security scan whenever you need it. Upload a zip of your app, get a plain-English report with findings and fix suggestions. No subscription, no recurring charge.
          </p>
          <ul
            style={{
              margin: "0 0 1rem",
              paddingLeft: "1.25rem",
              fontSize: "0.9375rem",
              color: "#334155",
              lineHeight: 1.6,
            }}
          >
            <li>One-time payment</li>
            <li>Plain-English report with what we found, why it matters, and what to do</li>
            <li>Fix suggestions you can copy into your AI tool or share with a developer</li>
            <li>No subscription — pay only when you scan</li>
          </ul>
          <Link
            href="/scan"
            style={{
              display: "inline-block",
              padding: "0.625rem 1.25rem",
              fontSize: "0.9375rem",
              fontWeight: 600,
              color: "white",
              background: "#0f766e",
              borderRadius: "6px",
              textDecoration: "none",
            }}
          >
            Run a Vibe Scan — $9
          </Link>
        </div>

        {/* Coming soon: subscription */}
        <div
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "1.5rem 1.75rem",
            background: "#f8fafc",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "1.75rem", fontWeight: 700, color: "#94a3b8" }}>$29</span>
            <span style={{ fontSize: "1rem", color: "#64748b" }}>/month</span>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "#64748b",
                background: "#e2e8f0",
                padding: "0.2rem 0.5rem",
                borderRadius: "4px",
                marginLeft: "0.5rem",
              }}
            >
              Coming soon
            </span>
          </div>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 600, margin: "0 0 0.75rem", color: "#64748b" }}>
            Subscription
          </h2>
          <p style={{ fontSize: "0.9375rem", color: "#64748b", margin: 0, lineHeight: 1.6 }}>
            Unlimited scans and more features. We’re building this next — stay tuned.
          </p>
        </div>
      </section>

      <section style={{ ...sectionStyle, paddingTop: "1.5rem", paddingBottom: "3rem", borderTop: "1px solid #e2e8f0" }}>
        <p style={{ fontSize: "0.9375rem", color: "#64748b", margin: 0, lineHeight: 1.5 }}>
          Questions about pricing? Check out <Link href="/how-it-works" style={{ color: "#0f766e", textDecoration: "none" }}>How it works</Link> or <Link href="/trust" style={{ color: "#0f766e", textDecoration: "none" }}>Trust & privacy</Link>.
        </p>
      </section>
    </main>
  );
}
