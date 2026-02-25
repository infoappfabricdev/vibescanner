import { type ReactNode } from "react";

export default function Card({
  children,
  style = {},
  className,
}: {
  children: ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        padding: "2rem",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
