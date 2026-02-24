import { type CSSProperties, type ReactNode } from "react";

const maxWidth = "1160px";

export default function Container({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={className}
      style={{
        maxWidth,
        margin: "0 auto",
        paddingLeft: "1.5rem",
        paddingRight: "1.5rem",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
