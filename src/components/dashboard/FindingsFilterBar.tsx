"use client";

type Severity = "critical" | "high" | "medium" | "low";
export type StatusFilter = "open" | "fixed" | "ignored" | "false_positive" | "all";

type Props = {
  statusFilter: StatusFilter;
  onStatusFilterChange: (s: StatusFilter) => void;
  severityFilter: Set<Severity>;
  onSeverityToggle: (s: Severity) => void;
  quickFixOnly: boolean;
  onQuickFixOnlyChange: (v: boolean) => void;
  searchQuery: string;
  onSearchChange: (v: string) => void;
  showingCount: number;
  totalCount: number;
};

const SEVERITIES: Severity[] = ["critical", "high", "medium", "low"];
const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "fixed", label: "Fixed" },
  { value: "ignored", label: "Ignored" },
  { value: "false_positive", label: "False positive" },
  { value: "all", label: "All" },
];

export default function FindingsFilterBar({
  statusFilter,
  onStatusFilterChange,
  severityFilter,
  onSeverityToggle,
  quickFixOnly,
  onQuickFixOnlyChange,
  searchQuery,
  onSearchChange,
  showingCount,
  totalCount,
}: Props) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "1rem",
        marginBottom: "1rem",
        padding: "0.75rem 0",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onStatusFilterChange(opt.value)}
            style={{
              padding: "0.35rem 0.75rem",
              fontSize: "0.8125rem",
              fontWeight: 500,
              borderRadius: "9999px",
              border: "1px solid var(--border)",
              background: statusFilter === opt.value ? "var(--text-muted)" : "var(--card)",
              color: statusFilter === opt.value ? "#fff" : "var(--text-muted)",
              cursor: "pointer",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
        {SEVERITIES.map((s) => {
          const on = severityFilter.has(s);
          return (
            <button
              key={s}
              type="button"
              onClick={() => onSeverityToggle(s)}
              style={{
                padding: "0.35rem 0.75rem",
                fontSize: "0.8125rem",
                fontWeight: 500,
                borderRadius: "9999px",
                border: "1px solid var(--border)",
                background: on ? (s === "critical" ? "#b91c1c" : s === "high" ? "var(--danger)" : s === "medium" ? "var(--warn)" : "#6b7280") : "var(--card)",
                color: on ? "#fff" : "var(--text-muted)",
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {s}
            </button>
          );
        })}
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "var(--text-muted)" }}>
        <input
          type="checkbox"
          checked={quickFixOnly}
          onChange={(e) => onQuickFixOnlyChange(e.target.checked)}
          style={{ width: "1rem", height: "1rem" }}
        />
        Quick fix available
      </label>
      <input
        type="search"
        placeholder="Search by file, rule, or text..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        style={{
          flex: "1 1 12rem",
          minWidth: "12rem",
          padding: "0.5rem 0.75rem",
          fontSize: "0.875rem",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          color: "var(--text)",
          background: "var(--card)",
        }}
      />
      <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
        Showing {showingCount} of {totalCount} findings
      </span>
    </div>
  );
}
