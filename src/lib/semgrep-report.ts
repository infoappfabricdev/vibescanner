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
  /** Semgrep rule check_id or Gitleaks RuleID. */
  checkId: string;
  title: string;
  explanation: string;
  whyItMatters: string;
  fixSuggestion: string;
  /** Copyable prompt for pasting into Lovable, Cursor, or another AI coding tool. */
  fixPrompt: string;
  file: string;
  line: number | null;
  severity: "critical" | "high" | "medium" | "low" | "info";
  /** Which scanner produced this finding. */
  scanner?: "semgrep" | "gitleaks";
}

/** Strip /tmp/vibescan-.../ prefix so only the project-relative path is shown. */
function stripTempDirPrefix(path: string): string {
  if (!path || typeof path !== "string") return path;
  const match = path.match(/^\/tmp\/vibescan-[^/]+\/(.*)$/);
  return match ? match[1] : path;
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
  if (v === "critical") return "critical";
  if (v === "error" || v === "high") return "high";
  if (v === "warning" || v === "medium") return "medium";
  if (v === "info" || v === "low") return "low";
  return "info";
}

/** Build an advisory prompt for pasting into an AI coding tool (collaborative, not prescriptive). */
function buildFixPrompt(f: {
  file: string;
  line: number | null;
  title: string;
  explanation: string;
  whyItMatters: string;
  fixSuggestion: string;
}): string {
  const location =
    f.line != null ? `${f.file} at line ${f.line}` : `${f.file} (see report for location)`;
  const explanationTrimmed =
    f.explanation.length > 400 ? f.explanation.slice(0, 397) + "..." : f.explanation;
  return `I'm reviewing a security finding in my codebase and would like your help understanding my options.

What was found: ${explanationTrimmed}

File and location: ${location}

Security context: ${f.whyItMatters}

What a secure solution should achieve: ${f.fixSuggestion}

Before making any changes, please: 1) Explain what you think is causing this issue in my specific code, 2) Suggest 2-3 possible approaches to fix it, 3) Tell me if any approach might affect other parts of my app, 4) Wait for my confirmation before making any changes.`;
}

/** Unified finding from scan-service (semgrep or gitleaks normalized). */
export interface UnifiedFinding {
  scanner?: "semgrep" | "gitleaks";
  check_id?: string;
  path?: string;
  start?: { line?: number | null };
  extra?: { message?: string; severity?: string };
  [key: string]: unknown;
}

function oneFindingFromUnified(u: UnifiedFinding): ReportFinding {
  const extra = u.extra ?? {};
  const message = extra.message ?? "";
  const checkId = (u.check_id ?? "").toString();
  const scanner: "semgrep" | "gitleaks" = u.scanner === "gitleaks" ? "gitleaks" : "semgrep";
  const title = toTitle(checkId, message);
  const explanation = toExplanation(message, checkId);
  const severity = normalizeSeverity(extra.severity);
  const whyItMatters =
    scanner === "gitleaks"
      ? "Exposed secrets can be used to access your accounts, APIs, or data. Remove them immediately and rotate any real credentials."
      : toWhyItMatters(extra.severity, (extra as SemgrepExtra).metadata);
  const fixSuggestion =
    scanner === "gitleaks"
      ? "Remove the secret from the code immediately. Store it in environment variables or a secrets manager and rotate the credential if it was ever committed."
      : toFixSuggestion(extra as SemgrepExtra);
  const file = stripTempDirPrefix((u.path ?? "").toString());
  const line = u.start?.line ?? null;
  const finding = {
    checkId,
    title,
    explanation,
    whyItMatters,
    fixSuggestion,
    file,
    line,
    severity,
    scanner,
  };
  return {
    ...finding,
    fixPrompt: buildFixPrompt(finding),
  };
}

const SEVERITY_SORT_ORDER: Record<ReportFinding["severity"], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

/**
 * Convert API response into a list of plain-English report findings.
 * Reads from unified findings array if present; otherwise falls back to semgrep.results.
 * Preserves scanner and sorts by severity (critical → high → medium → low → info).
 */
export function buildReport(apiResponse: Record<string, unknown>): ReportFinding[] {
  const unified = apiResponse.findings as UnifiedFinding[] | undefined;
  if (Array.isArray(unified) && unified.length >= 0) {
    const list = unified.map((u) => oneFindingFromUnified(u));
    list.sort(
      (a, b) =>
        (SEVERITY_SORT_ORDER[a.severity] ?? 99) - (SEVERITY_SORT_ORDER[b.severity] ?? 99)
    );
    return list;
  }

  const semgrep = apiResponse.semgrep as SemgrepOutput | undefined;
  const results = semgrep?.results ?? [];
  if (!Array.isArray(results)) return [];

  const list = (results as SemgrepResult[]).map((r) => {
    const extra = r.extra ?? {};
    const message = extra.message;
    const checkId = r.check_id ?? "";
    const title = toTitle(checkId, message);
    const explanation = toExplanation(message, checkId);
    const whyItMatters = toWhyItMatters(extra.severity, extra.metadata);
    const fixSuggestion = toFixSuggestion(extra);
    const file = stripTempDirPrefix(r.path ?? "");
    const line = r.start?.line ?? null;
    const severity = normalizeSeverity(extra.severity);
    const finding: ReportFinding = {
      checkId,
      title,
      explanation,
      whyItMatters,
      fixSuggestion,
      file,
      line,
      severity,
      scanner: "semgrep",
      fixPrompt: "",
    };
    finding.fixPrompt = buildFixPrompt(finding);
    return finding;
  });
  list.sort(
    (a, b) =>
      (SEVERITY_SORT_ORDER[a.severity] ?? 99) - (SEVERITY_SORT_ORDER[b.severity] ?? 99)
  );
  return list;
}
