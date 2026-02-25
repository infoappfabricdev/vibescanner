"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Container from "@/components/ui/Container";
import Card from "@/components/ui/Card";

const baseUrl =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [magicLinkEmail, setMagicLinkEmail] = useState("");
  const [passwordEmail, setPasswordEmail] = useState("");
  const [password, setPassword] = useState("");
  const [magicSent, setMagicSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const supabase = createClient();

  async function handleOAuth(provider: "google" | "github") {
    setError(null);
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${baseUrl}/auth/callback` },
    });
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!magicLinkEmail.trim()) {
      setError("Enter your email.");
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithOtp({
      email: magicLinkEmail.trim(),
      options: { emailRedirectTo: `${baseUrl}/auth/callback` },
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setMagicSent(true);
    setMessage("Check your email for the sign-in link.");
  }

  async function handleEmailPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!passwordEmail.trim() || !password) {
      setError("Enter email and password.");
      return;
    }
    setLoading(true);
    if (mode === "signup") {
      const { error: err } = await supabase.auth.signUp({
        email: passwordEmail.trim(),
        password,
        options: { emailRedirectTo: `${baseUrl}/auth/callback` },
      });
      setLoading(false);
      if (err) {
        setError(err.message);
        return;
      }
      setMessage("Account created. You can sign in now.");
      return;
    }
    const { error: err } = await supabase.auth.signInWithPassword({
      email: passwordEmail.trim(),
      password,
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main style={{ padding: "4rem 1.5rem" }}>
      <Container style={{ maxWidth: "420px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600, margin: "0 0 0.5rem", color: "var(--text)" }}>
          Sign in
        </h1>
        <p style={{ color: "var(--text-muted)", margin: "0 0 1.5rem", fontSize: "0.9375rem" }}>
          Use one of the options below to access your dashboard and run scans.
        </p>

        <Card style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <button
              type="button"
              onClick={() => handleOAuth("google")}
              disabled={loading}
              style={{
                padding: "0.75rem 1rem",
                fontSize: "0.9375rem",
                fontWeight: 500,
                border: "1px solid var(--border)",
                borderRadius: "8px",
                background: "#fff",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
              }}
            >
              Continue with Google
            </button>
            <button
              type="button"
              onClick={() => handleOAuth("github")}
              disabled={loading}
              style={{
                padding: "0.75rem 1rem",
                fontSize: "0.9375rem",
                fontWeight: 500,
                border: "1px solid var(--border)",
                borderRadius: "8px",
                background: "#fff",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
              }}
            >
              Continue with GitHub
            </button>
          </div>
        </Card>

        <Card style={{ marginBottom: "1.5rem" }}>
          <p style={{ margin: "0 0 0.75rem", fontSize: "0.875rem", fontWeight: 500, color: "var(--text)" }}>
            Magic link (no password)
          </p>
          {magicSent ? (
            <p style={{ fontSize: "0.9375rem", color: "var(--success)" }}>{message}</p>
          ) : (
            <form onSubmit={handleMagicLink} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <input
                type="email"
                placeholder="you@example.com"
                value={magicLinkEmail}
                onChange={(e) => setMagicLinkEmail(e.target.value)}
                style={{
                  padding: "0.5rem 0.75rem",
                  fontSize: "1rem",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                }}
              />
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: "0.5rem 1rem",
                  fontSize: "0.9375rem",
                  fontWeight: 600,
                  color: "white",
                  background: "#2563EB",
                  border: "none",
                  borderRadius: "6px",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                Send magic link
              </button>
            </form>
          )}
        </Card>

        <Card style={{ marginBottom: "1.5rem" }}>
          <p style={{ margin: "0 0 0.75rem", fontSize: "0.875rem", fontWeight: 500, color: "var(--text)" }}>
            Email and password
          </p>
          <form onSubmit={handleEmailPassword} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <input
              type="email"
              placeholder="you@example.com"
              value={passwordEmail}
              onChange={(e) => setPasswordEmail(e.target.value)}
              style={{
                padding: "0.5rem 0.75rem",
                fontSize: "1rem",
                border: "1px solid var(--border)",
                borderRadius: "6px",
              }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                padding: "0.5rem 0.75rem",
                fontSize: "1rem",
                border: "1px solid var(--border)",
                borderRadius: "6px",
              }}
            />
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: "0.5rem 1rem",
                  fontSize: "0.9375rem",
                  fontWeight: 600,
                  color: "white",
                  background: "#2563EB",
                  border: "none",
                  borderRadius: "6px",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {mode === "signin" ? "Sign in" : "Sign up"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode((m) => (m === "signin" ? "signup" : "signin"));
                  setError(null);
                }}
                style={{
                  padding: "0.5rem 0.75rem",
                  fontSize: "0.875rem",
                  color: "var(--brand)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {mode === "signin" ? "Create account" : "Already have an account?"}
              </button>
            </div>
          </form>
        </Card>

        {error && (
          <p style={{ color: "var(--danger)", marginBottom: "1rem", fontSize: "0.875rem" }}>{error}</p>
        )}
        {message && !magicSent && (
          <p style={{ color: "var(--success)", marginBottom: "1rem", fontSize: "0.875rem" }}>{message}</p>
        )}

        <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
          <Link href="/" style={{ color: "var(--brand)", textDecoration: "none" }}>
            Back to home
          </Link>
        </p>
      </Container>
    </main>
  );
}
