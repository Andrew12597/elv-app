-- ELV Australia Project Management App
-- Run this in your Supabase SQL editor

create table projects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  client text not null,
  status text not null default 'active' check (status in ('active', 'completed', 'on-hold', 'cancelled')),
  quoted_price numeric(12,2) not null default 0,
  start_date date not null,
  end_date date not null,
  description text,
  created_at timestamptz default now()
);

create table expenses (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade,
  vendor text not null,
  amount numeric(12,2) not null,
  date date not null,
  price_code text not null,
  description text,
  receipt_url text,
  created_at timestamptz default now()
);

create table invoices (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade,
  invoice_number text not null,
  amount numeric(12,2) not null,
  status text not null default 'draft' check (status in ('draft', 'sent', 'paid', 'overdue')),
  issued_date date not null,
  due_date date not null,
  created_at timestamptz default now()
);

create table tasks (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade,
  name text not null,
  start_date date not null,
  end_date date not null,
  status text not null default 'not-started' check (status in ('not-started', 'in-progress', 'completed')),
  assignee text,
  created_at timestamptz default now()
);

create table quote_items (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade,
  name text not null,
  quantity numeric(10,2) not null default 1,
  unit_price numeric(12,2) not null,
  type text not null default 'material' check (type in ('material', 'labour')),
  created_at timestamptz default now()
);

-- Storage bucket for receipt images
insert into storage.buckets (id, name, public) values ('receipts', 'receipts', false);

-- RLS: enable for all tables (configure auth later)
alter table projects enable row level security;
alter table expenses enable row level security;
alter table invoices enable row level security;
alter table tasks enable row level security;
alter table quote_items enable row level security;

-- Temporary open policies (tighten when you add auth)
create policy "allow all" on projects for all using (true) with check (true);
create policy "allow all" on expenses for all using (true) with check (true);
create policy "allow all" on invoices for all using (true) with check (true);
create policy "allow all" on tasks for all using (true) with check (true);
create policy "allow all" on quote_items for all using (true) with check (true);
