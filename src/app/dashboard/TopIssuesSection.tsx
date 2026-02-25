"use client";

import { useState, useEffect, useMemo } from "react";
import type { NormalizedFinding, FindingState, FindingStatus } from "./types";
import { getFindingStates, setFindingState, resetFindingStatusStore } from "./findingState";
import { buildFixWithAIPrompt } from "@/lib/fix-with-ai-prompt";
import type { StatusFilter } from "@/components/dashboard/FindingsFilterBar";
import FindingsFilterBar from "@/components/dashboard/FindingsFilterBar";
import FindingCard from "@/components/dashboard/FindingCard";
import FixWithAIModal from "@/components/dashboard/FixWithAIModal";

const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 };

type Props = {
  findings: NormalizedFinding[];
  emptyMessage?: React.ReactNode;
};

function filterBySeveritySearchQuickFix<T extends NormalizedFinding>(
  list: T[],
  severityFilter: Set<"high" | "medium" | "low">,
  quickFixOnly: boolean,
  searchQuery: string
): T[] {
  let out = list.filter((f) => severityFilter.has(f.severity));
  if (quickFixOnly) out = out.filter((f) => f.quickFixAvailable);
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    out = out.filter(
      (f) =>
        f.filePath.toLowerCase().includes(q) ||
        (f.ruleId && f.ruleId.toLowerCase().includes(q)) ||
        f.title.toLowerCase().includes(q) ||
        f.summaryText.toLowerCase().includes(q) ||
        f.detailsText.toLowerCase().includes(q)
    );
  }
  return [...out].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

