import type { ReportFinding } from "@/lib/semgrep-report";
import { getSummaryText } from "@/lib/finding-summary";

/** One row from the findings table (relational schema). */
export type FindingRow = {
  id: string;
  project_id: string;
  scan_id: string;
  rule_id: string | null;
  scanner: string;
  file_path: string;
  line: number | null;
  title: string;
  explanation: string;
  severity: string;
  status: string;
  false_positive_likelihood: string | null;
  false_positive_reason: string | null;
  first_seen_at: string;
  last_seen_at: string;
  resolved_at: string | null;
  summary_text: string | null;
  details_text: string | null;
  fix_prompt: string | null;
  why_it_matters: string | null;
  fix_suggestion: string | null;
};

/** False positive likelihood from rules or Claude. */
export type FalsePositiveLikelihood = "confirmed_issue" | "possible_fp" | "likely_fp";

/** Stored finding from DB (has summaryText, detailsText, generatedBy, generatedAt). Dashboard uses these only; no LLM. */
export type StoredFinding = ReportFinding & {
  summaryText?: string;
  detailsText?: string;
  generatedBy?: string;
  generatedAt?: string;
  false_positive_likelihood?: FalsePositiveLikelihood | null;
  false_positive_reason?: string | null;
};

/** Normalized finding shape for dashboard (supports multiple scanners). */
export type NormalizedFinding = {
  id: string;
  scanner: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  /** Short, novice-friendly summary for the card (1–2 sentences). */
  summaryText: string;
  /** Full technical description from the scanner for the Details drawer. */
  detailsText: string;
  filePath: string;
  line: number | null;
  ruleId: string | null;
  quickFixAvailable: boolean;
  fixPrompt: string;
  detailsUrl: string;
  /** Plain-English impact (from report). */
  whyItMatters?: string;
  /** Suggested fix text (from report). */
  fixSuggestion?: string;
};

/** Resolution status for an issue. */
export type FindingStatus = "open" | "fixed" | "ignored" | "false_positive" | "other";

/** Persisted per-finding state (localStorage). */
export type FindingState = {
  status: FindingStatus;
  /** General notes (textarea in Resolution section). */
  notes?: string;
  /** Short reason when status is Ignored / False positive / Other (e.g. "Other reason" max ~80 chars). */
  reason?: string | null;
  /** ISO date string; set when status/notes/reason are updated. */
  updatedAt?: string;
};

const SEVERITY_MAP = { critical: "critical", high: "high", medium: "medium", low: "low", info: "low" } as const;

/**
 * Convert findings table rows to StoredFinding[] for use with mapReportFindingsToNormalized or report UI.
 */
export function findingsRowsToStoredFindings(rows: FindingRow[]): StoredFinding[] {
  return rows.map((r) => ({
    checkId: r.rule_id ?? "",
    title: r.title,
    explanation: r.explanation,
    whyItMatters: r.why_it_matters ?? "",
    fixSuggestion: r.fix_suggestion ?? "",
    fixPrompt: r.fix_prompt ?? "",
    file: r.file_path,
    line: r.line,
    severity: r.severity as ReportFinding["severity"],
    scanner: r.scanner as "semgrep" | "gitleaks",
    summaryText: r.summary_text ?? undefined,
    detailsText: r.details_text ?? undefined,
    false_positive_likelihood: (r.false_positive_likelihood as FalsePositiveLikelihood | null) ?? undefined,
    false_positive_reason: r.false_positive_reason ?? undefined,
  }));
}

function defaultFixPrompt(f: { title: string; filePath: string; line: number | null; severity: string }): string {
  const loc = f.line != null ? `${f.filePath}:${f.line}` : f.filePath;
  return `Fix the following issue:

[${f.title}]
Severity: ${f.severity}
File: ${loc}

Explain the issue and provide a secure fix.
Apply the fix directly in code.`;
}

/**
 * Map stored findings from DB to normalized shape for the dashboard.
 * Uses stored summaryText/detailsText only; no generation, no LLM.
 * Do not import enrich-findings-once or any LLM/Anthropic module in dashboard code.
 * For legacy scans without stored fields, falls back to getSummaryText (client-safe heuristic).
 * When findingIds is provided (e.g. from findings table rows), uses those for NormalizedFinding.id.
 */
export function mapReportFindingsToNormalized(
  scanId: string,
  detailsUrl: string,
  reportFindings: StoredFinding[],
  findingIds?: string[]
): NormalizedFinding[] {
  return reportFindings.map((f, idx) => {
    const severity = SEVERITY_MAP[f.severity] ?? "low";
    const fixPrompt = f.fixPrompt?.trim() || defaultFixPrompt({
      title: f.title,
      filePath: f.file,
      line: f.line,
      severity,
    });
    const detailsText = f.detailsText ?? f.explanation ?? "";
    const summaryText =
      f.summaryText != null && f.summaryText !== ""
        ? f.summaryText
        : getSummaryText(f.checkId ?? null, detailsText);
    const scanner = f.scanner ?? "semgrep";
    const id = findingIds && findingIds[idx] != null ? findingIds[idx]! : `${scanner}-${scanId}-${idx}`;
    return {
      id,
      scanner,
      severity,
      title: f.title,
      summaryText,
      detailsText,
      filePath: f.file,
      line: f.line ?? null,
      ruleId: f.checkId ?? null,
      quickFixAvailable: !!(f.fixPrompt && f.fixPrompt.trim()),
      fixPrompt,
      detailsUrl,
      whyItMatters: f.whyItMatters || undefined,
      fixSuggestion: f.fixSuggestion || undefined,
    };
  });
}
