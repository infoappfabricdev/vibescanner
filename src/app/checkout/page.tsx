"use client";

import { useState } from "react";
import Link from "next/link";
import Container from "@/components/ui/Container";

export default function CheckoutPage() {
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [goingToStripe, setGoingToStripe] = useState(false);

  async function handleApplyCoupon(e: React.FormEvent) {
    e.preventDefault();
    setCouponError(null);
    const code = couponCode.trim();
    if (!code) return;
    try {
      const res = await fetch("/api/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = (await res.json()) as { valid?: boolean; token?: string };
      if (data.valid && data.token) {
        window.location.href = `/scan?coupon_token=${encodeURIComponent(data.token)}`;
        return;
      }
      setCouponError("Invalid code.");
    } catch {
      setCouponError("Something went wrong.");
    }
  }

  async function handleContinueToPayment() {
    setCheckoutError(null);
    setGoingToStripe(true);
    try {
      const res = await fetch("/api/create-checkout-session", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) {
        setCheckoutError(data.error || "Something went wrong.");
        setGoingToStripe(false);
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setCheckoutError("Could not start checkout.");
    } catch {
      setCheckoutError("Something went wrong.");
    }
    setGoingToStripe(false);
  }

  return (
    <main style={{ padding: "4rem 1.5rem" }}>
      <Container style={{ maxWidth: "480px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600, margin: "0 0 0.5rem", color: "var(--text)" }}>
          Checkout
        </h1>
        <p style={{ color: "var(--text-muted)", margin: "0 0 1.5rem", fontSize: "0.9375rem" }}>
          Run a one-time Vibe Scan for $9, or enter a coupon code for a free scan.
        </p>

        <form
          onSubmit={handleApplyCoupon}
          style={{
            display: "flex",
            gap: "0.5rem",
            marginBottom: "1.5rem",
            flexWrap: "wrap",
          }}
        >
          <input
            type="text"
            placeholder="Coupon code"
            value={couponCode}
            onChange={(e) => {
              setCouponCode(e.target.value);
              setCouponError(null);
            }}
            style={{
              padding: "0.5rem 0.75rem",
              fontSize: "1rem",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              minWidth: "140px",
            }}
          />
          <button
            type="submit"
            className="btn-primary"
            style={{
              padding: "0.5rem 1rem",
              fontSize: "0.9375rem",
              fontWeight: 600,
              color: "white",
              background: "#2563EB",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Apply
          </button>
        </form>
        {couponError && (
          <p style={{ color: "var(--danger)", marginTop: "-0.75rem", marginBottom: "1rem", fontSize: "0.875rem" }}>
            {couponError}
          </p>
        )}

        <p style={{ color: "var(--text-muted)", marginBottom: "0.75rem", fontSize: "0.875rem" }}>
          Or pay with card:
        </p>
        <button
          type="button"
          className="btn-primary"
          onClick={handleContinueToPayment}
          disabled={goingToStripe}
          style={{
            display: "block",
            padding: "0.75rem 1.5rem",
            fontSize: "1rem",
            fontWeight: 600,
            color: "white",
            background: "#2563EB",
            border: "none",
            borderRadius: "8px",
            cursor: goingToStripe ? "not-allowed" : "pointer",
          }}
        >
          {goingToStripe ? "Taking you to checkout…" : "Continue to payment — $9"}
        </button>
        {checkoutError && (
          <p style={{ color: "var(--danger)", marginTop: "0.75rem", fontSize: "0.875rem" }}>
            {checkoutError}
          </p>
        )}

        <p style={{ marginTop: "1.5rem", fontSize: "0.875rem" }}>
          <Link href="/pricing" style={{ color: "var(--brand)", textDecoration: "none" }}>
            Back to pricing
          </Link>
        </p>
      </Container>
    </main>
  );
}
