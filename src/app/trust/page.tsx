import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trust & Privacy | VibeScan",
  description: "How we handle your code, where scanning runs, and our privacy practices.",
};

const sectionStyle = { padding: "3rem 1.5rem", maxWidth: "720px", margin: "0 auto" } as const;

export default function TrustPage() {
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
            Trust & privacy
          </h1>
          <p style={{ fontSize: "1.0625rem", color: "#64748b", margin: 0 }}>
            How we handle your code and your data.
          </p>
        </div>
      </header>

      <section style={{ ...sectionStyle, paddingTop: "2rem", paddingBottom: "2rem", borderTop: "1px solid #e2e8f0" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, margin: "0 0 1rem", color: "#1e293b" }}>
          Code retention policy
        </h2>
        <p style={{ fontSize: "1.0625rem", color: "#334155", margin: 0, lineHeight: 1.7 }}>
          We do not store your source code or your scan results on our servers after the scan is complete. Your zip is extracted in memory (or in a temporary directory) only for the duration of the scan. Once we’ve generated your report and sent it back to you, we do not keep a copy of your code or the report. You get your results in the browser; we don’t retain them.
        </p>
      </section>

      <section style={{ ...sectionStyle, paddingTop: "2rem", paddingBottom: "2rem", borderTop: "1px solid #e2e8f0" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, margin: "0 0 1rem", color: "#1e293b" }}>
          Where scanning runs
        </h2>
        <p style={{ fontSize: "1.0625rem", color: "#334155", margin: 0, lineHeight: 1.7 }}>
          When you run a Vibe Scan, your zip is sent to our scan service (hosted on a trusted cloud provider). The scan runs in an isolated environment. We use the scan only to produce your report and do not use your code for training models, marketing, or any purpose other than performing the scan you requested.
        </p>
      </section>

      <section style={{ ...sectionStyle, paddingTop: "2rem", paddingBottom: "2rem", borderTop: "1px solid #e2e8f0" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, margin: "0 0 1rem", color: "#1e293b" }}>
          Logs and privacy
        </h2>
        <p style={{ fontSize: "1.0625rem", color: "#334155", margin: 0, lineHeight: 1.7 }}>
          We may log minimal, non-sensitive metadata (for example, that a scan was run and whether it completed successfully) to operate and improve the service. We do not log the contents of your code or the details of your report. We do not sell your data or use it for advertising. If we change how we handle data, we’ll update this page and keep our practices clear and transparent.
        </p>
      </section>

      <section style={{ ...sectionStyle, paddingTop: "2rem", paddingBottom: "3rem", borderTop: "1px solid #e2e8f0" }}>
        <p style={{ fontSize: "0.9375rem", color: "#64748b", margin: 0, lineHeight: 1.5 }}>
          If you have questions about trust, privacy, or how we handle your code, we’re happy to clarify. Reach out through the contact information on the site.
        </p>
      </section>
    </main>
  );
}
