/**
 * Universal "Fix with AI" prompt builder. Tool-agnostic; reusable for
 * dashboard, API, VS Code extension, GitHub PR integration, etc.
 */

export type FindingForPrompt = {
  title: string;
  /** Full technical description for the AI (detailsText). */
  detailsText: string;
  filePath: string;
  line: number | null;
  ruleId: string | null;
  fixPrompt: string;
};

/**
 * Build a single prompt for pasting into any AI coding tool.
 * Format: senior security engineer persona, issue context, return code only.
 */
export function buildFixWithAIPrompt(finding: FindingForPrompt): string {
  const loc =
    finding.line != null
      ? `${finding.filePath}:${finding.line}`
      : finding.filePath;
  const fixInstructions =
    finding.fixPrompt?.trim() ||
    "Explain the issue and provide a secure fix. Apply the fix directly in code.";

  return `You are a senior security engineer.
Fix the following issue. Return code only.

---
Title: ${finding.title}
File: ${loc}
${finding.ruleId ? `Rule: ${finding.ruleId}\n` : ""}

Description:
${finding.detailsText}

Instructions:
${fixInstructions}
---`;
}
