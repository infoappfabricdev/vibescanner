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

/** Safe fallback when LLM is unavailable. Scan still completes. */
export const FALLBACK_SUMMARY =
  "This finding may indicate a security issue. Review the details and consider applying the recommended fix.";

export type GeneratedBy = "rules" | "llm" | "rules_fallback";

/** Stored finding: report fields + generated fields persisted in DB. */
export type StoredFinding = ReportFinding & {
  summaryText: string;
  detailsText: string;
  generatedBy: GeneratedBy;
  generatedAt: string;
};

/** Mutable row during enrichment; summaryText/generatedBy filled before return. */
type EnrichmentRow = ReportFinding & {
  detailsText: string;
  generatedAt: string;
  summaryText?: string;
  generatedBy?: GeneratedBy;
};

/**
 * One batch LLM request: input indices and findings, return array of
 * { index, summaryText, fixPrompt } or null on any failure.
 */
async function batchLlmSummaries(
  findings: ReportFinding[],
  indices: number[]
): Promise<Array<{ index: number; summaryText: string; fixPrompt: string }> | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey || indices.length === 0) return null;

  const list = indices
    .map((i) => {
      const f = findings[i];
      return `[${i}] title: ${f.title}, file: ${f.file}, line: ${f.line ?? "n/a"}\nexplanation: ${f.explanation}\nwhyItMatters: ${f.whyItMatters}\nfixSuggestion: ${f.fixSuggestion}`;
    })
    .join("\n\n");

  const prompt = `You are helping developers fix security issues. For each finding below, provide a short plain-English summary (1-2 sentences, no jargon) and a copy-paste fix prompt for an AI coding tool.

Findings (index is the number in brackets):

${list}

Respond with ONLY a valid JSON array. One object per finding, in the same order as above. Each object must have:
- "index" (number): the finding index from the list
- "summaryText" (string): short plain-English summary for the card
- "fixPrompt" (string): actionable fix prompt for the developer

Example: [{"index":0,"summaryText":"...","fixPrompt":"..."}]
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
  const result: Array<{ index: number; summaryText: string; fixPrompt: string }> = [];
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
    const o = item as { index: number; summaryText: string; fixPrompt: string };
    if (!indices.includes(o.index)) return null;
    result.push(o);
  }
  return result;
}

/**
 * Enrich report findings with summaryText, detailsText, fixPrompt, generatedBy, generatedAt.
 * Uses rule-based summaries first (80–90% coverage); batches the rest into ONE LLM call.
 * If LLM fails, uses FALLBACK_SUMMARY so the scan still completes.
 */
export async function enrichFindingsOnce(findings: ReportFinding[]): Promise<StoredFinding[]> {
  const generatedAt = new Date().toISOString();
  if (findings.length === 0) return [];

  const needLlm: number[] = [];
  const baseStored: EnrichmentRow[] = findings.map((f, idx): EnrichmentRow => {
    const detailsText = f.explanation ?? "";
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

  if (needLlm.length === 0) {
    return baseStored as StoredFinding[];
  }

  const llmResult = await batchLlmSummaries(findings, needLlm);

  if (llmResult) {
    for (const { index, summaryText, fixPrompt } of llmResult) {
      const row = baseStored[index];
      if (row) {
        row.summaryText = summaryText;
        row.fixPrompt = fixPrompt?.trim() || row.fixPrompt;
        row.generatedBy = "llm";
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
