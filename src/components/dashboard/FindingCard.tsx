"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { NormalizedFinding, FindingStatus } from "@/app/dashboard/types";

const STATUS_OPTIONS: { value: FindingStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "fixed", label: "Fixed" },
  { value: "ignored", label: "Ignored" },
  { value: "false_positive", label: "False positive" },
  { value: "other", label: "Other..." },
];

function statusBadgeColor(s: FindingStatus): string {
  switch (s) {
    case "open":
      return "#6b7280";
    case "fixed":
      return "var(--success, #22c55e)";
    case "ignored":
      return "var(--warn, #eab308)";
    case "false_positive":
      return "#3b82f6";
    case "other":
      return "#a855f7";
    default:
      return "#6b7280";
  }
}

function statusLabel(s: FindingStatus): string {
  if (s === "false_positive") return "False positive";
  if (s === "other") return "Other";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const NOTES_PREVIEW_TRUNCATE = 80;
const SAVE_INDICATOR_MS = 2000;
const NOTES_DEBOUNCE_MS = 500;
const REASON_DEBOUNCE_MS = 400;
const OTHER_REASON_MAX_LENGTH = 80;

type Props = {
  finding: NormalizedFinding;
  status: FindingStatus;
  notes?: string;
  reason?: string | null;
  onStatusChange: (finding: NormalizedFinding, newStatus: FindingStatus) => void;
  onNotesChange?: (finding: NormalizedFinding, notes: string) => void;
  onReasonChange?: (finding: NormalizedFinding, reason: string | null) => void;
  onFixWithAI: (finding: NormalizedFinding) => void;
};

const severityColor = (s: string) =>
  s === "critical" ? "#b91c1c" : s === "high" ? "var(--danger)" : s === "medium" ? "var(--warn)" : "#6b7280";

const borderColor = (s: string) =>
  s === "critical" ? "#b91c1c" : s === "high" ? "var(--danger)" : s === "medium" ? "#eab308" : "#9ca3af";

export default function FindingCard({
  finding,
  status,
  notes = "",
  reason = "",
  onStatusChange,
  onNotesChange,
  onReasonChange,
  onFixWithAI,
}: Props) {
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [notesLocal, setNotesLocal] = useState(notes);
  const [reasonLocal, setReasonLocal] = useState(reason ?? "");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const notesDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reasonDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setNotesLocal(notes);
  }, [notes, finding.id]);

  useEffect(() => {
    setReasonLocal(reason ?? "");
  }, [reason, finding.id]);

  const flushNotes = useCallback(() => {
    if (notesDebounceRef.current) {
      clearTimeout(notesDebounceRef.current);
      notesDebounceRef.current = null;
    }
    onNotesChange?.(finding, notesLocal);
    setSavedAt(Date.now());
  }, [finding, notesLocal, onNotesChange]);

  const handleReasonChange = useCallback(
    (value: string) => {
      setReasonLocal(value);
      if (reasonDebounceRef.current) clearTimeout(reasonDebounceRef.current);
      reasonDebounceRef.current = setTimeout(() => {
        reasonDebounceRef.current = null;
        onReasonChange?.(finding, value || null);
      }, REASON_DEBOUNCE_MS);
    },
    [finding, onReasonChange]
  );

  useEffect(() => {
    return () => {
      if (notesDebounceRef.current) clearTimeout(notesDebounceRef.current);
      if (reasonDebounceRef.current) clearTimeout(reasonDebounceRef.current);
    };
  }, []);

  useEffect(() => {
    if (savedAt === null) return;
    const t = setTimeout(() => setSavedAt(null), SAVE_INDICATOR_MS);
    return () => clearTimeout(t);
  }, [savedAt]);

  const handleNotesChange = useCallback(
    (value: string) => {
      setNotesLocal(value);
      if (notesDebounceRef.current) clearTimeout(notesDebounceRef.current);
      notesDebounceRef.current = setTimeout(() => {
        notesDebounceRef.current = null;
        onNotesChange?.(finding, value);
        setSavedAt(Date.now());
      }, NOTES_DEBOUNCE_MS);
    },
    [finding, onNotesChange]
  );

  const showReasonField =
    status === "ignored" || status === "false_positive" || status === "other";

  const subheader =
    finding.filePath +
    (finding.line != null ? ` (line ${finding.line})` : "") +
    (finding.ruleId ? ` · ${finding.ruleId}` : "");
  const summaryTruncated =
    finding.summaryText.length > 160
      ? finding.summaryText.slice(0, 160).trim() + "\u2026"
      : finding.summaryText;
  const notesPreview =
    notes && notes.length > NOTES_PREVIEW_TRUNCATE
      ? notes.slice(0, NOTES_PREVIEW_TRUNCATE).trim() + "\u2026"
      : notes;

  return (
    <div
      className="dashboard-issue-card"
      style={{
        padding: "1.25rem 1.5rem",
        borderRadius: "12px",
        border: "1px solid var(--border)",
        borderLeftWidth: "4px",
        borderLeftColor: borderColor(finding.severity),
        background: "#f9fafb",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "0.75rem",
        }}
      >
        <div style={{ flex: "1 1 0", minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "0.375rem",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                padding: "0.25rem 0.5rem",
                fontSize: "0.75rem",
                fontWeight: 600,
                borderRadius: "6px",
                background: severityColor(finding.severity),
                color: "#fff",
                textTransform: "capitalize",
              }}
            >
              {finding.severity}
            </span>
            <span
              style={{
                padding: "0.2rem 0.45rem",
                fontSize: "0.6875rem",
                fontWeight: 600,
                borderRadius: "4px",
                background: statusBadgeColor(status),
                color: "#fff",
              }}
            >
              {statusLabel(status)}
            </span>
            {finding.scanner && (
              <span
                style={{
                  fontSize: "0.6875rem",
                  color: "var(--text-muted)",
                  textTransform: "capitalize",
                }}
              >
                {finding.scanner}
              </span>
            )}
            {finding.quickFixAvailable && (
              <span
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 500,
                  color: "var(--text-muted)",
                }}
              >
                Quick fix available
              </span>
            )}
            {notes && (
              <span
                style={{
                  fontSize: "0.6875rem",
                  color: "var(--text-muted)",
                  fontWeight: 500,
                }}
              >
                Note
              </span>
            )}
          </div>
          <h3
            style={{
              margin: "0 0 0.25rem",
              fontSize: "1rem",
              fontWeight: 600,
              color: "var(--text)",
            }}
          >
            {finding.title}
          </h3>
          {notes && (
            <p
              style={{
                margin: "0 0 0.5rem",
                fontSize: "0.8125rem",
                color: "var(--text-muted)",
                display: "-webkit-box",
                WebkitLineClamp: 1,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
              title={notes}
            >
              {notesPreview}
            </p>
          )}
          <p
            style={{
              margin: 0,
              fontSize: "0.8125rem",
              color: "var(--text-muted)",
            }}
          >
            {subheader}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "0.875rem",
              lineHeight: 1.5,
              color: "var(--text-muted)",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {summaryTruncated}
          </p>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "0.5rem",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() => onFixWithAI(finding)}
              style={{
                padding: "0.5rem 1rem",
                fontSize: "0.8125rem",
                fontWeight: 500,
                background: "var(--brand)",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Help your AI fix this
            </button>
            <select
              value={status}
              onChange={(e) =>
                onStatusChange(finding, e.target.value as FindingStatus)
              }
              style={{
                padding: "0.4rem 0.6rem",
                fontSize: "0.8125rem",
                fontWeight: 500,
                border: "1px solid var(--border)",
                borderRadius: "8px",
                background: "var(--card)",
                color: "var(--text)",
                cursor: "pointer",
                minWidth: "7rem",
              }}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setDetailsExpanded((e) => !e)}
              style={{
                padding: "0.5rem 1rem",
                fontSize: "0.8125rem",
                fontWeight: 500,
                background: "transparent",
                color: "var(--text-muted)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              {detailsExpanded ? "Hide details" : "View details"}
            </button>
          </div>
        </div>
      </div>

      {detailsExpanded && (
        <div
          style={{
            marginTop: "1rem",
            paddingTop: "1rem",
            borderTop: "1px solid var(--border)",
            fontSize: "0.875rem",
            color: "var(--text-muted)",
            lineHeight: 1.6,
          }}
        >
          {/* Resolution section */}
          <p
            style={{
              margin: "0 0 0.75rem",
              fontWeight: 600,
              color: "var(--text)",
              fontSize: "0.9375rem",
            }}
          >
            Resolution
          </p>
          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.35rem",
                fontWeight: 500,
                color: "var(--text)",
                fontSize: "0.8125rem",
              }}
            >
              Status
            </label>
            <select
              value={status}
              onChange={(e) =>
                onStatusChange(finding, e.target.value as FindingStatus)
              }
              style={{
                padding: "0.4rem 0.6rem",
                fontSize: "0.8125rem",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                background: "var(--card)",
                color: "var(--text)",
                cursor: "pointer",
                minWidth: "8rem",
              }}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.35rem",
                fontWeight: 500,
                color: "var(--text)",
                fontSize: "0.8125rem",
              }}
            >
              Notes
            </label>
            <textarea
              value={notesLocal}
              onChange={(e) => handleNotesChange(e.target.value)}
              onBlur={flushNotes}
              placeholder="Add notes (optional)…"
              rows={3}
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem",
                fontSize: "0.875rem",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                background: "var(--card)",
                color: "var(--text)",
                resize: "vertical",
              }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.35rem" }}>
              <button
                type="button"
                onClick={flushNotes}
                style={{
                  padding: "0.35rem 0.65rem",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  background: "var(--card)",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                }}
              >
                Save
              </button>
              {savedAt !== null && (
                <span style={{ fontSize: "0.75rem", color: "var(--success, #22c55e)" }}>
                  Saved
                </span>
              )}
            </div>
          </div>
          {showReasonField && onReasonChange && (
            <div style={{ marginBottom: "1rem" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.35rem",
                  fontWeight: 500,
                  color: "var(--text)",
                  fontSize: "0.8125rem",
                }}
              >
                {status === "other" ? "Other reason" : "Reason"}
              </label>
              <input
                type="text"
                value={reasonLocal}
                onChange={(e) => handleReasonChange(e.target.value)}
                onBlur={(e) => {
                  if (reasonDebounceRef.current) {
                    clearTimeout(reasonDebounceRef.current);
                    reasonDebounceRef.current = null;
                  }
                  onReasonChange?.(finding, e.target.value.trim() || null);
                }}
                maxLength={status === "other" ? OTHER_REASON_MAX_LENGTH : undefined}
                placeholder={status === "other" ? "Brief reason…" : "Optional reason…"}
                style={{
                  width: "100%",
                  padding: "0.5rem 0.75rem",
                  fontSize: "0.875rem",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  background: "var(--card)",
                  color: "var(--text)",
                }}
              />
              {status === "other" && (
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  {reasonLocal.length}/{OTHER_REASON_MAX_LENGTH}
                </p>
              )}
            </div>
          )}

          <p style={{ margin: "1rem 0 0.5rem", fontWeight: 600, color: "var(--text)" }}>
            Description
          </p>
          <p style={{ margin: "0 0 0.75rem" }}>{finding.detailsText}</p>
          {finding.whyItMatters && (
            <>
              <p style={{ margin: "0 0 0.5rem", fontWeight: 600, color: "var(--text)" }}>
                Why it matters
              </p>
              <p style={{ margin: "0 0 0.75rem" }}>{finding.whyItMatters}</p>
            </>
          )}
          <p style={{ margin: "0 0 0.5rem", fontWeight: 600, color: "var(--text)" }}>
            Suggested fix
          </p>
          <p
            style={{
              margin: "0 0 0.5rem",
              whiteSpace: "pre-wrap",
              fontFamily: "ui-monospace, monospace",
              fontSize: "0.8125rem",
            }}
          >
            {finding.fixSuggestion ||
              finding.fixPrompt ||
              "Use Help your AI fix this to generate a fix."}
          </p>
          <p style={{ margin: "0 0 0.75rem", fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
            Fix suggestions are for review purposes. Always verify changes before applying them to your codebase.
          </p>
          <p style={{ margin: 0, fontWeight: 600, color: "var(--text)" }}>
            Location
          </p>
          <p style={{ margin: 0 }}>
            {finding.filePath}
            {finding.line != null ? `:${finding.line}` : ""}
          </p>
        </div>
      )}
    </div>
  );
}