function statusLabel(s: FindingStatus): string {
  if (s === "false_positive") return "False positive";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function TopIssuesSection({ findings, emptyMessage }: Props) {
  const [stateByFindingId, setStateByFindingId] = useState<Record<string, FindingState>>({});
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("open");
  const [severityFilter, setSeverityFilter] = useState<Set<"high" | "medium" | "low">>(new Set(["high", "medium", "low"]));
  const [quickFixOnly, setQuickFixOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [fixWithAIModalFinding, setFixWithAIModalFinding] = useState<NormalizedFinding | null>(null);

  useEffect(() => {
    setStateByFindingId(getFindingStates());
  }, []);

  const onSeverityToggle = (s: "high" | "medium" | "low") => {
    setSeverityFilter((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  };

  const getStatus = (id: string): FindingStatus => stateByFindingId[id]?.status ?? "open";

  const openFindings = useMemo(
    () => findings.filter((f) => getStatus(f.id) === "open"),
    [findings, stateByFindingId]
  );
  const fixedFindings = useMemo(
    () => findings.filter((f) => getStatus(f.id) === "fixed"),
    [findings, stateByFindingId]
  );
  const ignoredFindings = useMemo(
    () => findings.filter((f) => getStatus(f.id) === "ignored"),
    [findings, stateByFindingId]
  );
  const falsePositiveFindings = useMemo(
    () => findings.filter((f) => getStatus(f.id) === "false_positive"),
    [findings, stateByFindingId]
  );
  const otherFindings = useMemo(
    () => findings.filter((f) => getStatus(f.id) === "other"),
    [findings, stateByFindingId]
  );

  const filteredOpen = useMemo(
    () => filterBySeveritySearchQuickFix(openFindings, severityFilter, quickFixOnly, searchQuery),
    [openFindings, severityFilter, quickFixOnly, searchQuery]
  );
  const filteredFixed = useMemo(
    () => filterBySeveritySearchQuickFix(fixedFindings, severityFilter, quickFixOnly, searchQuery),
    [fixedFindings, severityFilter, quickFixOnly, searchQuery]
  );
  const filteredIgnored = useMemo(
    () => filterBySeveritySearchQuickFix(ignoredFindings, severityFilter, quickFixOnly, searchQuery),
    [ignoredFindings, severityFilter, quickFixOnly, searchQuery]
  );
  const filteredFalsePositive = useMemo(
    () => filterBySeveritySearchQuickFix(falsePositiveFindings, severityFilter, quickFixOnly, searchQuery),
    [falsePositiveFindings, severityFilter, quickFixOnly, searchQuery]
  );
  const filteredAll = useMemo(
    () => filterBySeveritySearchQuickFix(findings, severityFilter, quickFixOnly, searchQuery),
    [findings, severityFilter, quickFixOnly, searchQuery]
  );

  const handleStatusChange = (finding: NormalizedFinding, newStatus: FindingStatus) => {
    const current = getStatus(finding.id);
    if (current === newStatus) return;
    const prev = stateByFindingId[finding.id];
    const state: FindingState = {
      status: newStatus,
      notes: prev?.notes,
      reason: prev?.reason ?? undefined,
      updatedAt: new Date().toISOString(),
    };
    setFindingState(finding.id, state);
    setStateByFindingId((prev) => ({ ...prev, [finding.id]: state }));
  };

  const handleNotesChange = (findingId: string, notes: string) => {
    const prev = stateByFindingId[findingId];
    const state: FindingState = {
      status: prev?.status ?? "open",
      notes: notes || undefined,
      reason: prev?.reason ?? undefined,
      updatedAt: new Date().toISOString(),
    };
    setFindingState(findingId, state);
    setStateByFindingId((p) => ({ ...p, [findingId]: state }));
  };

  const handleReasonChange = (findingId: string, reason: string | null) => {
    const prev = stateByFindingId[findingId];
    const state: FindingState = {
      status: prev?.status ?? "open",
      notes: prev?.notes,
      reason: reason ?? undefined,
      updatedAt: new Date().toISOString(),
    };
    setFindingState(findingId, state);
    setStateByFindingId((p) => ({ ...p, [findingId]: state }));
  };

  const handleResetFindingState = () => {
    if (!window.confirm("This clears your local finding status and returns everything to open. Continue?")) return;
    resetFindingStatusStore();
    setStateByFindingId({});
  };

  const getPromptForFinding = (finding: NormalizedFinding) =>
    buildFixWithAIPrompt({
      title: finding.title,
      detailsText: finding.detailsText,
      filePath: finding.filePath,
      line: finding.line,
      ruleId: finding.ruleId,
      fixPrompt: finding.fixPrompt,
    });

  const handleFixWithAIModalCopy = () => {
    if (!fixWithAIModalFinding) return;
    const prompt = getPromptForFinding(fixWithAIModalFinding);
    navigator.clipboard.writeText(prompt);
    setFixWithAIModalFinding(null);
  };

  if (findings.length === 0) {
    return <>{emptyMessage ?? null}</>;
  }

  const displayList =
    statusFilter === "open"
      ? filteredOpen
      : statusFilter === "fixed"
        ? filteredFixed
        : statusFilter === "ignored"
          ? filteredIgnored
          : statusFilter === "false_positive"
            ? filteredFalsePositive
            : filteredAll;
  const displayTotal =
    statusFilter === "open"
      ? openFindings.length
      : statusFilter === "fixed"
        ? fixedFindings.length
        : statusFilter === "ignored"
          ? ignoredFindings.length
          : statusFilter === "false_positive"
            ? falsePositiveFindings.length
            : findings.length;

  return (
    <>
      <FindingsFilterBar
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        severityFilter={severityFilter}
        onSeverityToggle={onSeverityToggle}
        quickFixOnly={quickFixOnly}
        onQuickFixOnlyChange={setQuickFixOnly}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showingCount={displayList.length}
        totalCount={displayTotal}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {displayList.map((finding) => (
          <FindingCard
            key={finding.id}
            finding={finding}
            status={getStatus(finding.id)}
            notes={stateByFindingId[finding.id]?.notes}
            reason={stateByFindingId[finding.id]?.reason ?? null}
            onStatusChange={handleStatusChange}
            onNotesChange={(f, notes) => handleNotesChange(f.id, notes)}
            onReasonChange={(f, reason) => handleReasonChange(f.id, reason)}
            onFixWithAI={setFixWithAIModalFinding}
          />
        ))}
      </div>

      {displayList.length === 0 && (
        <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", margin: "1rem 0 0" }}>
          {statusFilter === "open"
            ? "No open findings match your filters. Change status filter to see Fixed, Ignored, or False positive."
            : statusFilter === "all"
              ? "No findings match your filters."
              : `No ${statusFilter.replace("_", " ")} findings match your filters.`}
        </p>
      )}

      <p style={{ marginTop: "1rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
        <button
          type="button"
          onClick={handleResetFindingState}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            color: "var(--text-muted)",
            textDecoration: "underline",
          }}
        >
          Reset finding state
        </button>
        {" "}— clear all status and notes, return every issue to Open.
      </p>

      <FixWithAIModal
        open={fixWithAIModalFinding !== null}
        prompt={fixWithAIModalFinding ? getPromptForFinding(fixWithAIModalFinding) : ""}
        onCopy={handleFixWithAIModalCopy}
        onClose={() => setFixWithAIModalFinding(null)}
      />
    </>
  );
}
