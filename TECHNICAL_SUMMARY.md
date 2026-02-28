# VibeScan — Technical Summary (Current State)

Use this document to onboard a new chat or developer. It reflects the project after the projects/findings refactor and false positive detection work.

---

## 1. Product and stack

- **Product:** VibeScan is a security scanner for non-technical and AI-assisted builders (Lovable, Bolt, Cursor). Users get a plain-English report with fix suggestions and copy-paste prompts for AI coding tools. The prompts are **advisory** (ask the AI to explain options and wait for confirmation), not prescriptive.
- **Stack:** Next.js (App Router) on Vercel, Supabase (Auth + Postgres), Stripe (checkout), optional Flask scan-service on Railway (Semgrep + Gitleaks).

---

## 2. Database schema — core + new relational tables

**Original tables**

- **scan_credits:** `user_id`, `credits_remaining`, `updated_at`.
- **scans:** `id`, `user_id`, `created_at`, `project_name`, `notes`, `findings` (jsonb), `finding_count`, `critical_count`, `high_count`, `medium_count`, `low_count`. After migration 002, also `project_id` (uuid, nullable, FK → projects).
- **stripe_credited_sessions:** `session_id`.

**New tables (migration 001)**

- **projects:** `id`, `user_id` (FK → auth.users), `name`, `created_at`. Unique on `(user_id, name)`. One row per user-visible "project."
- **findings:** One row per finding per scan.  
  - Core: `id`, `project_id`, `scan_id`, `rule_id`, `scanner`, `file_path`, `line`, `title`, `explanation`, `severity`, `status` (default `'open'`), `first_seen_at`, `last_seen_at`, `resolved_at`.  
  - FP: `false_positive_likelihood`, `false_positive_reason`.  
  - Enrichment (Option A): `summary_text`, `details_text`, `fix_prompt`, `why_it_matters`, `fix_suggestion`.
- **false_positive_patterns:** `id`, `rule_id`, `context_clue`, `explanation`, `confidence`, `active` (default true), `created_at`. Rule-based FP matching (e.g. rule_id + optional file path substring).
- **false_positive_feedback:** `id`, `finding_id` (FK → findings), `rule_id`, `suggested_likelihood`, `user_verdict`, `user_note`, `created_at`. User feedback ("Yes, false positive" / "No, real issue") for findings that have a FP assessment.

**Migration 002:** Adds `project_id` to `scans`, creates a "Legacy scans" project per user, backfills `scans.project_id` for existing rows.

**RLS:** Users can manage own `projects`; read/insert/update own `findings` (via project ownership); read `false_positive_patterns`; full CRUD on `false_positive_feedback` for own findings (via findings → projects).

---

## 3. Dual-write: findings table + legacy JSON on scans

- **On every new scan**, the API:
  1. Resolves or creates a **project** (by `project_id` or `project_name`), then inserts a **scan** row with `project_id`, `project_name`, `notes`, **findings (JSONB)**, and severity counts.
  2. Inserts one row per finding into the **findings** table (project_id, scan_id, rule_id, scanner, file_path, line, title, explanation, severity, status, false_positive_*, enrichment columns, first_seen_at, last_seen_at).
- So: **scans.findings** (legacy blob) is still written for safety and backward compatibility; **findings** is the source of truth for relational queries and per-finding FP/enrichment.
- Read path: **prefer findings table**; if a scan has no rows in `findings` for that `scan_id`, **fall back to scans.findings** (legacy view-only).

---

## 4. False positive detection flow

- **Before enrichment:** Scan API loads active rows from **false_positive_patterns** (`active = true`), then calls `enrichFindingsOnce(findings, patterns)`.
- **In enrichFindingsOnce** (`src/lib/enrich-findings-once.ts`):
  1. **Rule-based match:** For each finding, if any pattern matches (`rule_id` equals finding's `checkId` after trim, and `context_clue` is null/empty **or** finding's `file` contains `context_clue`), set `false_positive_likelihood` (from pattern `confidence`: possible_fp / likely_fp) and `false_positive_reason` (from pattern `explanation`). First matching pattern wins.
  2. **Claude:** One batched LLM call for findings that still need summary/fixPrompt. The prompt also asks for a false-positive assessment per finding: `falsePositiveLikelihood` (`confirmed_issue` | `possible_fp` | `likely_fp`) and `falsePositiveReason`. When merging Claude's response, FP fields are **only** written when `row.false_positive_likelihood == null` (i.e. rule-based FP takes precedence).
- **Persistence:** Enriched findings (including FP fields) are passed to `insertFindingsRows`, which writes `false_positive_likelihood` and `false_positive_reason` into the **findings** table.

---

## 5. Persistent findings architecture (read path)

