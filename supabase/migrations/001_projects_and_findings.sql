-- New tables for relational schema: projects, findings (with Option A enrichment columns),
-- false_positive_patterns, false_positive_feedback.
-- Run in Supabase Dashboard → SQL Editor after scans table exists.

-- Projects (one per user-visible "project name")
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index if not exists projects_user_id_idx on public.projects(user_id);
create unique index if not exists projects_user_id_name_idx on public.projects(user_id, name);

-- Findings (one row per finding per scan; Option A enrichment columns for display)
create table if not exists public.findings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  scan_id uuid not null references public.scans(id) on delete cascade,
  rule_id text,
  scanner text not null,
  file_path text not null,
  line int,
  title text not null,
  explanation text not null default '',
  severity text not null,
  status text not null default 'open',
  false_positive_likelihood text,
  false_positive_reason text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  resolved_at timestamptz,
  -- Option A: enrichment columns (from LLM/curated summaries)
  summary_text text,
  details_text text,
  fix_prompt text,
  why_it_matters text,
  fix_suggestion text
);

create index if not exists findings_scan_id_idx on public.findings(scan_id);
create index if not exists findings_project_id_idx on public.findings(project_id);
create index if not exists findings_rule_id_idx on public.findings(rule_id);

-- False positive patterns (global or per-rule hints)
create table if not exists public.false_positive_patterns (
  id uuid primary key default gen_random_uuid(),
  rule_id text not null,
  context_clue text,
  explanation text,
  confidence text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- False positive feedback (user verdict per finding)
create table if not exists public.false_positive_feedback (
  id uuid primary key default gen_random_uuid(),
  finding_id uuid not null references public.findings(id) on delete cascade,
  rule_id text not null,
  suggested_likelihood text,
  user_verdict text,
  user_note text,
  created_at timestamptz not null default now()
);

create index if not exists false_positive_feedback_finding_id_idx on public.false_positive_feedback(finding_id);

-- RLS
alter table public.projects enable row level security;
alter table public.findings enable row level security;
alter table public.false_positive_patterns enable row level security;
alter table public.false_positive_feedback enable row level security;

create policy "Users can manage own projects"
  on public.projects for all using (auth.uid() = user_id);

create policy "Users can read findings for own projects"
  on public.findings for select
  using (exists (select 1 from public.projects p where p.id = findings.project_id and p.user_id = auth.uid()));

create policy "Users can insert findings for own projects"
  on public.findings for insert
  with check (exists (select 1 from public.projects p where p.id = findings.project_id and p.user_id = auth.uid()));

create policy "Users can update findings for own projects"
  on public.findings for update
  using (exists (select 1 from public.projects p where p.id = findings.project_id and p.user_id = auth.uid()));

create policy "Allow read false_positive_patterns"
  on public.false_positive_patterns for select using (true);

create policy "Users can manage feedback for own findings"
  on public.false_positive_feedback for all
  using (exists (
    select 1 from public.findings f
    join public.projects p on p.id = f.project_id
    where f.id = false_positive_feedback.finding_id and p.user_id = auth.uid()
  ));
