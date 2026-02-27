# VibeScan — Technical Summary (Current State)

Use this document to onboard a new chat or developer. It reflects the project as it stands today.

---

## 1. Product and stack

- **Product:** VibeScan is a security scanner for non-technical and AI-assisted builders (Lovable, Bolt, Cursor). Users get a plain-English report with fix suggestions and copy-paste prompts for AI coding tools. The prompts are **advisory** (ask the AI to explain options and wait for confirmation), not prescriptive.
- **Stack:**
  - **Next.js (App Router)** on Vercel: marketing, auth, checkout, scan UI, dashboard, API routes.
  - **Supabase:** Auth and Postgres (users, credits, scans).
  - **Stripe:** Checkout for paid scans ($9 per scan).
  - **Scan service (optional):** Flask app in `scan-service/`, Docker on Railway. Runs Semgrep and Gitleaks on uploaded zip. Used when `SCAN_SERVICE_URL` is set; otherwise the Next.js API runs Semgrep locally (e.g. dev).

---

## 2. Authentication and credits

- **Supabase Auth** is the only user identity. Sign-in/sign-up via `/auth`; redirect after login can go to `/dashboard`, `/scan`, etc. (`next` query param).
- **Protected surfaces:**
  - **POST /api/scan** requires a signed-in user (`supabase.auth.getUser()`). Returns 401 if not authenticated.
  - **Dashboard** (`/dashboard`, `/dashboard/scans/[id]`) is server-rendered and redirects to `/auth?next=/dashboard` if no user.
- **Credits:** One credit per scan. Tables: `scan_credits` (balance per user), `stripe_credited_sessions` (idempotency for Stripe). Credits are granted after Stripe Checkout (success URL `/scan?session_id=...` → client calls POST /api/credit-from-session) and/or via Stripe webhook `checkout.session.completed`. POST /api/scan checks credits, returns 403 if &lt; 1, then decrements and runs the scan.
- **Nav:** Shows “Sign in” or “Dashboard” + “Sign out” depending on auth state (client-side).

---

## 3. Database schema (Supabase)

Run migrations in Supabase Dashboard → SQL Editor. For existing DBs, use the `alter table ... add column if not exists` lines from the comments in `supabase/schema.sql`.

### Tables

| Table | Purpose |
|-------|--------|
| **scan_credits** | One row per user. Balance and last update. |
| **scans** | One row per scan. Full report (findings JSONB) and counts. |
| **stripe_credited_sessions** | Session IDs already credited (avoid double-credit). |

### Columns

**scan_credits**
- `user_id` (uuid, PK, FK → auth.users)
- `credits_remaining` (int, not null, default 0)
- `updated_at` (timestamptz, not null)

**scans**
- `id` (uuid, PK, default gen_random_uuid())
- `user_id` (uuid, not null, FK → auth.users)
- `created_at` (timestamptz, not null)
- `project_name` (text, nullable)
- `notes` (text, nullable)
- `findings` (jsonb, not null, default '[]')
- `finding_count` (int, not null)
- `critical_count`, `high_count`, `medium_count`, `low_count` (int, not null)

**stripe_credited_sessions**
- `session_id` (text, PK)

**RLS:** Users can read/update/insert own `scan_credits`; read/insert own `scans`. No policies on `stripe_credited_sessions` (service_role only).

**Migrations (run if upgrading):**
- `alter table public.scans add column if not exists critical_count int not null default 0;`
- `alter table public.scans add column if not exists project_name text;`
- `alter table public.scans add column if not exists notes text;`
- See also `supabase/migrations/add_project_name_to_scans.sql` and `supabase/migrations/add_notes_to_scans.sql`.

---

## 4. Environment variables

### Vercel (Next.js)

