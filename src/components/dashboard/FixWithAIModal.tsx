"use client";

import { useRef, useEffect, useState } from "react";
import { FixPromptDisclaimer } from "@/components/ui/CopyFixPromptButton";

const POPOVER_TEXT =
  "How to use this safely: 1) Open your AI tool in chat or conversation mode, 2) Paste the prompt, 3) Review suggestions before applying any changes, 4) Ask follow-up questions if anything is unclear. Tip: Avoid agent or auto-apply mode until you have reviewed the suggested changes.";

type Props = {
  open: boolean;
  prompt: string;
  onCopy: () => void;
  onClose: () => void;
};

export default function FixWithAIModal({ open, prompt, onCopy, onClose }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showPopover, setShowPopover] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open && textareaRef.current) {
      textareaRef.current.select();
    }
    if (!open) {
      setShowPopover(false);
      setCopied(false);
    }
  }, [open]);

  useEffect(() => {
    if (copied) {
      const t = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(t);
    }
  }, [copied]);

  function handleCopyClick() {
    if (showPopover) return;
    setShowPopover(true);
  }

  function handleGotIt() {
    setShowPopover(false);
    try {
      navigator.clipboard.writeText(prompt);
      setCopied(true);
    } catch {
      // ignore
    }
    onCopy();
  }

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
            marginBottom: "0.5rem",
            fontSize: "0.8125rem",
            fontFamily: "ui-monospace, monospace",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            background: "var(--bg, #fff)",
            color: "var(--text)",
            resize: "vertical",
          }}
        />
        <FixPromptDisclaimer />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.25rem", position: "relative", flexWrap: "wrap" }}>
          {showPopover && (
            <div
              role="dialog"
              aria-label="How to use this safely"
              style={{
                position: "absolute",
                bottom: "100%",
                right: 0,
                marginBottom: "0.5rem",
                width: "min(320px, 100%)",
                padding: "1rem",
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                fontSize: "0.8125rem",
                lineHeight: 1.5,
                color: "var(--text)",
                zIndex: 10,
              }}
            >
              <p style={{ margin: "0 0 0.75rem" }}>{POPOVER_TEXT}</p>
              <button
                type="button"
                onClick={handleGotIt}
                style={{
                  padding: "0.4rem 0.75rem",
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  background: "var(--brand)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Got it
              </button>
            </div>
          )}
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
            onClick={handleCopyClick}
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
            {copied ? "Copied!" : "Help your AI fix this"}
          </button>
        </div>
      </div>
    </div>
  );
}
