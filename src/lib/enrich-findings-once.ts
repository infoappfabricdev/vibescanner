/**
 * LLM runs once per scan; dashboard never calls LLM.
 *
 * This module is the ONLY place we call the LLM for summaries/fix prompts.
 * It is invoked only from the scan creation flow (/api/scan) after Semgrep
 * results are available. All generated text is stored in the DB; the dashboard
 * only reads stored fields.
 */

import type { ReportFinding } from "./semgrep-report";
import { getCuratedSummary } from "./finding-summary";

// Rule coverage: see RULE_SUMMARIES in finding-summary.ts. Unmapped rules get one batched LLM call or rules_fallback.

/** Infer hosting platform from file paths in the scan (for secrets fix instructions). */
function inferHostingPlatform(findings: ReportFinding[]): "vercel" | "railway" | "supabase" | "lovable" | null {
  const paths = findings.map((f) => f.file?.toLowerCase() ?? "").join(" ");
  if (/vercel\.json|\.vercel\b|vc\/config/i.test(paths)) return "vercel";
  if (/railway\.(toml|json)|railway\.config/i.test(paths)) return "railway";
  if (/supabase\/|supabase\.config|@supabase/i.test(paths)) return "supabase";
  if (/lovable|bolt\.config|\.bolt\b/i.test(paths)) return "lovable";
  return null;
}

/** Platform-specific instructions for where to store secrets (env vars / secret managers). */
const PLATFORM_SECRET_INSTRUCTIONS: Record<string, string> = {
  vercel:
    "Store the secret in Vercel: Project Settings → Environment Variables. Use the dashboard or Vercel CLI (vercel env add). Never commit .env to git.",
  railway:
    "Store the secret in Railway: Project → Variables tab, or use the Railway CLI. Never commit .env to git.",
  supabase:
    "Store the secret in Supabase: Project Settings → API or use Supabase Vault for sensitive values. In app code use environment variables loaded at runtime.",
  lovable:
    "Store the secret in your hosting platform's environment variables (e.g. Vercel, Railway, or Lovable's env settings). Never commit .env or hardcode secrets.",
};

/** Build a fix prompt for a Gitleaks (secrets) finding: remove secret, rotate if needed, store in platform-specific place. */
function getSecretsFixPrompt(
  platform: "vercel" | "railway" | "supabase" | "lovable" | null,
  file: string,
  line: number | null
): string {
  const location = line != null ? `${file} at line ${line}` : file;
  const platformInstructions = platform
    ? PLATFORM_SECRET_INSTRUCTIONS[platform]
    : [
        PLATFORM_SECRET_INSTRUCTIONS.vercel,
        PLATFORM_SECRET_INSTRUCTIONS.railway,
        PLATFORM_SECRET_INSTRUCTIONS.lovable,
      ].join(" Alternatively: ");
  return `A secret (password, API key, or token) was detected in ${location}. This is a critical security issue.

1. Remove the secret from the code immediately. Do not commit it again.
2. If this credential was ever deployed or shared, rotate it now (revoke and create a new one in the service's dashboard).
3. Store the secret securely: ${platformInstructions}

After moving the value to environment variables, load it at runtime (e.g. process.env.SECRET_NAME or your framework's env API) and use that variable in code.`;
}

const GITLEAKS_SUMMARY =
  "A secret (e.g. API key, password, or token) was found in your code. Remove it immediately, store it in environment variables or a secrets manager, and rotate the credential if it was ever exposed.";

/** Safe fallback when LLM is unavailable. Scan still completes. */
export const FALLBACK_SUMMARY =
  "This finding may indicate a security issue. Review the details and consider applying the recommended fix.";

export type GeneratedBy = "rules" | "llm" | "rules_fallback";

export type FalsePositiveLikelihood = "confirmed_issue" | "possible_fp" | "likely_fp";

/** One row from false_positive_patterns (active only). */
export type FalsePositivePattern = {
  rule_id: string;
  context_clue: string | null;
  explanation: string | null;
  confidence: string | null;
};

/** Stored finding: report fields + generated fields persisted in DB. */
export type StoredFinding = ReportFinding & {
  summaryText: string;
  detailsText: string;
  generatedBy: GeneratedBy;
  generatedAt: string;
  false_positive_likelihood?: FalsePositiveLikelihood | null;
  false_positive_reason?: string | null;
};

/** Mutable row during enrichment; summaryText/generatedBy filled before return. */
type EnrichmentRow = ReportFinding & {
  detailsText: string;
  generatedAt: string;
  summaryText?: string;
  generatedBy?: GeneratedBy;
  false_positive_likelihood?: FalsePositiveLikelihood | null;
  false_positive_reason?: string | null;
};

