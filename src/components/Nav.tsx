"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/trust", label: "Trust" },
] as const;

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data: { user: u } }) => {
        setUser(u ?? null);
        setLoading(false);
      });
    const { data: { subscription } } = createClient().auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  }

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
      <div className="nav-container">
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
            {!loading && (
              <>
                {user ? (
                  <>
                    <Link
                      href="/dashboard"
                      style={{
                        fontSize: "0.9375rem",
                        fontWeight: pathname?.startsWith("/dashboard") ? 600 : 500,
                        color: pathname?.startsWith("/dashboard") ? "var(--brand)" : "var(--text-muted)",
                        textDecoration: pathname?.startsWith("/dashboard") ? "underline" : "none",
                      }}
                    >
                      Dashboard
                    </Link>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      style={{
                        fontSize: "0.9375rem",
                        fontWeight: 500,
                        color: "var(--text-muted)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/auth"
                      style={{
                        fontSize: "0.9375rem",
                        fontWeight: 500,
                        color: "var(--text-muted)",
                        textDecoration: "none",
                      }}
                    >
                      Sign in
                    </Link>
                  </>
                )}
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
