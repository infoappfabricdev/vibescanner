"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Container from "@/components/ui/Container";
import { ButtonPrimary } from "@/components/ui/Button";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/trust", label: "Trust" },
] as const;

export default function Nav() {
  const pathname = usePathname();

  return (
    <header
      style={{
        background: "#ffffff",
        borderBottom: "1px solid #E2E8F0",
        padding: "1rem 0",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <Container>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <Link
            href="/"
            aria-label="VibeScan home"
            style={{
              display: "flex",
              alignItems: "center",
              textDecoration: "none",
              color: "var(--brand)",
              fontWeight: 600,
            }}
          >
            <img
              src="/brand/vibescan-logo.svg"
              alt="VibeScan"
              className="nav-logo-desktop"
              style={{ height: "2.5rem", width: "auto", display: "block" }}
              width={140}
              height={32}
            />
            <img
              src="/brand/vibescan-mark.svg"
              alt="VibeScan"
              className="nav-logo-mobile"
              style={{ height: "2rem", width: "auto", display: "none" }}
              width={32}
              height={32}
            />
          </Link>
          <nav style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
            {navLinks.map(({ href, label }) => {
              const isActive = pathname === href || (href !== "/" && pathname?.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  style={{
                    fontSize: "0.9375rem",
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? "var(--brand)" : "var(--text-muted)",
                    textDecoration: isActive ? "underline" : "none",
                  }}
                >
                  {label}
                </Link>
              );
            })}
            <span style={{ marginLeft: "0.5rem" }}>
              <ButtonPrimary href="/checkout">Run a Vibe Scan</ButtonPrimary>
            </span>
          </nav>
        </div>
      </Container>
    </header>
  );
}
