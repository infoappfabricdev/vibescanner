import Link from "next/link";
import { type ReactNode } from "react";

const base = {
  display: "inline-block",
  padding: "0.75rem 1.5rem",
  fontSize: "0.9375rem",
  fontWeight: 500,
  borderRadius: "8px",
  textDecoration: "none",
  border: "none",
  cursor: "pointer",
  transition: "background 0.15s, color 0.15s, border-color 0.15s, box-shadow 0.15s",
} as const;

export function ButtonPrimary({
  children,
  href,
  onClick,
  disabled,
  type = "button",
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const style = {
    ...base,
    color: "#fff",
    background: "#2563EB",
    boxShadow: "0 1px 2px rgba(37, 99, 235, 0.2)",
  };
  if (href) {
    return (
      <Link href={href} className="btn-primary" style={{ ...style, opacity: disabled ? 0.6 : 1 }} aria-disabled={disabled}>
        {children}
      </Link>
    );
  }
  return (
    <button
      type={type}
      className="btn-primary"
      onClick={onClick}
      disabled={disabled}
      style={{
        ...style,
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

export function ButtonSecondary({
  children,
  href,
}: {
  children: ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="btn-secondary"
      style={{
        ...base,
        color: "#374151",
        background: "#ffffff",
        border: "1px solid #d1d5db",
      }}
    >
      {children}
    </Link>
  );
}
