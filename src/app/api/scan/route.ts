import { NextRequest, NextResponse } from "next/server";
import AdmZip from "adm-zip";
import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildReport, type ReportFinding } from "@/lib/semgrep-report";
import { enrichFindingsOnce, type StoredFinding } from "@/lib/enrich-findings-once";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * Get project id for the user: by project_id (if valid and owned) or by get-or-create using project name.
 */
async function getOrCreateProjectId(
  admin: SupabaseClient,
  userId: string,
  projectIdFromForm: string | null,
  projectName: string
): Promise<string> {
  const trimmedId = typeof projectIdFromForm === "string" ? projectIdFromForm.trim() : "";
  if (trimmedId) {
    const { data: project } = await admin
      .from("projects")
      .select("id")
      .eq("id", trimmedId)
      .eq("user_id", userId)
      .maybeSingle();
    if (project?.id) return project.id;
  }
  const name = projectName.trim() || "Unnamed project";
  const { data: existing } = await admin
    .from("projects")
    .select("id")
    .eq("user_id", userId)
    .eq("name", name)
    .maybeSingle();
  if (existing?.id) return existing.id;
  const { data: inserted } = await admin
    .from("projects")
    .insert({ user_id: userId, name })
    .select("id")
    .single();
  if (!inserted?.id) throw new Error("Failed to create project");
  return inserted.id;
}

function countSeverities(findings: ReportFinding[]) {
  let critical = 0;
  let high = 0;
  let medium = 0;
  let low = 0;
  for (const f of findings) {
    if (f.severity === "critical") critical++;
    else if (f.severity === "high") high++;
    else if (f.severity === "medium") medium++;
    else low++;
  }
  return { critical, high, medium, low };
}

const now = () => new Date().toISOString();

/**
 * Insert enriched findings into the findings table (project_id, scan_id, core + Option A enrichment columns).
 */
async function insertFindingsRows(
  admin: SupabaseClient,
  projectId: string,
  scanId: string,
  findings: StoredFinding[]
): Promise<void> {
  if (findings.length === 0) return;
  const rows = findings.map((f) => ({
    project_id: projectId,
    scan_id: scanId,
    rule_id: f.checkId ?? null,
    scanner: f.scanner ?? "semgrep",
    file_path: f.file ?? "",
    line: f.line ?? null,
    title: f.title ?? "",
    explanation: f.explanation ?? "",
    severity: f.severity ?? "low",
    status: "open",
    false_positive_likelihood: null,
    false_positive_reason: null,
    first_seen_at: now(),
    last_seen_at: now(),
    resolved_at: null,
    summary_text: f.summaryText ?? null,
    details_text: f.detailsText ?? null,
    fix_prompt: f.fixPrompt?.trim() || null,
    why_it_matters: f.whyItMatters?.trim() || null,
    fix_suggestion: f.fixSuggestion?.trim() || null,
  }));
  await admin.from("findings").insert(rows);
}

