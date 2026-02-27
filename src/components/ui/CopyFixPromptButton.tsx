"use client";

import { useState, useRef, useEffect } from "react";

const POPOVER_TEXT =
  "How to use this safely: 1) Open your AI tool in chat or conversation mode, 2) Paste the prompt, 3) Review suggestions before applying any changes, 4) Ask follow-up questions if anything is unclear. Tip: Avoid agent or auto-apply mode until you have reviewed the suggested changes.";

export function FixPromptDisclaimer() {
  return (
    <p style={{ margin: "0.5rem 0 0", fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
      Fix suggestions are for review purposes. Always verify changes before applying them to your codebase.
    </p>
  );
}

type Props = {
  fixPrompt: string;
  style?: React.CSSProperties;
  className?: string;
};

export default function CopyFixPromptButton({ fixPrompt, style, className }: Props) {
  const [showPopover, setShowPopover] = useState(false);
  const [copied, setCopied] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (copied) {
      const t = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(t);
    }
  }, [copied]);

  useEffect(() => {
    if (!showPopover) return;
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowPopover(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showPopover]);

  function handleButtonClick() {
    if (showPopover) return;
    setShowPopover(true);
  }

  function handleDismiss() {
    setShowPopover(false);
    try {
      navigator.clipboard.writeText(fixPrompt);
      setCopied(true);
    } catch {
      // ignore
    }
  }

  return (
    <div style={{ position: "relative", display: "inline-block" }} ref={popoverRef}>
      <button
        type="button"
        onClick={handleButtonClick}
        style={{
          padding: "0.5rem 0.75rem",
          fontSize: "0.875rem",
          fontWeight: 500,
          color: "var(--brand)",
          background: "transparent",
          border: "1px solid var(--brand)",
          borderRadius: "8px",
          cursor: "pointer",
          ...style,
        }}
        className={className}
      >
        {copied ? "Copied!" : "Help your AI fix this"}
      </button>
      {showPopover && (
        <div
          role="dialog"
          aria-label="How to use this safely"
          style={{
            position: "absolute",
            zIndex: 50,
            top: "100%",
            left: 0,
            marginTop: "0.5rem",
            width: "min(320px, 100vw - 2rem)",
            padding: "1rem",
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            fontSize: "0.8125rem",
            lineHeight: 1.5,
            color: "var(--text)",
          }}
        >
          <p style={{ margin: "0 0 0.75rem" }}>{POPOVER_TEXT}</p>
          <button
            type="button"
            onClick={handleDismiss}
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
    </div>
  );
}
