import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Container from "@/components/ui/Container";
import Card from "@/components/ui/Card";
import { ButtonPrimary, ButtonSecondary } from "@/components/ui/Button";
import DashboardClient from "@/app/dashboard/DashboardClient";
import TopIssuesSection from "./TopIssuesSection";
import { mapReportFindingsToNormalized, findingsRowsToStoredFindings, type StoredFinding, type FindingRow } from "./types";

type ScanRow = {
  id: string;
  created_at: string;
  project_name?: string | null;
  finding_count: number;
  critical_count?: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  findings?: unknown;
};

function getStatusFromScan(s: ScanRow): { variant: "danger" | "warn" | "success"; label: string } {
  const critical = s.critical_count ?? 0;
  if (critical > 0 || s.high_count > 0) return { variant: "danger", label: "\u26A0\uFE0F Fix before launch" };
  if (s.medium_count > 0) return { variant: "warn", label: "\u26A0\uFE0F Review recommended" };
  return { variant: "success", label: "\u2705 Looks safe" };
}

function securityScore(critical: number, high: number, medium: number, low: number): number {
  const c = critical ?? 0;
  const s = 100 - 40 * c - 25 * high - 10 * medium - 3 * low;
  return s < 0 ? 0 : s;
}

function scoreStatus(score: number): { text: string; variant: "success" | "warn" | "danger" } {
  if (score >= 80) return { text: "Safe to launch", variant: "success" };
  if (score >= 50) return { text: "Review recommended", variant: "warn" };
  return { text: "Fix before launch", variant: "danger" };
}

function StatusPill({
  variant,
  label,
}: {
  variant: "danger" | "warn" | "success";
  label: string;
}) {
  const bg =
    variant === "danger"
      ? "var(--danger)"
      : variant === "warn"
        ? "var(--warn)"
        : "var(--success)";
  return (
    <span
      style={{
        display: "inline-block",
        borderRadius: "9999px",
        fontSize: "0.75rem",
        fontWeight: 500,
        padding: "0.25rem 0.5rem",
        background: bg,
        color: "#fff",
      }}
    >
      {label}
    </span>
  );
}

const sectionHeading = {
  fontSize: "1.125rem",
  fontWeight: 600,
  marginBottom: "0.75rem",
  marginTop: 0,
  marginLeft: 0,
  marginRight: 0,
  color: "var(--text)",
} as const;

