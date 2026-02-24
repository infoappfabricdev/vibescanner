/**
 * Call Anthropic Claude once with all findings and get back a JSON array of
 * plain-English fix prompts (one per finding, same order). Returns null on
 * any failure so the caller can keep rule-based prompts.
 */

import type { ReportFinding } from "./semgrep-report";

const MODEL = "claude-sonnet-4-6";
const ANTHROPIC_VERSION = "2023-06-01";

function buildUserPrompt(findings: ReportFinding[]): string {
  const list = findings
    .map(
      (f, i) =>
        `[${i + 1}] file: ${f.file}, line: ${f.line ?? "unknown"}, title: ${f.title}\n` +
        `    explanation: ${f.explanation}\n` +
        `    why it matters: ${f.whyItMatters}\n` +
        `    fix suggestion: ${f.fixSuggestion}`
    )
    .join("\n\n");

  return `You are helping non-technical users fix security issues in their code by generating copy-paste prompts for AI coding tools (Lovable, Bolt, Cursor).

Below are ${findings.length} security findings. For each finding, output exactly one fix prompt string. The prompts must be in the SAME ORDER as the findings (1st prompt for 1st finding, etc.).

Required format for each fix prompt (plain English, no jargon):
"In [filename] at line [X], there is a security issue: [plain English description]. Please fix this by [specific actionable instruction]. Do not use technical jargon."

Include the exact file name and line number from the finding. Be specific and actionable so a user can paste the string into an AI tool and get a fix.

Findings:

${list}

Respond with ONLY a valid JSON array of ${findings.length} strings — one string per finding, in order. No markdown, no explanation. Example: ["In src/auth.js at line 42, there is a security issue: ...", "In lib/db.js at line 10, there is a security issue: ..."]`;
}

function extractTextFromResponse(body: { content?: Array<{ type: string; text?: string }> }): string | null {
  const content = body.content;
  if (!Array.isArray(content)) return null;
  const block = content.find((b) => b.type === "text" && typeof b.text === "string");
  return block && typeof block.text === "string" ? block.text : null;
}

function parseFixPrompts(text: string, expectedLength: number): string[] | null {
  const trimmed = text.trim();
  const first = trimmed.indexOf("[");
  const last = trimmed.lastIndexOf("]");
  if (first === -1 || last === -1 || last <= first) return null;
  try {
    const parsed = JSON.parse(trimmed.slice(first, last + 1));
    if (!Array.isArray(parsed) || parsed.length !== expectedLength) return null;
    if (!parsed.every((x) => typeof x === "string")) return null;
    return parsed as string[];
  } catch {
    return null;
  }
}

/**
 * Call Anthropic API once with all findings; returns array of fix prompts in
 * same order, or null if key missing, API error, or invalid response.
 */
export async function enrichFixPromptsWithClaude(findings: ReportFinding[]): Promise<string[] | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey || findings.length === 0) return null;

  const userPrompt = buildUserPrompt(findings);

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!res.ok) return null;

  const body = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
  const text = extractTextFromResponse(body);
  if (!text) return null;

  return parseFixPrompts(text, findings.length);
}
