"use client";

export default function PrintReportButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print"
      style={{
        fontSize: "0.875rem",
        fontWeight: 500,
        padding: "0.5rem 0.75rem",
        color: "var(--brand)",
        background: "transparent",
        border: "1px solid var(--brand)",
        borderRadius: "8px",
        cursor: "pointer",
      }}
    >
      Print Report
    </button>
  );
}
