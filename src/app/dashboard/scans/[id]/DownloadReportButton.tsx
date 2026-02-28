"use client";

import { useState } from "react";

export default function DownloadReportButton({ scanId }: { scanId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const res = await fetch(`/api/scan-report-pdf/${scanId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to generate PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vibescan-report-${scanId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      style={{
        fontSize: "0.875rem",
        fontWeight: 500,
        color: "var(--brand)",
        background: "none",
        border: "none",
        cursor: loading ? "not-allowed" : "pointer",
        padding: "0.25rem 0",
      }}
    >
      {loading ? "Generating…" : "Download Report"}
    </button>
  );
}