| Variable | Required | Purpose |
|----------|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key (client) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-side Supabase (credits, scans, RLS bypass) |
| `STRIPE_SECRET_KEY` | Yes | Stripe API (checkout, credit-from-session) |
| `STRIPE_WEBHOOK_SECRET` | Optional | Webhook signature verification; if set, webhook can grant credits |
| `NEXT_PUBLIC_APP_URL` | Recommended | App URL for redirects (e.g. https://vibescan.co) |
| `SCAN_SERVICE_URL` | Optional | When set, POST /api/scan forwards zip to this URL (e.g. Railway scan-service) |
| `ANTHROPIC_API_KEY` | Optional | LLM enrichment for findings (summaries + advisory fix prompts) |
| `COUPON_SECRET` | Optional | Coupon token signing; falls back to STRIPE_SECRET_KEY |

### Railway (scan-service)

- `PORT` (e.g. 8080) for gunicorn. No auth between Vercel and scan-service today.

### Local dev

- `.env.local` with the same Next.js vars. No `.env.example` in repo; copy from another env or create from this list.

---

## 5. Key files and their purpose

### App and pages

| Path | Purpose |
|------|--------|
| `src/app/layout.tsx` | Root layout, Nav |
| `src/app/page.tsx` | Landing page |
| `src/app/auth/page.tsx` | Sign-in/sign-up (Supabase) |
| `src/app/auth/callback/route.ts` | OAuth callback |
| `src/app/checkout/page.tsx` | Coupon input + “Continue to payment” (Stripe) |
| `src/app/checkout/layout.tsx` | Checkout layout |
| `src/app/pricing/page.tsx` | Pricing, CTA to checkout/scan |
| `src/app/scan/page.tsx` | Upload zip, project name, notes; combo project name from history; redirect to dashboard after success |
| `src/app/scan/layout.tsx` | Scan layout |
| `src/app/dashboard/page.tsx` | Credits, last scan summary, past scans list (project name + date), top issues |
| `src/app/dashboard/DashboardClient.tsx` | Client wrapper for dashboard |
| `src/app/dashboard/scans/[id]/page.tsx` | Single scan report (project name, date, notes, findings) |
| `src/app/dashboard/scans/[id]/ReportFindingCard.tsx` | Client component: finding card with fix prompt, disclaimer, “Help your AI fix this” button + popover |
| `src/app/dashboard/types.ts` | StoredFinding, NormalizedFinding, mapReportFindingsToNormalized (incl. critical, scanner) |
| `src/app/dashboard/TopIssuesSection.tsx` | Top issues list, filters, Fix with AI |
| `src/app/dashboard/FixWithAIPanel.tsx` | Expandable fix prompt panel; “Help your AI fix this” + popover + disclaimer |
| `src/app/dashboard/findingState.ts` | localStorage state for finding status/notes |
| `src/app/how-it-works/page.tsx` | How it works |
| `src/app/trust/page.tsx` | Trust page |

### API routes

| Path | Purpose |
|------|--------|
| `src/app/api/scan/route.ts` | Auth + credits check; read project_name, notes; forward to scan-service or run Semgrep locally; buildReport + enrichFindingsOnce; persist scans (project_name, notes, critical_count, etc.) |
| `src/app/api/credits/route.ts` | GET credits for current user |
| `src/app/api/credit-from-session/route.ts` | POST session_id → grant 1 credit (idempotent per session) |
| `src/app/api/create-checkout-session/route.ts` | Create Stripe Checkout; success_url includes session_id |
| `src/app/api/validate-coupon/route.ts` | Validate coupon code, return signed token |
| `src/app/api/verify-session/route.ts` | Verify Stripe session paid |
| `src/app/api/verify-coupon/route.ts` | Verify coupon token |
| `src/app/api/webhooks/stripe/route.ts` | checkout.session.completed → grantCreditForStripeSession |
| `src/app/api/project-names/route.ts` | GET distinct project_name from user’s scans (most recent first) |
| `src/app/api/grant-coupon-credit/route.ts` | Grant credit for valid coupon (if configured) |

### Lib and shared logic

| Path | Purpose |
|------|--------|
| `src/lib/supabase/client.ts` | Browser Supabase client |
| `src/lib/supabase/server.ts` | Server Supabase client (cookies) |
| `src/lib/supabase/admin.ts` | Service-role client (credits, scans) |
| `src/lib/semgrep-report.ts` | ReportFinding type; buildReport() from unified findings or semgrep.results; CRITICAL severity; stripTempDirPrefix; advisory buildFixPrompt() |
| `src/lib/enrich-findings-once.ts` | LLM (Claude) for summary + advisory fix prompt; Gitleaks secrets prompt; platform inference for secrets |
| `src/lib/finding-summary.ts` | Curated rule summaries, getSummaryText |
| `src/lib/stripe-credit.ts` | grantCreditForStripeSession (idempotent) |
| `src/lib/coupon.ts` | VALID_COUPON_CODES, signToken, verifyCouponToken |
| `src/lib/fix-with-ai-prompt.ts` | buildFixWithAIPrompt (for Fix with AI flow) |
| `src/lib/enrich-fix-prompts.ts` | Legacy/batch fix prompts (may be unused by current flow) |

### Components

| Path | Purpose |
|------|--------|
| `src/components/Nav.tsx` | Nav with auth state |
| `src/components/ui/Container.tsx` | Layout container |
| `src/components/ui/Card.tsx` | Card wrapper |
| `src/components/ui/Button.tsx` | ButtonPrimary, ButtonSecondary |
| `src/components/ui/Badge.tsx` | Badge |
| `src/components/ui/CopyFixPromptButton.tsx` | “Help your AI fix this” button; click → popover (safety tips) → “Got it” copies and shows “Copied!”; FixPromptDisclaimer export |
| `src/components/dashboard/FindingCard.tsx` | Dashboard finding card; “Help your AI fix this” opens FixWithAIModal; disclaimer in details |
| `src/components/dashboard/FixWithAIModal.tsx` | Modal with prompt textarea; “Help your AI fix this” + popover; disclaimer |
| `src/components/dashboard/FindingsFilterBar.tsx` | Severity (critical/high/medium/low), status, search |
| `src/components/dashboard/AddNoteModal.tsx` | Add note modal |
| `src/components/dashboard/DismissFindingModal.tsx` | Dismiss finding |
| `src/components/dashboard/ResolveFindingModal.tsx` | Resolve finding |

### Scan service (Railway)

| Path | Purpose |
|------|--------|
| `scan-service/Dockerfile` | Semgrep base image; apk install wget; Gitleaks binary (TARGETARCH); non-root user (appuser); venv, gunicorn |
| `scan-service/app.py` | POST /scan: extract zip, run Semgrep + Gitleaks; unified findings array (scanner, severity); path_relative_to_work; return findings + semgrep + gitleaks raw |
| `scan-service/requirements.txt` | Flask, gunicorn |

### Config and docs

| Path | Purpose |
|------|--------|
| `package.json` | Next.js 16, React 18, Supabase, Stripe, adm-zip |
| `middleware.ts` | Supabase session refresh |
| `next.config.ts` | Next config |
| `tsconfig.json` | TypeScript config |
| `supabase/schema.sql` | Full schema + migration comments |
| `supabase/migrations/add_project_name_to_scans.sql` | Add project_name column |
| `supabase/migrations/add_notes_to_scans.sql` | Add notes column |
| `ARCHITECTURE.md` | Older architecture doc (partially outdated: payment/coupon focus; actual flow uses Supabase auth + credits) |
| `DEPLOY.md` | Vercel + Railway deploy steps |
| `README.md` | Short project intro |

---

## 6. Scan and report flow (current)

1. User on `/scan` (signed in, has credits). Optionally selects project name from history (combo) or types new; optional “What changed?” notes; selects zip.
2. Client POSTs multipart to POST /api/scan: `file`, `project_name`, `notes`.
3. API: auth, credit check, decrement credit. If `SCAN_SERVICE_URL`: forward zip to `{url}/scan`, get JSON. Else: extract zip, run Semgrep locally.
4. Response shape: `findings` (unified), `semgrep`, `gitleaks` (for compatibility). Each finding has `scanner` ("semgrep" | "gitleaks"). buildReport() consumes `findings` or falls back to `semgrep.results`; normalizes severity (critical/high/medium/low); stripTempDirPrefix for paths.
5. enrichFindingsOnce(): curated summaries where possible; LLM for advisory fix prompts (opening, what was found, file/location, security context, what secure solution should achieve, closing “explain / suggest 2–3 approaches / side effects / wait for confirmation”). Gitleaks findings get platform-aware secrets prompt. Stored as StoredFinding with summaryText, detailsText, fixPrompt, generatedBy, generatedAt.
6. Persist to `scans`: user_id, project_name, notes, findings (JSONB), finding_count, critical_count, high_count, medium_count, low_count.
7. Redirect to `/dashboard`. User sees new scan in list (project name — date, or “Untitled Scan” / date fallback).

---

## 7. UI copy and safety

- **Button:** “Help your AI fix this” (replaces “Copy prompt for AI tool” / “Fix with AI” where applicable).
- **Popover (on first click):** “How to use this safely: 1) Open your AI tool in chat or conversation mode, 2) Paste the prompt, 3) Review suggestions before applying any changes, 4) Ask follow-up questions if anything is unclear. Tip: Avoid agent or auto-apply mode until you have reviewed the suggested changes.”
- **Disclaimer (below fix prompt):** “Fix suggestions are for review purposes. Always verify changes before applying them to your codebase.”