- **Dashboard** (`/dashboard`): For the latest scan, loads scan row and then findings with `supabase.from("findings").select(...).eq("scan_id", lastScan.id)`. If any rows exist, uses `findingsRowsToStoredFindings` and `mapReportFindingsToNormalized` (including `false_positive_likelihood` / `false_positive_reason`); otherwise uses `lastScan.findings` (legacy JSON).
- **Report page** (`/dashboard/scans/[id]`): Loads scan by id, then `findings` by `scan_id`. If rows exist, uses `findingsRowsToStoredFindings` for the list and passes each finding (with optional `findingId`) to `ReportFindingCard`; else uses `scan.findings` (legacy).
- **Types:** `FindingRow` (DB row), `StoredFinding` (ReportFinding + summaryText, detailsText, false_positive_*), `NormalizedFinding` (id, scanner, severity, title, summaryText, detailsText, filePath, line, ruleId, fixPrompt, detailsUrl, whyItMatters, fixSuggestion, **false_positive_likelihood**, **false_positive_reason**). `findingsRowsToStoredFindings` and `mapReportFindingsToNormalized` both carry FP fields through to the UI.

---

## 6. Recent UI changes

- **Scan page:** Project is a **dropdown** from **GET /api/projects** (id, name, created_at, ordered by most recently used). User can pick an existing project (sends `project_id`) or "New project..." and type a name (sends `project_name` only). Post-scan redirects to dashboard.
- **Dashboard:** Top issues use **NormalizedFinding** (with FP fields). **FindingCard** (`src/components/dashboard/FindingCard.tsx`): when `false_positive_likelihood` is `likely_fp` or `possible_fp`, shows blue left border, light blue background, "Likely false positive" / "Possibly false positive" badge, and `false_positive_reason` text (same styling as ReportFindingCard).
- **Report page** (`/dashboard/scans/[id]`): **ReportFindingCard** shows the same FP badge and reason for `likely_fp` / `possible_fp`; when the finding has a DB `id`, it also shows "Was this a false positive?" with **"✓ Yes, false positive"** and **"✗ No, real issue"** buttons that POST to **/api/false-positive-feedback** with `finding_id`, `user_verdict` (`confirmed_fp` | `not_fp`), and optional `user_note`. After submit, the chosen verdict is shown.
- **Scan page** (if results were ever shown there): FindingCard shows the same blue FP badge and reason; no feedback buttons (no finding id from DB).

---

## 7. Key API routes

| Route | Purpose |
|-------|--------|
| POST /api/scan | Auth, credits, getOrCreateProjectId; buildReport; load false_positive_patterns; enrichFindingsOnce(findings, patterns); insert scan (with project_id, legacy findings JSON) + insertFindingsRows (findings table with FP and enrichment). |
| GET /api/projects | Returns user's projects (id, name, created_at) ordered by most recently used (via scans.project_id). |
| POST /api/false-positive-feedback | Body: finding_id, user_verdict ('confirmed_fp' \| 'not_fp'), user_note?. Verifies finding belongs to user via projects; inserts into false_positive_feedback. |

---

## 8. Key files

| Area | Paths |
|------|--------|
| Scan API + dual-write + FP patterns | `src/app/api/scan/route.ts` (getOrCreateProjectId, insertFindingsRows, false_positive_patterns query, enrichFindingsOnce with patterns) |
| FP detection + Claude FP assessment | `src/lib/enrich-findings-once.ts` (patternMatchesFinding, confidenceToLikelihood, rule-based FP loop, batchLlmSummaries with falsePositiveLikelihood/Reason, merge only when row.false_positive_likelihood == null) |
| Types + mapping | `src/app/dashboard/types.ts` (FindingRow, StoredFinding, NormalizedFinding with FP fields; findingsRowsToStoredFindings; mapReportFindingsToNormalized) |
| Dashboard read path | `src/app/dashboard/page.tsx` (findings table by scan_id, fallback to scan.findings; mapReportFindingsToNormalized with FP) |
| Report read path | `src/app/dashboard/scans/[id]/page.tsx` (findings by scan_id, fallback to scan.findings; ReportFindingCard with findingId) |
| Dashboard finding card (FP badge/reason) | `src/components/dashboard/FindingCard.tsx` |
| Report finding card (FP badge/reason + feedback buttons) | `src/app/dashboard/scans/[id]/ReportFindingCard.tsx` |
| FP feedback API | `src/app/api/false-positive-feedback/route.ts` |
| Migrations | `supabase/migrations/001_projects_and_findings.sql`, `002_scans_add_project_id_legacy.sql` |

---

## 9. Quick reference

- **Projects:** Scan form sends `project_id` or `project_name`; API getOrCreateProjectId; scans have `project_id`; legacy scans backfilled to "Legacy scans" project.
- **Findings:** Written to both `scans.findings` (JSONB) and `findings` table (relational + FP + enrichment). Read from `findings` when rows exist, else `scans.findings`.
- **False positives:** Rule-based (false_positive_patterns) applied first; Claude FP only for findings with no rule match; FP fields on StoredFinding and NormalizedFinding; UI shows badge + reason; feedback via POST /api/false-positive-feedback.
