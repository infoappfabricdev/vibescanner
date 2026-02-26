-- Add project_name to scans table.
-- Run in Supabase Dashboard → SQL Editor (or via Supabase CLI if you use it).
alter table public.scans
  add column if not exists project_name text;
