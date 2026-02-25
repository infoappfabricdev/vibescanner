"use client";

import { useRef, useEffect } from "react";

type Props = {
  open: boolean;
  prompt: string;
  onCopy: () => void;
  onClose: () => void;
};

export default function FixWithAIModal({ open, prompt, onCopy, onClose }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open && textareaRef.current) {
      textareaRef.current.select();
    }
  }, [open]);

  if (!open) return null;

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
        aria-labelledby="fix-with-ai-modal-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--card)",
          borderRadius: "12px",
          padding: "1.5rem",
          maxWidth: "32rem",
          width: "100%",
          border: "1px solid var(--border)",
          boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
        }}
      >
        <h3
          id="fix-with-ai-modal-title"
          style={{ margin: "0 0 0.75rem", fontSize: "1.125rem", fontWeight: 600, color: "var(--text)" }}
        >
          Fix this issue with AI
        </h3>
        <p
          style={{
            margin: "0 0 1rem",
            fontSize: "0.875rem",
            color: "var(--text-muted)",
            lineHeight: 1.5,
          }}
        >
          Copy this prompt and paste it into your AI coding tool (Cursor, ChatGPT, Claude, etc.)
        </p>
        <textarea
          ref={textareaRef}
          readOnly
          value={prompt}
          rows={12}
          style={{
            width: "100%",
            padding: "0.75rem",
            marginBottom: "1.25rem",
            fontSize: "0.8125rem",
            fontFamily: "ui-monospace, monospace",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            background: "var(--bg, #fff)",
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
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              onCopy();
            }}
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
            Copy prompt
          </button>
        </div>
      </div>
    </div>
  );
}