function patternMatchesFinding(pattern: FalsePositivePattern, finding: ReportFinding): boolean {
  const findingRuleId = (finding.checkId ?? "").trim();
  const patternRuleId = (pattern.rule_id ?? "").trim();
  const ruleMatch = findingRuleId === patternRuleId || patternRuleId === "";
  if (!ruleMatch) return false;
  if (pattern.context_clue == null || pattern.context_clue.trim() === "") return true;
  const filePath = (finding.file ?? "").toLowerCase();
  return filePath.includes(pattern.context_clue.trim().toLowerCase());
}

function confidenceToLikelihood(confidence: string | null): FalsePositiveLikelihood {
  const c = (confidence ?? "").toLowerCase();
  if (c === "possible" || c === "possible_fp") return "possible_fp";
  if (c === "likely" || c === "likely_fp") return "likely_fp";
  return "likely_fp";
}

type LlmFindingResult = {
  index: number;
  summaryText: string;
  fixPrompt: string;
  falsePositiveLikelihood: FalsePositiveLikelihood;
  falsePositiveReason: string | null;
};

/**
 * One batch LLM request: input indices and findings, return array of
 * { index, summaryText, fixPrompt, falsePositiveLikelihood, falsePositiveReason } or null on any failure.
 */
async function batchLlmSummaries(
  findings: ReportFinding[],
  indices: number[]
): Promise<Array<LlmFindingResult> | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey || indices.length === 0) return null;

  const list = indices
    .map((i) => {
      const f = findings[i];
      return `[${i}] rule_id: ${f.checkId ?? "n/a"}, scanner: ${f.scanner ?? "semgrep"}, title: ${f.title}, file: ${f.file}, line: ${f.line ?? "n/a"}\nexplanation: ${f.explanation}\nwhyItMatters: ${f.whyItMatters}\nfixSuggestion: ${f.fixSuggestion}`;
    })
    .join("\n\n");

  const prompt = `You are helping developers understand and address security issues in a collaborative way. For each finding below, provide:
1) A short plain-English summary (1-2 sentences, no jargon) for "summaryText".
2) A "fixPrompt" that the developer will paste into an AI coding tool. The fixPrompt must be advisory, not prescriptive. Use this exact structure (plain English):

- Opening: "I'm reviewing a security finding in my codebase and would like your help understanding my options."
- What was found: plain English description of the issue
- File and location: file name and line number
- Security context: what attack or risk this enables, written from a security expert perspective
- What a secure solution should achieve: the outcome (what should be true after a fix), not specific code
- Close with these instructions to the AI: "Before making any changes, please: 1) Explain what you think is causing this issue in my specific code, 2) Suggest 2-3 possible approaches to fix it, 3) Tell me if any approach might affect other parts of my app, 4) Wait for my confirmation before making any changes."

3) A false positive assessment: given the rule_id, file path, scanner, and explanation, assess whether this finding might be a false positive (e.g. test code, example, known safe pattern). Use:
- "falsePositiveLikelihood": one of "confirmed_issue" (real issue, not a false positive), "possible_fp" (might be a false positive), "likely_fp" (likely a false positive).
- "falsePositiveReason": if possible_fp or likely_fp, a brief reason (one sentence); otherwise null.

Findings (index is the number in brackets):

${list}

Respond with ONLY a valid JSON array. One object per finding, in the same order as above. Each object must have:
- "index" (number): the finding index from the list
- "summaryText" (string): short plain-English summary for the card
- "fixPrompt" (string): the advisory prompt in the structure above
- "falsePositiveLikelihood" (string): "confirmed_issue" or "possible_fp" or "likely_fp"
- "falsePositiveReason" (string or null): brief reason if possible_fp/likely_fp, else null

Example: [{"index":0,"summaryText":"...","fixPrompt":"...","falsePositiveLikelihood":"confirmed_issue","falsePositiveReason":null}]
No markdown, no explanation.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) return null;

  const body = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
  const content = body.content;
  if (!Array.isArray(content)) return null;
  const textBlock = content.find((b) => b.type === "text" && typeof b.text === "string");
  const text = textBlock && typeof textBlock.text === "string" ? textBlock.text : null;
  if (!text) return null;

  const trimmed = text.trim();
  const first = trimmed.indexOf("[");
  const last = trimmed.lastIndexOf("]");
  if (first === -1 || last === -1 || last <= first) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed.slice(first, last + 1));
  } catch {
    return null;
  }
  if (!Array.isArray(parsed) || parsed.length !== indices.length) return null;
  const validLikelihoods: FalsePositiveLikelihood[] = ["confirmed_issue", "possible_fp", "likely_fp"];
  const result: LlmFindingResult[] = [];
  for (const item of parsed) {
    if (
      item == null ||
      typeof item !== "object" ||
      typeof (item as { index?: unknown }).index !== "number" ||
      typeof (item as { summaryText?: unknown }).summaryText !== "string" ||
      typeof (item as { fixPrompt?: unknown }).fixPrompt !== "string"
    ) {
      return null;
    }
    const o = item as {
      index: number;
      summaryText: string;
      fixPrompt: string;
      falsePositiveLikelihood?: string;
      falsePositiveReason?: string | null;
    };
    if (!indices.includes(o.index)) return null;
    const likelihood = validLikelihoods.includes((o.falsePositiveLikelihood as FalsePositiveLikelihood) ?? "")
      ? (o.falsePositiveLikelihood as FalsePositiveLikelihood)
      : "confirmed_issue";
    const reason =
      typeof o.falsePositiveReason === "string" && o.falsePositiveReason.trim()
        ? o.falsePositiveReason.trim()
        : null;
    result.push({
      index: o.index,
      summaryText: o.summaryText,
      fixPrompt: o.fixPrompt,
      falsePositiveLikelihood: likelihood,
      falsePositiveReason: reason,
    });
  }
  return result;
}

/**
 * Enrich report findings with summaryText, detailsText, fixPrompt, generatedBy, generatedAt,
 * and optional false_positive_likelihood / false_positive_reason (from patterns first, then Claude).
 * Uses rule-based summaries first (80–90% coverage); batches the rest into ONE LLM call.
 * If LLM fails, uses FALLBACK_SUMMARY so the scan still completes.
 */
export async function enrichFindingsOnce(
  findings: ReportFinding[],
  patterns: FalsePositivePattern[] = []
): Promise<StoredFinding[]> {
  const generatedAt = new Date().toISOString();
  if (findings.length === 0) return [];

  const platform = inferHostingPlatform(findings);
  const needLlm: number[] = [];
  const baseStored: EnrichmentRow[] = findings.map((f, idx): EnrichmentRow => {
    const detailsText = f.explanation ?? "";
    // Gitleaks (secrets): use dedicated summary and platform-aware fix prompt; no LLM.
    if (f.scanner === "gitleaks") {
      return {
        ...f,
        summaryText: GITLEAKS_SUMMARY,
        detailsText,
        fixPrompt: getSecretsFixPrompt(platform, f.file, f.line),
        generatedBy: "rules" as GeneratedBy,
        generatedAt,
      };
    }
    const curated = getCuratedSummary(f.checkId ?? "");
    if (curated) {
      return {
        ...f,
        summaryText: curated,
        detailsText,
        generatedBy: "rules" as GeneratedBy,
        generatedAt,
      };
    }
    needLlm.push(idx);
    return {
      ...f,
      detailsText,
      generatedAt,
    };
  });

  // Apply rule-based false positive patterns: set FP on any finding that matches a pattern.
  for (let i = 0; i < baseStored.length; i++) {
    const row = baseStored[i];
    const finding = findings[i];
    if (!finding) continue;
    for (const pattern of patterns) {
      if (patternMatchesFinding(pattern, finding)) {
        row.false_positive_likelihood = confidenceToLikelihood(pattern.confidence);
        row.false_positive_reason = pattern.explanation?.trim() || null;
        break;
      }
    }
  }

  if (needLlm.length > 0) {
    const llmResult = await batchLlmSummaries(findings, needLlm);

    if (llmResult) {
      for (const { index, summaryText, fixPrompt, falsePositiveLikelihood, falsePositiveReason } of llmResult) {
        const row = baseStored[index];
        if (row) {
          row.summaryText = summaryText;
          row.fixPrompt = fixPrompt?.trim() || row.fixPrompt;
          row.generatedBy = "llm";
          if (row.false_positive_likelihood == null) {
            row.false_positive_likelihood = falsePositiveLikelihood;
            row.false_positive_reason = falsePositiveReason;
          }
        }
      }
    }
  }

  for (let i = 0; i < baseStored.length; i++) {
    const row = baseStored[i];
    if (row.summaryText == null || row.generatedBy == null) {
      row.summaryText = FALLBACK_SUMMARY;
      row.generatedBy = "rules_fallback";
    }
  }

  return baseStored as StoredFinding[];
}
