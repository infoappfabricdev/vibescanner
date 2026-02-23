"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function CheckoutPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function goToCheckout() {
      try {
        const res = await fetch("/api/create-checkout-session", { method: "POST" });
        const data = (await res.json()) as { url?: string; error?: string };
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error || "Something went wrong.");
          return;
        }
        if (data.url) {
          window.location.href = data.url;
          return;
        }
        setError("Could not start checkout.");
      } catch (e) {
        if (!cancelled) setError("Something went wrong.");
      }
    }

    goToCheckout();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <main
        style={{
          padding: "3rem 1.5rem",
          maxWidth: "720px",
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <p style={{ color: "#c53030", marginBottom: "1rem" }}>{error}</p>
        <Link
          href="/pricing"
          style={{
            color: "#0f766e",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Back to pricing
        </Link>
      </main>
    );
  }

  return (
    <main
      style={{
        padding: "3rem 1.5rem",
        maxWidth: "720px",
        margin: "0 auto",
        textAlign: "center",
      }}
    >
      <p style={{ color: "#64748b" }}>Taking you to checkout…</p>
    </main>
  );
}
