"use client";

import { useState } from "react";

type Props = {
  open: boolean;
  findingTitle: string;
  newStatusLabel: string;
  onSave: (note: string) => void;
  onClose: () => void;
};

export default function AddNoteModal({
  open,
  findingTitle,
  newStatusLabel,
  onSave,
  onClose,
}: Props) {
  const [note, setNote] = useState("");

  if (!open) return null;

  function handleSave() {
    onSave(note.trim());
    setNote("");
    onClose();
  }

  function handleClose() {
    setNote("");
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
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-note-modal-title"
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
          id="add-note-modal-title"
          style={{ margin: "0 0 0.5rem", fontSize: "1.125rem", fontWeight: 600, color: "var(--text)" }}
        >
          Add a note (optional)
        </h3>
        <p style={{ margin: "0 0 0.75rem", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
          Marking as {newStatusLabel}: {findingTitle}
        </p>
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
            onClick={handleClose}
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
