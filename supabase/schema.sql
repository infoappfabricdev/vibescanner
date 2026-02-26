-- Run this in Supabase Dashboard → SQL Editor
-- For existing installs that already have scans without critical_count, run first:
--   alter table public.scans add column if not exists critical_count int not null default 0;

-- Credits balance per user (one row per user)
create table if not exists public.scan_credits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  credits_remaining int not null default 0,
  updated_at timestamptz not null default now()
);

-- Past scans (full report saved)
create table if not exists public.scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  findings jsonb not null default '[]',
  finding_count int not null default 0,
  critical_count int not null default 0,
  high_count int not null default 0,
  medium_count int not null default 0,
  low_count int not null default 0
);

create index if not exists scans_user_id_idx on public.scans(user_id);
create index if not exists scans_created_at_idx on public.scans(created_at desc);

-- Track Stripe sessions we've already credited (avoid double-credit)
create table if not exists public.stripe_credited_sessions (
  session_id text primary key
);

-- RLS: users see only their own data
alter table public.scan_credits enable row level security;
alter table public.scans enable row level security;
alter table public.stripe_credited_sessions enable row level security;

-- scan_credits: user can read/update own row
create policy "Users can read own scan_credits"
  on public.scan_credits for select
  using (auth.uid() = user_id);

create policy "Users can update own scan_credits"
  on public.scan_credits for update
  using (auth.uid() = user_id);

create policy "Users can insert own scan_credits"
  on public.scan_credits for insert
  with check (auth.uid() = user_id);

-- scans: user can read/insert own rows only
create policy "Users can read own scans"
  on public.scans for select
  using (auth.uid() = user_id);

create policy "Users can insert own scans"
  on public.scans for insert
  with check (auth.uid() = user_id);

-- stripe_credited_sessions: no policies (only service_role in API can insert/select)
