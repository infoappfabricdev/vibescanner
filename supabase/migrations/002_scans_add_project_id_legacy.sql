-- Add project_id to scans and backfill legacy scans with a catch-all project per user.
-- Run after 001_projects_and_findings.sql.

alter table public.scans add column if not exists project_id uuid references public.projects(id) on delete set null;

-- One-time: create one "Legacy scans" project per user who has scans without project_id
insert into public.projects (user_id, name, created_at)
select s.user_id, 'Legacy scans', min(s.created_at)
from public.scans s
where s.project_id is null
group by s.user_id
on conflict (user_id, name) do nothing;

-- Backfill: set project_id for existing scans (match by user_id and name)
update public.scans s
set project_id = p.id
from public.projects p
where p.user_id = s.user_id and p.name = 'Legacy scans' and s.project_id is null;
