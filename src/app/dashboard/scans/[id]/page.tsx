import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Container from "@/components/ui/Container";
import type { ReportFinding } from "@/lib/semgrep-report";

function FindingCard({ f, index }: { f: ReportFinding; index: number }) {
  const severityColors: Record<string, string> = {
    critical: "#b91c1c",
    high: "var(--danger)",
    medium: "var(--warn)",
    low: "var(--warn)",
    info: "var(--brand)",
  };
  const color = severityColors[f.severity] ?? "var(--text-muted)";
  const scannerLabel = f.scanner === "gitleaks" ? "Gitleaks" : "Semgrep";

  return (
    <section
      style={{
        border: `1px solid ${color}`,
        borderRadius: "12px",
        padding: "1.5rem 1.75rem",
        marginBottom: "1.25rem",
        background: "#ffffff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
        <span
          style={{
            fontSize: "0.75rem",
            fontWeight: 600,
            textTransform: "uppercase",
            color,
          }}
        >
          {f.severity}
        </span>
        <span
          style={{
            fontSize: "0.6875rem",
            color: "var(--text-muted)",
            textTransform: "capitalize",
            padding: "0.1rem 0.35rem",
            border: "1px solid var(--border)",
            borderRadius: "4px",
          }}
        >
          {scannerLabel}
        </span>
        <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
          #{index + 1} · {f.file}
          {f.line != null ? ` (line ${f.line})` : ""}
        </span>
      </div>
      <h3 style={{ margin: "0 0 0.5rem", color: "var(--text)" }}>{f.title}</h3>
      <p style={{ margin: "0 0 0.75rem", lineHeight: 1.625, color: "var(--text)" }}>{f.explanation}</p>
      <p style={{ margin: "0 0 0.75rem", lineHeight: 1.625, color: "var(--text)" }}>
        <strong>Why it matters:</strong> {f.whyItMatters}
      </p>
      <p style={{ margin: "0 0 0.75rem", lineHeight: 1.625, color: "var(--text)" }}>
        <strong>What to do:</strong> {f.fixSuggestion}
      </p>
      <div
        style={{
          background: "#f1f5f9",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          padding: "1rem 1.25rem",
          marginTop: "0.75rem",
          fontSize: "0.875rem",
          lineHeight: 1.6,
          color: "var(--text)",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {f.fixPrompt}
      </div>
    </section>
  );
}

export default async function ScanReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/auth?next=/dashboard/scans/" + id);
  }

  const { data: scan, error } = await supabase
    .from("scans")
    .select("id, created_at, project_name, findings, finding_count, critical_count, high_count, medium_count, low_count")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !scan) {
    notFound();
  }

  const findings = (scan.findings ?? []) as ReportFinding[];
  const hasFindings = findings.length > 0;

  return (
    <main style={{ padding: "4rem 1.5rem" }}>
      <Container>
        <p style={{ marginBottom: "1rem", fontSize: "0.875rem" }}>
          <Link href="/dashboard" style={{ color: "var(--brand)", textDecoration: "none" }}>
            ← Back to dashboard
          </Link>
        </p>
        <h1 style={{ margin: "0 0 0.5rem", color: "var(--text)" }}>
          {(scan as { project_name?: string | null }).project_name?.trim() ||
            new Date(scan.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
        </h1>
        <p style={{ color: "var(--text-muted)", margin: "0 0 1.5rem", fontSize: "0.9375rem" }}>
          {new Date(scan.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
          {" · "}
          {scan.finding_count} finding{scan.finding_count !== 1 ? "s" : ""}
          {(() => {
            const c = (scan as { critical_count?: number }).critical_count ?? 0;
            const parts: string[] = [];
            if (c > 0) parts.push(`Critical: ${c}`);
            if (scan.high_count > 0) parts.push(`High: ${scan.high_count}`);
            if (scan.medium_count > 0) parts.push(`Medium: ${scan.medium_count}`);
            if (scan.low_count > 0) parts.push(`Low: ${scan.low_count}`);
            return parts.length > 0 ? ` (${parts.join(", ")})` : "";
          })()}
        </p>

        {hasFindings ? (
          findings.map((f, i) => <FindingCard key={`${f.file}-${f.line}-${i}`} f={f} index={i} />)
        ) : (
          <p style={{ fontSize: "1.0625rem", color: "var(--success)", fontWeight: 500 }}>
            No security issues were found in this scan.
          </p>
        )}
      </Container>
    </main>
  );
}
