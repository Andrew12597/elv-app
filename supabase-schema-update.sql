-- Run this in Supabase SQL editor to add missing fields to projects table

alter table projects
  add column if not exists project_id text,
  add column if not exists pm text,
  add column if not exists job_type text,
  add column if not exists owner text,
  add column if not exists priority text default 'Medium',
  add column if not exists budget_cost numeric(12,2),
  add column if not exists next_action text,
  add column if not exists next_action_due date;

-- Update status check to match your workflow
alter table projects drop constraint if exists projects_status_check;
alter table projects add constraint projects_status_check
  check (status in ('active', 'waiting-approval', 'quoting', 'on-hold', 'completed', 'cancelled', 'archived'));

-- Labour entries (hourly or flat-rate labour costs per project)
create table if not exists labour_entries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  worker_name text not null,
  date date not null,
  type text not null check (type in ('hourly', 'flat')),
  hours numeric(8,2),
  rate numeric(10,2),
  amount numeric(10,2) not null,
  notes text,
  created_at timestamptz not null default now()
);

-- Project notes (timestamped notes and photos per project)
create table if not exists project_notes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  content text,
  author text not null,
  photo_url text,
  created_at timestamptz not null default now()
);
