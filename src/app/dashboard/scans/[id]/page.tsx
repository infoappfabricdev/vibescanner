import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Container from "@/components/ui/Container";
import type { ReportFinding } from "@/lib/semgrep-report";
import { findingsRowsToStoredFindings, type FindingRow } from "../../types";
import ReportFindingCard from "./ReportFindingCard";

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
    .select("id, created_at, project_name, notes, findings, finding_count, critical_count, high_count, medium_count, low_count")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !scan) {
    notFound();
  }

  const { data: findingsRows } = await supabase
    .from("findings")
    .select("id, project_id, scan_id, rule_id, scanner, file_path, line, title, explanation, severity, status, false_positive_likelihood, false_positive_reason, first_seen_at, last_seen_at, resolved_at, summary_text, details_text, fix_prompt, why_it_matters, fix_suggestion")
    .eq("scan_id", id)
    .order("first_seen_at", { ascending: true });

  const findings: ReportFinding[] =
    findingsRows != null && findingsRows.length > 0
      ? findingsRowsToStoredFindings(findingsRows as FindingRow[])
      : ((scan.findings ?? []) as ReportFinding[]);
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
        <p style={{ color: "var(--text-muted)", margin: "0 0 0.5rem", fontSize: "0.9375rem" }}>
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
        {(scan as { notes?: string | null }).notes?.trim() && (
          <p style={{ color: "var(--text)", margin: "0 0 1.5rem", fontSize: "0.9375rem", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
            {(scan as { notes?: string | null }).notes?.trim()}
          </p>
        )}

        {hasFindings ? (
          findings.map((f, i) => (
            <ReportFindingCard
              key={findingsRows != null && findingsRows[i] ? (findingsRows[i] as FindingRow).id : `${f.file}-${f.line}-${i}`}
              f={f}
              index={i}
              findingId={findingsRows != null && findingsRows[i] ? (findingsRows[i] as FindingRow).id : undefined}
            />
          ))
        ) : (
          <p style={{ fontSize: "1.0625rem", color: "var(--success)", fontWeight: 500 }}>
            No security issues were found in this scan.
          </p>
        )}
      </Container>
    </main>
  );
}
