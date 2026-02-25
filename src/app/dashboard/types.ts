import type { ReportFinding } from "@/lib/semgrep-report";
import { getSummaryText } from "@/lib/finding-summary";

/** Stored finding from DB (has summaryText, detailsText, generatedBy, generatedAt). Dashboard uses these only; no LLM. */
export type StoredFinding = ReportFinding & {
  summaryText?: string;
  detailsText?: string;
  generatedBy?: string;
  generatedAt?: string;
};

/** Normalized finding shape for dashboard (supports multiple scanners). */
export type NormalizedFinding = {
  id: string;
  scanner: string;
  severity: "high" | "medium" | "low";
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

const SEVERITY_MAP = { high: "high", medium: "medium", low: "low", info: "low" } as const;

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
 * For legacy scans without stored fields, falls back to getSummaryText (client-safe heuristic).
 */
export function mapReportFindingsToNormalized(
  scanId: string,
  detailsUrl: string,
  reportFindings: StoredFinding[]
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
    return {
      id: `semgrep-${scanId}-${idx}`,
      scanner: "semgrep",
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
