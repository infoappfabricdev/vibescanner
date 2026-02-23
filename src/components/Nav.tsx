"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/trust", label: "Trust" },
  { href: "/pricing", label: "Pricing" },
] as const;

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        background: "#fff",
        borderBottom: "1px solid #e2e8f0",
        padding: "0.75rem 1.5rem",
      }}
    >
      <div
        style={{
          maxWidth: "720px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <Link
          href="/"
          style={{
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "#0f766e",
            textDecoration: "none",
          }}
        >
          VibeScan
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          {navLinks.map(({ href, label }) => {
            const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                style={{
                  fontSize: "0.9375rem",
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "#0f766e" : "#475569",
                  textDecoration: "none",
                }}
              >
                {label}
              </Link>
            );
          })}
          <Link
            href="/scan"
            style={{
              display: "inline-block",
              padding: "0.5rem 1rem",
              fontSize: "0.9375rem",
              fontWeight: 600,
              color: "white",
              background: "#0f766e",
              borderRadius: "6px",
              textDecoration: "none",
            }}
          >
            Run a Vibe Scan
          </Link>
        </div>
      </div>
    </nav>
  );
}
