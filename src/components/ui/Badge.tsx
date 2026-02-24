import { type ReactNode } from "react";

const tokens: Record<string, { bg: string; color: string }> = {
  success: { bg: "var(--success)", color: "#fff" },
  warn: { bg: "var(--warn)", color: "#fff" },
  danger: { bg: "var(--danger)", color: "#fff" },
  info: { bg: "var(--brand)", color: "#fff" },
};

export default function Badge({
  children,
  variant = "info",
}: {
  children: ReactNode;
  variant?: keyof typeof tokens;
}) {
  const { bg, color } = tokens[variant] ?? tokens.info;
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: "0.75rem",
        fontWeight: 600,
        textTransform: "uppercase",
        padding: "0.2rem 0.5rem",
        borderRadius: "4px",
        background: bg,
        color,
      }}
    >
      {children}
    </span>
  );
}