const sectionSpacing = { marginBottom: "3rem" };

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
    supabase
      .from("scans")
      .select("id, created_at, project_name, finding_count, critical_count, high_count, medium_count, low_count, findings")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const credits = creditsRow?.credits_remaining ?? 0;
  const scans = (scansRows ?? []) as ScanRow[];
  const lastScan = scans[0] ?? null;

  let lastScanFindings: StoredFinding[];
  let lastScanFindingIds: string[] | undefined;
  if (lastScan) {
    const { data: findingsRows } = await supabase
      .from("findings")
      .select("id, project_id, scan_id, rule_id, scanner, file_path, line, title, explanation, severity, status, false_positive_likelihood, false_positive_reason, first_seen_at, last_seen_at, resolved_at, summary_text, details_text, fix_prompt, why_it_matters, fix_suggestion")
      .eq("scan_id", lastScan.id)
      .order("first_seen_at", { ascending: true });
    if (findingsRows != null && findingsRows.length > 0) {
      lastScanFindings = findingsRowsToStoredFindings(findingsRows as FindingRow[]);
      lastScanFindingIds = (findingsRows as FindingRow[]).map((r) => r.id);
    } else {
      lastScanFindings = (lastScan.findings ?? []) as StoredFinding[];
    }
  } else {
    lastScanFindings = [];
  }

  const latestScanSummary =
    lastScan === null
      ? null
      : lastScan.finding_count > 0
        ? `Your app has ${lastScan.finding_count} issue${lastScan.finding_count !== 1 ? "s" : ""} that should be reviewed before launch.`
        : "No issues detected. Your app looks safe to launch.";

  const lastScanReportHref = lastScan ? "/dashboard/scans/" + lastScan.id : "";
  const buttonGroupStyle: React.CSSProperties = { display: "flex", gap: "0.75rem", flexWrap: "wrap" };
  const hasCredits = credits > 0;
  const scanOrPricingHref = hasCredits ? "/scan" : "/pricing";

  const score =
    lastScan === null
      ? 100
      : securityScore(lastScan.critical_count ?? 0, lastScan.high_count, lastScan.medium_count, lastScan.low_count);
  const scoreStatusResult = scoreStatus(score);
  const normalizedFindings =
    lastScan && lastScanReportHref
      ? mapReportFindingsToNormalized(lastScan.id, lastScanReportHref, lastScanFindings, lastScanFindingIds)
      : [];

  const banner = (() => {
    if (!lastScan) {
      return {
        variant: "neutral" as const,
        message: "Run your first scan to check if your app is safe to launch.",
        cta: "Run a scan",
        href: scanOrPricingHref,
      };
    }
    const critical = lastScan.critical_count ?? 0;
    if (critical > 0 || lastScan.high_count > 0) {
      return {
        variant: "danger" as const,
        message: critical > 0 ? "Secrets or critical issues detected. Fix these before launching." : "High-risk issues detected. Fix these before launching.",
        cta: "View report",
        href: `/dashboard/scans/${lastScan.id}`,
      };
    }
    if (lastScan.medium_count > 0) {
      return {
        variant: "warn" as const,
        message: "Review recommended. Some issues could affect your app.",
        cta: "View report",
        href: `/dashboard/scans/${lastScan.id}`,
      };
    }
    return {
      variant: "success" as const,
      message: "Your app looks good. No major risks detected.",
      cta: null as string | null,
      href: "",
    };
  })();

  return (
    <main style={{ padding: "4rem 0" }}>
      <Container>
          {/* Page header */}
          <header style={{ ...sectionSpacing }}>
            <h1
              style={{
                margin: "0 0 0.5rem",
                fontSize: "2rem",
                fontWeight: 600,
                color: "var(--text)",
              }}
            >
              Security dashboard
            </h1>
            <p
              style={{
                color: "var(--text-muted)",
                margin: 0,
                fontSize: "0.9375rem",
              }}
            >
              Your scans, findings, and credits in one place.
            </p>
          </header>

          {/* Recommended action banner */}
          <div
            style={
              {
                marginBottom: "2.5rem",
                padding: "1rem 1.25rem",
                borderRadius: "8px",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.75rem",
                background:
                  banner.variant === "danger"
                    ? "rgba(220, 38, 38, 0.1)"
                    : banner.variant === "warn"
                      ? "rgba(245, 158, 11, 0.12)"
                      : banner.variant === "success"
                        ? "rgba(22, 163, 74, 0.1)"
                        : "var(--border)",
                border:
                  "1px solid " +
                  (banner.variant === "danger"
                    ? "var(--danger)"
                    : banner.variant === "warn"
                      ? "var(--warn)"
                      : banner.variant === "success"
                        ? "var(--success)"
                        : "var(--border)"),
              } satisfies React.CSSProperties
            }
          >
            <span
              style={{
                fontSize: "0.9375rem",
                fontWeight: 500,
                color:
                  banner.variant === "danger"
                    ? "var(--danger)"
                    : banner.variant === "warn"
                      ? "#b45309"
                      : banner.variant === "success"
                        ? "var(--success)"
                        : "var(--text)",
              }}
            >
              {banner.variant === "danger" && "\u26A0\uFE0F "}
              {banner.message}
            </span>
            {banner.cta && banner.href && (
              <ButtonPrimary href={banner.href}>{banner.cta}</ButtonPrimary>
            )}
          </div>

          {/* Security score */}
          <section style={sectionSpacing}>
            <h2 style={sectionHeading}>Security score</h2>
            <Card style={{ padding: "1.5rem" }} className="dashboard-card-hover">
              <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" } satisfies React.CSSProperties}>
                <div
                  style={{
                    fontSize: "2.5rem",
                    fontWeight: 700,
                    color: "var(--text)",
                    lineHeight: 1,
                  }}
                >
                  {score}/100
                </div>
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "1rem",
                      fontWeight: 600,
                      color:
                        scoreStatusResult.variant === "success"
                          ? "var(--success)"
                          : scoreStatusResult.variant === "warn"
                            ? "var(--warn)"
                            : "var(--danger)",
                    }}
                  >
                    {scoreStatusResult.text}
                  </p>
                  <div
                    style={{
                      marginTop: "0.5rem",
                      width: "8rem",
                      height: "0.5rem",
                      background: "var(--border)",
                      borderRadius: "9999px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: score + "%",
                        height: "100%",
                        background:
                          scoreStatusResult.variant === "success"
                            ? "var(--success)"
                            : scoreStatusResult.variant === "warn"
                              ? "var(--warn)"
                              : "var(--danger)",
                        borderRadius: "9999px",
                      }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </section>

          {/* Summary stat row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "1rem",
              ...sectionSpacing,
            }}
          >
            <Card style={{ padding: "1.25rem" }} className="dashboard-card-hover">
              <p style={{ margin: "0 0 0.25rem", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                Total scans
              </p>
              <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 600, color: "var(--text)" }}>
                {scans.length}
              </p>
              <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                All time
              </p>
            </Card>
            <Card style={{ padding: "1.25rem" }} className="dashboard-card-hover">
              <p style={{ margin: "0 0 0.25rem", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                Findings in last scan
              </p>
              <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 600, color: "var(--text)" }}>
                {lastScan ? lastScan.finding_count : "—"}
              </p>
            </Card>
            <Card style={{ padding: "1.25rem" }} className="dashboard-card-hover">
              <p style={{ margin: "0 0 0.25rem", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                Credits remaining
              </p>
              <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 600, color: "var(--text)" }}>
                {credits}
              </p>
              <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Scans available
              </p>
            </Card>
          </div>

          {/* Latest scan card */}
          <section style={sectionSpacing}>
            <Card style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }} className="dashboard-card-hover">
              <h2 style={sectionHeading}>Latest scan</h2>
              {lastScan ? (
                <div
                  style={
                    {
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "1rem",
                    } satisfies React.CSSProperties
                  }
                >
                  <div>
                    <p style={{ margin: "0 0 0.25rem", color: "var(--text)", fontWeight: 500 }}>
                      {(lastScan.project_name && lastScan.project_name.trim())
                        ? `${lastScan.project_name.trim()} — ${new Date(lastScan.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })} at ${new Date(lastScan.created_at).toLocaleTimeString(undefined, { timeStyle: "short" })}`
                        : new Date(lastScan.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                    <p style={{ margin: "0 0 0.25rem", fontSize: "0.875rem", color: "var(--text-muted)" }}>
                      {lastScan.finding_count} finding{lastScan.finding_count !== 1 ? "s" : ""}
                    </p>
                    <p style={{ margin: "0 0 0.5rem", fontSize: "0.875rem", color: "var(--text-muted)" }}>
                      {latestScanSummary}
                    </p>
                    <StatusPill {...getStatusFromScan(lastScan)} />
                  </div>
                  <div style={buttonGroupStyle}>
                    <ButtonPrimary href={lastScanReportHref}>
                      View full report
                    </ButtonPrimary>
                    <ButtonSecondary
                      href={scanOrPricingHref}
                    >
                      Scan again
                    </ButtonSecondary>
                  </div>
                </div>
              ) : (
                <div>
                  <p
                    style={{
                      margin: "0 0 1rem",
                      color: "var(--text-muted)",
                      fontSize: "0.9375rem",
                      lineHeight: 1.5,
                    }}
                  >
                    No scans yet. Upload your app to get your first security report in minutes.
                  </p>
                  <ButtonPrimary href={scanOrPricingHref}>
                    Run your first scan
                  </ButtonPrimary>
                </div>
              )}
            </Card>
          </section>

          {/* Top issues to fix */}
          <section style={sectionSpacing}>
            <h2 style={sectionHeading}>Top issues to fix</h2>
            {!lastScan ? (
              <Card style={{ padding: "1.5rem", textAlign: "center", maxWidth: "28rem", margin: "0 auto" }} className="dashboard-card-hover">
                <p style={{ margin: "0 0 0.25rem", color: "var(--text)", fontWeight: 600, fontSize: "1rem" }}>
                  No scans yet
                </p>
                <p style={{ margin: "0 0 1rem", color: "var(--text-muted)", fontSize: "0.9375rem" }}>
                  Upload your app and get your first security report in minutes.
                </p>
                <ButtonPrimary href={scanOrPricingHref}>
                  Run your first scan
                </ButtonPrimary>
              </Card>
            ) : lastScan.finding_count === 0 ? (
              <Card style={{ padding: "1.25rem" }} className="dashboard-card-hover">
                <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.9375rem" }}>
                  No issues detected. Your app looks safe to launch.
                </p>
              </Card>
            ) : normalizedFindings.length > 0 ? (
              <TopIssuesSection findings={normalizedFindings} />
            ) : (
              <Card style={{ padding: "1.25rem" }} className="dashboard-card-hover">
                <p style={{ margin: "0 0 1rem", color: "var(--text-muted)", fontSize: "0.9375rem" }}>
                  {lastScan.finding_count} issue{lastScan.finding_count !== 1 ? "s" : ""} found. View report to see details.
                </p>
                <ButtonPrimary href={lastScanReportHref}>
                  View report
                </ButtonPrimary>
              </Card>
            )}
          </section>

          {/* Past scans table-like list */}
          <section style={sectionSpacing}>
            <h2 style={sectionHeading}>Past scans</h2>
            {scans.length === 0 ? (
              <Card style={{ padding: "1.5rem", textAlign: "center", maxWidth: "28rem", margin: "0 auto" }} className="dashboard-card-hover">
                <p style={{ margin: "0 0 0.25rem", color: "var(--text)", fontWeight: 600, fontSize: "1rem" }}>
                  No scans yet
                </p>
                <p style={{ margin: "0 0 1rem", color: "var(--text-muted)", fontSize: "0.9375rem" }}>
                  Upload your app and get your first security report in minutes.
                </p>
                <ButtonPrimary href={scanOrPricingHref}>
                  Run your first scan
                </ButtonPrimary>
              </Card>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0, border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden" }}>
                {scans.map((s) => {
                  const status = getStatusFromScan(s);
                  const isNotLast = scans.indexOf(s) < scans.length - 1;
                  const criticalCount = s.critical_count ?? 0;
                  const hasCritical = criticalCount > 0;
                  const hasHigh = s.high_count > 0;
                  const hasMedium = s.medium_count > 0;
                  const hasLow = s.low_count > 0;
                  const criticalLabel = "C" + (criticalCount > 1 ? " " + criticalCount : "");
                  const highLabel = "H" + (s.high_count > 1 ? " " + s.high_count : "");
                  const mediumLabel = "M" + (s.medium_count > 1 ? " " + s.medium_count : "");
                  const lowLabel = "L" + (s.low_count > 1 ? " " + s.low_count : "");
                  const noSeverity = !hasCritical && !hasHigh && !hasMedium && !hasLow;
                  const findingLabel =
                    s.finding_count + " finding" + (s.finding_count !== 1 ? "s" : "");
                  return (
                    <li
                      key={s.id}
                      style={{
                        borderBottom: isNotLast ? "1px solid var(--border)" : "none",
                      }}
                    >
                      <Link
                        href={"/dashboard/scans/" + s.id}
                        className="dashboard-scan-row"
                        style={
                          {
                            display: "flex",
                            flexWrap: "wrap",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "0.75rem",
                            padding: "1rem 1.25rem",
                            background: "var(--card)",
                            textDecoration: "none",
                            color: "var(--text)",
                          } satisfies React.CSSProperties
                        }
                      >
                        <span style={{ fontWeight: 500, fontSize: "0.9375rem" }}>
                          {(s.project_name && s.project_name.trim())
                            ? `${s.project_name.trim()} — ${new Date(s.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })} at ${new Date(s.created_at).toLocaleTimeString(undefined, { timeStyle: "short" })}`
                            : new Date(s.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                        </span>
                        <span style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" } satisfies React.CSSProperties}>
                          {hasCritical && (
                            <span
                              style={{
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                padding: "0.2rem 0.4rem",
                                borderRadius: "4px",
                                background: "#b91c1c",
                                color: "#fff",
                              }}
                            >
                              {criticalLabel}
                            </span>
                          )}
                          {hasHigh && (
                            <span
                              style={{
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                padding: "0.2rem 0.4rem",
                                borderRadius: "4px",
                                background: "var(--danger)",
                                color: "#fff",
                              }}
                            >
                              {highLabel}
                            </span>
                          )}
                          {hasMedium && (
                            <span
                              style={{
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                padding: "0.2rem 0.4rem",
                                borderRadius: "4px",
                                background: "var(--warn)",
                                color: "#fff",
                              }}
                            >
                              {mediumLabel}
                            </span>
                          )}
                          {hasLow && (
                            <span
                              style={{
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                padding: "0.2rem 0.4rem",
                                borderRadius: "4px",
                                background: "var(--success)",
                                color: "#fff",
                              }}
                            >
                              {lowLabel}
                            </span>
                          )}
                          {noSeverity && (
                            <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                              {findingLabel}
                            </span>
                          )}
                        </span>
                        <StatusPill {...status} />
                        <span
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: 500,
                            color: "var(--brand)",
                          }}
                        >
                          View report
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Credits card (de-emphasized, below scan history) */}
          <section style={sectionSpacing}>
            <Card style={{ padding: "1.25rem" }} className="dashboard-card-hover">
              <h2 style={sectionHeading}>Credits</h2>
              <p style={{ margin: "0 0 1rem", color: "var(--text-muted)", fontSize: "0.9375rem" }}>
                You have <strong style={{ color: "var(--text)" }}>{credits}</strong>{" "}
                {credits === 1 ? "scan" : "scans"} remaining.
              </p>
              <ButtonPrimary href="/checkout">Buy another scan — $9</ButtonPrimary>
            </Card>
          </section>

          <DashboardClient />
      </Container>
    </main>
  );
}
