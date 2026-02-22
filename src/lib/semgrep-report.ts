/**
 * Types for Semgrep JSON output and our plain-English report.
 */

export interface SemgrepExtra {
  message?: string;
  severity?: string;
  fix?: string;
  metadata?: {
    category?: string;
    subcategory?: string;
    impact?: string;
    likelihood?: string;
    confidence?: string;
    cwe?: string | string[];
    owasp?: string | string[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface SemgrepResult {
  check_id: string;
  path: string;
  start?: { line: number; col?: number };
  end?: { line: number; col?: number };
  extra: SemgrepExtra;
  [key: string]: unknown;
}

export interface SemgrepOutput {
  results?: SemgrepResult[];
  errors?: unknown[];
  [key: string]: unknown;
}

/** One finding in our plain-English report. */
export interface ReportFinding {
  title: string;
  explanation: string;
  whyItMatters: string;
  fixSuggestion: string;
  file: string;
  line: number | null;
  severity: "high" | "medium" | "low" | "info";
}

/** Turn a technical rule id into a short, readable title. */
function toTitle(checkId: string, message?: string): string {
  if (message && message.length < 80) return message;
  const parts = checkId.split(".").pop()?.split(/[-_]/) ?? [checkId];
  return parts
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/** Turn the rule's message into a plain-English explanation (no code, simple words). */
function toExplanation(message: string | undefined, checkId: string): string {
  if (!message) {
    return `The scanner found a potential issue (${toTitle(checkId, undefined)}).`;
  }
  let text = message
    .replace(/\s+/g, " ")
    .replace(/`[^`]+`/g, "this code")
    .trim();
  if (text.length > 300) text = text.slice(0, 297) + "...";
  return text;
}

/** One sentence on why this matters, in plain English. */
function toWhyItMatters(
  severity: string | undefined,
  metadata: SemgrepExtra["metadata"]
): string {
  const impact = metadata?.impact?.toLowerCase();
  const category = (metadata?.category ?? metadata?.subcategory)?.toString().toLowerCase();

  if (impact || category) {
    if (impact === "high" || category?.includes("injection") || category?.includes("xss"))
      return "This could let someone access or change your app’s data, or harm your users.";
    if (impact === "medium" || category?.includes("auth") || category?.includes("secret"))
      return "This could make it easier for someone to break in or misuse your app.";
    if (category?.includes("best-practice") || category?.includes("maintainability"))
      return "Fixing this makes your app safer and easier to maintain.";
  }

  switch ((severity ?? "").toLowerCase()) {
    case "error":
    case "high":
    case "critical":
      return "This could put your app or your users’ data at risk.";
    case "warning":
    case "medium":
      return "Addressing this reduces risk and keeps your app in good shape.";
    case "info":
    case "low":
    default:
      return "Fixing this is a good idea for security and clarity.";
  }
}

/** Suggest a fix in plain English. */
function toFixSuggestion(extra: SemgrepExtra): string {
  if (extra.fix && extra.fix.trim().length > 0) {
    return "A developer can apply this change: remove or replace the flagged code with a safer approach. If you use an AI coding tool, you can paste the file name and line number and ask it to fix this finding.";
  }
  return "Ask a developer (or your AI coding tool) to fix this. Share the file name and line number above so they know where to look.";
}

function normalizeSeverity(s: string | undefined): ReportFinding["severity"] {
  const v = (s ?? "").toLowerCase();
  if (v === "error" || v === "critical" || v === "high") return "high";
  if (v === "warning" || v === "medium") return "medium";
  if (v === "info" || v === "low") return "low";
  return "info";
}

/**
 * Convert raw Semgrep API response into a list of plain-English report findings.
 */
export function buildReport(apiResponse: Record<string, unknown>): ReportFinding[] {
  const semgrep = apiResponse.semgrep as SemgrepOutput | undefined;
  const results = semgrep?.results ?? [];
  if (!Array.isArray(results)) return [];

  return results.map((r: SemgrepResult) => {
    const extra = r.extra ?? {};
    const message = extra.message;
    const title = toTitle(r.check_id, message);
    return {
      title,
      explanation: toExplanation(message, r.check_id),
      whyItMatters: toWhyItMatters(extra.severity, extra.metadata),
      fixSuggestion: toFixSuggestion(extra),
      file: r.path,
      line: r.start?.line ?? null,
      severity: normalizeSeverity(extra.severity),
    };
  });
}
