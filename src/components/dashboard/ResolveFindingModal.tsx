"use client";

import { useState } from "react";
import type { FindingStatus } from "@/app/dashboard/types";

export const RESOLVE_OPTIONS: { value: Exclude<FindingStatus, "open">; label: string }[] = [
  { value: "fixed", label: "Fixed" },
  { value: "ignored", label: "Ignore" },
  { value: "false_positive", label: "False positive" },
];

type Props = {
  open: boolean;
  findingTitle: string;
  onSave: (status: Exclude<FindingStatus, "open">, note: string) => void;
  onClose: () => void;
};

export default function ResolveFindingModal({
  open,
  findingTitle,
  onSave,
  onClose,
}: Props) {
  const [status, setStatus] = useState<Exclude<FindingStatus, "open">>("fixed");
  const [note, setNote] = useState("");

  if (!open) return null;

  function handleSave() {
    onSave(status, note.trim());
    setNote("");
    setStatus("fixed");
    onClose();
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="resolve-modal-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--card)",
          borderRadius: "12px",
          padding: "1.5rem",
          maxWidth: "24rem",
          width: "100%",
          border: "1px solid var(--border)",
          boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
        }}
      >
        <h3
          id="resolve-modal-title"
          style={{ margin: "0 0 1rem", fontSize: "1.125rem", fontWeight: 600, color: "var(--text)" }}
        >
          Resolve issue
        </h3>
        <p style={{ margin: "0 0 1rem", fontSize: "0.875rem", color: "var(--text-muted)" }}>
          {findingTitle}
        </p>
        <label
          style={{
            display: "block",
            marginBottom: "0.5rem",
            fontSize: "0.8125rem",
            fontWeight: 500,
            color: "var(--text)",
          }}
        >
          Status
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as Exclude<FindingStatus, "open">)}
          style={{
            width: "100%",
            padding: "0.5rem 0.75rem",
            marginBottom: "1rem",
            fontSize: "0.875rem",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            background: "var(--card)",
            color: "var(--text)",
          }}
        >
          {RESOLVE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <label
          style={{
            display: "block",
            marginBottom: "0.5rem",
            fontSize: "0.8125rem",
            fontWeight: 500,
            color: "var(--text)",
          }}
        >
          Notes (optional)
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note..."
          rows={3}
          style={{
            width: "100%",
            padding: "0.5rem 0.75rem",
            marginBottom: "1.25rem",
            fontSize: "0.875rem",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            background: "var(--card)",
            color: "var(--text)",
            resize: "vertical",
          }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "0.5rem 1rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              border: "1px solid var(--border)",
              borderRadius: "8px",
              background: "transparent",
              color: "var(--text-muted)",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            style={{
              padding: "0.5rem 1rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              border: "none",
              borderRadius: "8px",
              background: "var(--brand)",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
