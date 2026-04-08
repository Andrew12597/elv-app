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
  check (status in ('active', 'waiting-approval', 'quoting', 'on-hold', 'completed', 'cancelled'));