---

## 8. Recent changes (summary)

- **Gitleaks:** Scan-service runs Semgrep + Gitleaks; unified `findings` array; Gitleaks severity critical; scanner tag; path stripping (temp dir); resilient if one scanner fails.
- **Next.js:** CRITICAL severity; buildReport from unified findings; critical_count in DB and UI; scanner tag and CRITICAL badge in scan/dashboard; enrich-findings-once secrets branch with platform inference.
- **Project naming:** project_name on scan page (combo from history); stored in scans; shown in dashboard list and report (fallback: email — date or date-only for legacy null).
- **Notes:** Optional “What changed?” textarea on scan page; stored in `scans.notes`; shown on report page under date.
- **Post-scan:** Redirect to `/dashboard` after successful scan (no results on scan page).
- **Advisory fix prompts:** LLM and buildFixPrompt produce collaborative prompts (explain, suggest options, wait for confirmation); CopyFixPromptButton + popover + disclaimer everywhere.
- **Dockerfile:** Non-root user (appuser/appgroup) for scan-service; Alpine addgroup/adduser without fixed GID/UID to avoid conflict.

---

## 9. Known issues / TODOs

- **ARCHITECTURE.md** is partially outdated (describes payment/coupon gating; actual flow is Supabase auth + credits). Should be updated to match this summary.
- **DashboardClient:** Some environments report a lint/type error “Cannot find module './DashboardClient'” even though the file exists (path/casing).
- **Scan-service ↔ Vercel:** No authentication between Next.js and scan-service; security is “only our backend calls it” and network isolation. Optional: shared secret header or private network.
- **Subscription:** Pricing page mentions “Subscription — coming soon”; not implemented.

