"use client";

import { useState } from "react";

export const DISMISS_REASONS = [
  "False positive",
  "Accept risk",
  "Not applicable",
  "Will fix later",
] as const;

type Props = {
  open: boolean;
  findingTitle: string;
  onConfirm: (reason: string, note: string) => void;
  onClose: () => void;
};

export default function DismissFindingModal({
  open,
  findingTitle,
  onConfirm,
  onClose,
}: Props) {
  const [reason, setReason] = useState(DISMISS_REASONS[0]);
  const [note, setNote] = useState("");

  if (!open) return null;

  function handleConfirm() {
    onConfirm(reason, note.trim());
    setNote("");
    setReason(DISMISS_REASONS[0]);
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
        aria-labelledby="dismiss-modal-title"
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
        <h3 id="dismiss-modal-title" style={{ margin: "0 0 1rem", fontSize: "1.125rem", fontWeight: 600, color: "var(--text)" }}>
          Dismiss finding
        </h3>
        <p style={{ margin: "0 0 1rem", fontSize: "0.875rem", color: "var(--text-muted)" }}>
          {findingTitle}
        </p>
        <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.8125rem", fontWeight: 500, color: "var(--text)" }}>
          Reason
        </label>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value as typeof reason)}
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
          {DISMISS_REASONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.8125rem", fontWeight: 500, color: "var(--text)" }}>
          Note (optional)
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
            onClick={handleConfirm}
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
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
