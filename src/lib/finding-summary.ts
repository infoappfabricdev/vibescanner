/**
 * Generate a short, novice-friendly summary for a finding (card view).
 * Prefer curated mapping by rule id; fallback to heuristic from full explanation.
 */

/** Curated plain-English summaries by rule id (full or suffix match). Best quality. */
const SUMMARY_BY_RULE: Record<string, string> = {
  "insecure-transport": "Your app may be sending or receiving data over an unencrypted connection. Use HTTPS to keep data private.",
  "insecure-transport.insecure-transport": "Your app may be sending or receiving data over an unencrypted connection. Use HTTPS to keep data private.",
  "hardcoded-secret": "A secret (like a password or API key) is stored directly in the code. Move it to environment variables or a secrets manager.",
  "hardcoded-secret.hardcoded-secret": "A secret (like a password or API key) is stored directly in the code. Move it to environment variables or a secrets manager.",
  "sql-injection": "User input might be used in a database query without proper checks, which could let someone access or change data they shouldn't.",
  "xss": "User-provided content might be shown on a page without being made safe first, which could allow malicious scripts to run in other users' browsers.",
  "cross-site-scripting": "User-provided content might be shown on a page without being made safe first, which could allow malicious scripts to run in other users' browsers.",
  "path-traversal": "File paths built from user input could allow access to files outside the intended folder. Validate and restrict paths.",
  "command-injection": "User input might be passed into a system command. This could let someone run unexpected commands on the server.",
  "eval": "Code is being run dynamically (e.g. via eval), which can be dangerous if it includes user input. Use a safer approach.",
  "weak-crypto": "Weak or outdated encryption is used. Use current, strong methods to protect sensitive data.",
  "weak-cryptographic-algorithm": "Weak or outdated encryption is used. Use current, strong methods to protect sensitive data.",
  "no-default-export": "This module is exported in a way that can make it harder to track and secure. Prefer named exports.",
  "audit": "The scanner flagged this for a security review. Check the details and fix or document the decision.",
  "insecure-temporary-file": "Temporary files might be created in a way that other users on the system can read or modify. Use secure APIs and permissions.",
  "open-redirect": "A redirect URL might be controlled by user input, which could send users to a malicious site. Validate redirect targets.",
  "mass-assignment": "User input might be used to set object properties without checks, which could change data you didn't intend to expose.",
  "no-log": "Sensitive data might be written to logs. Avoid logging secrets or personal information.",
  "leaked-credentials": "Credentials or secrets might be exposed (e.g. in logs or error messages). Keep them out of logs and client-side code.",
};

/**
 * Try to get a curated summary by rule id. Supports full check_id or last segment (e.g. "insecure-transport").
 */
function getCuratedSummary(checkId: string): string | null {
  if (!checkId || !checkId.trim()) return null;
  const normalized = checkId.trim().toLowerCase();
  if (SUMMARY_BY_RULE[normalized]) return SUMMARY_BY_RULE[normalized];
  const suffix = normalized.split(".").pop() ?? normalized;
  if (SUMMARY_BY_RULE[suffix]) return SUMMARY_BY_RULE[suffix];
  for (const [key, value] of Object.entries(SUMMARY_BY_RULE)) {
    if (normalized.includes(key) || suffix.includes(key)) return value;
  }
  return null;
}

/**
 * Heuristic: first sentence (or first ~120 chars) of explanation, lightly rewritten for novices.
 */
function heuristicSummary(explanation: string): string {
  if (!explanation || !explanation.trim()) {
    return "The scanner found an issue that may need your attention. Open the details for more.";
  }
  let text = explanation.trim().replace(/\s+/g, " ");
  const firstSentenceEnd = text.match(/[.!?]\s/);
  const first = firstSentenceEnd
    ? text.slice(0, firstSentenceEnd.index! + 1).trim()
    : text.slice(0, 120).trim();
  if (first.length >= 120 && !first.match(/[.!?]$/)) {
    const lastSpace = first.lastIndexOf(" ");
    const cut = lastSpace > 80 ? first.slice(0, lastSpace) : first;
    return cut + (cut.length < text.length ? "…" : "");
  }
  return first;
}

/**
 * Return a short, novice-friendly summary (1–2 sentences). No jargon.
 * Uses curated mapping by rule id when available; otherwise heuristic from full explanation.
 */
export function getSummaryText(checkId: string | null, detailsText: string): string {
  const curated = checkId ? getCuratedSummary(checkId) : null;
  if (curated) return curated;
  return heuristicSummary(detailsText);
}