/**
 * POST /api/scan
 * Body: multipart/form-data with "file" (zip).
 * Requires auth. Deducts 1 credit, runs scan, saves report to scans table.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Sign in to run a scan." }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: creditsRow } = await admin
    .from("scan_credits")
    .select("credits_remaining")
    .eq("user_id", user.id)
    .maybeSingle();
  const credits = creditsRow?.credits_remaining ?? 0;
  if (credits < 1) {
    return NextResponse.json(
      { error: "No credits remaining. Get more credits to run a scan." },
      { status: 403 }
    );
  }

  await admin
    .from("scan_credits")
    .update({
      credits_remaining: credits - 1,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  const formData = await request.formData();
  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "No file uploaded. Use form field 'file' with a zip file." },
      { status: 400 }
    );
  }
  const rawProjectId = formData.get("project_id");
  const rawProjectName = formData.get("project_name");
  const projectName =
    typeof rawProjectName === "string" && rawProjectName.trim()
      ? rawProjectName.trim()
      : `${user.email ?? "User"} — ${new Date().toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}`;
  const projectId = await getOrCreateProjectId(
    admin,
    user.id,
    rawProjectId as string | null,
    projectName
  );
  const rawNotes = formData.get("notes");
  const notes = typeof rawNotes === "string" && rawNotes.trim() ? rawNotes.trim() : null;
  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length === 0) {
    return NextResponse.json(
      { error: "Uploaded file is empty." },
      { status: 400 }
    );
  }

  let scanServiceUrl = process.env.SCAN_SERVICE_URL?.trim();
  if (scanServiceUrl) {
    if (!/^https?:\/\//i.test(scanServiceUrl)) {
      scanServiceUrl = "https://" + scanServiceUrl;
    }
    const base = scanServiceUrl.replace(/\/$/, "");
    try {
      const forwardForm = new FormData();
      forwardForm.append("file", new Blob([buf]), file.name || "app.zip");
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 55000);
      const res = await fetch(`${base}/scan`, {
        method: "POST",
        body: forwardForm,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await res.json().catch(() => ({ error: "Scan service returned invalid JSON" }));
      let findings = buildReport(data as Record<string, unknown>);
      // LLM runs once per scan; dashboard never calls LLM. Enrich and persist here.
      if (findings.length > 0) {
        findings = await enrichFindingsOnce(findings);
      }
      (data as Record<string, unknown>).report = findings;
      const { critical, high, medium, low } = countSeverities(findings);
      const { data: insertedScan, error: insertError } = await admin
        .from("scans")
        .insert({
          user_id: user.id,
          project_id: projectId,
          project_name: projectName,
          notes,
          findings: findings as unknown as Record<string, unknown>[],
          finding_count: findings.length,
          critical_count: critical,
          high_count: high,
          medium_count: medium,
          low_count: low,
        })
        .select("id")
        .single();
      if (insertError || !insertedScan?.id) {
        return NextResponse.json(
          { error: "Failed to save scan", detail: insertError?.message },
          { status: 500 }
        );
      }
      await insertFindingsRows(admin, projectId, insertedScan.id, findings as StoredFinding[]);
      return NextResponse.json(data, { status: res.status });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const isTimeout = err instanceof Error && err.name === "AbortError";
      return NextResponse.json(
        {
          error: isTimeout
            ? "Scan timed out. Try a smaller zip or try again."
            : "Scan service unavailable. Please try again later.",
          detail: message,
        },
        { status: isTimeout ? 504 : 502 }
      );
    }
  }

  let workDir: string | null = null;

  try {
    workDir = path.join(os.tmpdir(), `vibescan-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);
    await fs.mkdir(workDir, { recursive: true });

    const zip = new AdmZip(buf);
    zip.extractAllTo(workDir, true);

    const semgrep = spawn("semgrep", ["scan", "--config", "auto", "--json", "--quiet", workDir], {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let semgrepNotFound = false;
    semgrep.stdout?.on("data", (chunk) => { stdout += chunk; });
    semgrep.stderr?.on("data", (chunk) => { stderr += chunk; });
    semgrep.on("error", (err) => {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") semgrepNotFound = true;
    });

    const exitCode = await new Promise<number>((resolve) => {
      semgrep.on("close", (code) => resolve(code ?? 127));
    });

    if (semgrepNotFound || exitCode === 127) {
      return NextResponse.json(
        {
          error: "Scanning is not available on this server. The Semgrep tool is not installed here. Run VibeScan locally (npm run dev) to scan your code.",
        },
        { status: 503 }
      );
    }

    let results: unknown;
    try {
      results = stdout ? JSON.parse(stdout) : { results: [], errors: [] };
    } catch {
      results = {
        results: [],
        errors: [],
        rawStdout: stdout,
        rawStderr: stderr,
        exitCode,
      };
    }

    const response: Record<string, unknown> = {
      success: exitCode === 0 || exitCode === 1,
      exitCode,
      semgrep: results,
      stderr: stderr || undefined,
    };
    let findings = buildReport(response);
    // LLM runs once per scan; dashboard never calls LLM. Enrich and persist here.
    if (findings.length > 0) {
      findings = await enrichFindingsOnce(findings);
    }
    response.report = findings;
    const { critical, high, medium, low } = countSeverities(findings);
    const { data: insertedScan, error: insertError } = await admin
      .from("scans")
      .insert({
        user_id: user.id,
        project_id: projectId,
        project_name: projectName,
        notes,
        findings: findings as unknown as Record<string, unknown>[],
        finding_count: findings.length,
        critical_count: critical,
        high_count: high,
        medium_count: medium,
        low_count: low,
      })
      .select("id")
      .single();
    if (insertError || !insertedScan?.id) {
      return NextResponse.json(
        { error: "Failed to save scan", detail: insertError?.message },
        { status: 500 }
      );
    }
    await insertFindingsRows(admin, projectId, insertedScan.id, findings as StoredFinding[]);
    return NextResponse.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Scan failed", detail: message },
      { status: 500 }
    );
  } finally {
    if (workDir) {
      try {
        await fs.rm(workDir, { recursive: true, force: true });
      } catch {
        // ignore cleanup errors
      }
    }
  }
}