---

## 10. Quick reference

| Area | Key paths |
|------|-----------|
| Auth | `src/app/auth/page.tsx`, `src/lib/supabase/server.ts`, `src/lib/supabase/client.ts` |
| Credits | `supabase/schema.sql`, `src/lib/stripe-credit.ts`, `src/app/api/credit-from-session/route.ts`, `src/app/api/webhooks/stripe/route.ts` |
| Checkout | `src/app/checkout/page.tsx`, `src/app/api/create-checkout-session/route.ts`, `src/app/api/validate-coupon/route.ts` |
| Scan API | `src/app/api/scan/route.ts` |
| Report build | `src/lib/semgrep-report.ts` |
| Enrichment | `src/lib/enrich-findings-once.ts`, `src/lib/finding-summary.ts` |
| Dashboard | `src/app/dashboard/page.tsx`, `src/app/dashboard/types.ts`, `src/app/dashboard/scans/[id]/page.tsx`, `ReportFindingCard.tsx` |
| Scan UI | `src/app/scan/page.tsx` |
| Fix prompt UI | `src/components/ui/CopyFixPromptButton.tsx`, `FixWithAIModal.tsx`, `FixWithAIPanel.tsx` |
| Scan service | `scan-service/Dockerfile`, `scan-service/app.py` |
