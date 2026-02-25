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
              We don&apos;t store your source code after the scan. Your zip is extracted in memory or in a temporary directory only during the scan. We store scan results so you can view your report later. We do not keep a copy of your code.
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
              Scanning runs in an isolated environment. Your code is used only to produce your report — not for training, marketing, or any other purpose.
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
              We log minimal metadata only (e.g. that a scan ran and completed). We never log code contents or report details. We don&apos;t sell your data. Any changes to how we handle data will be reflected on this page.
            </p>
          </div>
        </Container>
      </section>

      <section style={{ ...sectionPadding, paddingBottom: "3rem", borderTop: "1px solid #E2E8F0" }}>
        <Container>
          <div style={{ maxWidth: "42rem", margin: "0 auto", textAlign: "left" }}>
            <p style={{ fontSize: "0.9375rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.625 }}>
              Questions? We&apos;re happy to clarify how we handle your code and data — reach out through the contact information on the site.
            </p>
          </div>
        </Container>
      </section>
    </main>
  );
}
