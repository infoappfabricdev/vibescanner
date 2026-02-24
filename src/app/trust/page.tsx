import type { Metadata } from "next";
import Container from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Trust & Privacy | VibeScan",
  description: "How we handle your code, where scanning runs, and our privacy practices.",
};

const sectionPadding = { paddingTop: "4rem", paddingBottom: "4rem" } as const;

export default function TrustPage() {
  return (
    <main>
      <header
        style={{
          padding: "4rem 1.5rem 4rem",
          textAlign: "left",
          background: "linear-gradient(180deg, #eff6ff 0%, var(--card) 100%)",
        }}
      >
        <Container>
          <div style={{ maxWidth: "42rem", margin: "0 auto", textAlign: "left" }}>
            <h1 style={{ margin: "0 0 0.5rem", color: "var(--text)" }}>
              Trust & privacy
            </h1>
            <p style={{ fontSize: "1.125rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.625 }}>
              How we handle your code and your data.
            </p>
          </div>
        </Container>
      </header>

      <section style={{ ...sectionPadding, borderTop: "1px solid #E2E8F0" }}>
        <Container>
          <div style={{ maxWidth: "42rem", margin: "0 auto", textAlign: "left" }}>
            <h2 style={{ margin: "0 0 1rem", color: "var(--text)" }}>
              Code retention policy
            </h2>
            <p style={{ fontSize: "1rem", color: "var(--text)", margin: 0, lineHeight: 1.625 }}>
              We do not store your source code on our servers after the scan is complete. Your zip is extracted in memory (or in a temporary directory) only for the duration of the scan. We store scan results so we can show your report when you view it. Once you have your results in the browser, we do not keep a copy of your code.
            </p>
          </div>
        </Container>
      </section>

      <section style={{ ...sectionPadding, borderTop: "1px solid #E2E8F0" }}>
        <Container>
          <div style={{ maxWidth: "42rem", margin: "0 auto", textAlign: "left" }}>
            <h2 style={{ margin: "0 0 1rem", color: "var(--text)" }}>
              Where scanning runs
            </h2>
            <p style={{ fontSize: "1rem", color: "var(--text)", margin: 0, lineHeight: 1.625 }}>
              When you run a Vibe Scan, your zip is sent to our scan service (hosted on a trusted cloud provider). The scan runs in an isolated environment. We use the scan only to produce your report and do not use your code for training models, marketing, or any purpose other than performing the scan you requested.
            </p>
          </div>
        </Container>
      </section>

      <section style={{ ...sectionPadding, borderTop: "1px solid #E2E8F0" }}>
        <Container>
          <div style={{ maxWidth: "42rem", margin: "0 auto", textAlign: "left" }}>
            <h2 style={{ margin: "0 0 1rem", color: "var(--text)" }}>
              Logs and privacy
            </h2>
            <p style={{ fontSize: "1rem", color: "var(--text)", margin: 0, lineHeight: 1.625 }}>
              We may log minimal, non-sensitive metadata (for example, that a scan was run and whether it completed successfully) to operate and improve the service. We do not log the contents of your code or the details of your report. We do not sell your data or use it for advertising. If we change how we handle data, we'll update this page and keep our practices clear and transparent.
            </p>
          </div>
        </Container>
      </section>

      <section style={{ ...sectionPadding, paddingBottom: "3rem", borderTop: "1px solid #E2E8F0" }}>
        <Container>
          <div style={{ maxWidth: "42rem", margin: "0 auto", textAlign: "left" }}>
            <p style={{ fontSize: "0.9375rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.625 }}>
            If you have questions about trust, privacy, or how we handle your code, we're happy to clarify. Reach out through the contact information on the site.
          </p>
          </div>
        </Container>
      </section>
    </main>
  );
}
