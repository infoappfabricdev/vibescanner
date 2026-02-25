import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Container from "@/components/ui/Container";
import Card from "@/components/ui/Card";
import { ButtonPrimary } from "@/components/ui/Button";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/auth?next=/dashboard");
  }

  const [{ data: creditsRow }, { data: scansRows }] = await Promise.all([
    supabase.from("scan_credits").select("credits_remaining").eq("user_id", user.id).maybeSingle(),
    supabase.from("scans").select("id, created_at, finding_count, high_count, medium_count, low_count").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
  ]);

  const credits = creditsRow?.credits_remaining ?? 0;
  const scans = scansRows ?? [];

  return (
    <main style={{ padding: "4rem 1.5rem" }}>
      <Container>
        <h1 style={{ margin: "0 0 0.5rem", color: "var(--text)" }}>Dashboard</h1>
        <p style={{ color: "var(--text-muted)", margin: "0 0 1.5rem", fontSize: "0.9375rem" }}>
          Your scan credits and past reports.
        </p>

        <Card style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 600, margin: "0 0 0.5rem", color: "var(--text)" }}>
            Credits
          </h2>
          <p style={{ margin: "0 0 1rem", color: "var(--text-muted)", fontSize: "0.9375rem" }}>
            You have <strong style={{ color: "var(--text)" }}>{credits}</strong>{" "}
            {credits === 1 ? "scan" : "scans"} remaining.
          </p>
          <ButtonPrimary href="/checkout">Buy another scan — $9</ButtonPrimary>
        </Card>

        <h2 style={{ fontSize: "1.125rem", fontWeight: 600, margin: "0 0 0.75rem", color: "var(--text)" }}>
          Past scans
        </h2>
        {scans.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "0.9375rem" }}>
            No scans yet. Run a scan from the scan page.
          </p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {scans.map((s) => (
              <li key={s.id} style={{ marginBottom: "0.75rem" }}>
                <Link
                  href={`/dashboard/scans/${s.id}`}
                  style={{
                    display: "block",
                    padding: "1rem 1.25rem",
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    textDecoration: "none",
                    color: "var(--text)",
                  }}
                >
                  <span style={{ fontWeight: 500 }}>
                    {new Date(s.created_at).toLocaleDateString(undefined, {
                      dateStyle: "medium",
                    })}{" "}
                    at {new Date(s.created_at).toLocaleTimeString(undefined, { timeStyle: "short" })}
                  </span>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginLeft: "0.5rem" }}>
                    — {s.finding_count} finding{s.finding_count !== 1 ? "s" : ""}
                    {[s.high_count, s.medium_count, s.low_count].some((n) => n > 0) && (
                      <> (H: {s.high_count} M: {s.medium_count} L: {s.low_count})</>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <p style={{ marginTop: "1.5rem", fontSize: "0.875rem" }}>
          <ButtonPrimary href={credits > 0 ? "/scan" : "/pricing"}>
            {credits > 0 ? "Run a Vibe Scan" : "Get credits to scan"}
          </ButtonPrimary>
        </p>

        <DashboardClient />
      </Container>
    </main>
  );
}
