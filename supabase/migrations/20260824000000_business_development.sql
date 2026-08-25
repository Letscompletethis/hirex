create table if not exists public.bd_companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry text,
  website text,
  location text,
  address text,
  country text,
  linkedin_url text,
  employee_count integer,
  revenue_range text,
  custom_fields jsonb not null default '{}'::jsonb,
  status text not null default 'prospect' check (status in ('prospect', 'active', 'inactive')),
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bd_contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.bd_companies(id) on delete cascade,
  name text not null,
  title text,
  email text,
  phone text,
  department text,
  linkedin_url text,
  custom_fields jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active', 'inactive')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bd_opportunities (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.bd_companies(id) on delete cascade,
  contact_id uuid references public.bd_contacts(id) on delete set null,
  title text not null,
  value numeric(12, 2) not null default 0,
  stage text not null default 'lead' check (stage in ('lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
  probability integer not null default 10 check (probability between 0 and 100),
  next_follow_up date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bd_activities (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.bd_companies(id) on delete cascade,
  contact_id uuid references public.bd_contacts(id) on delete set null,
  opportunity_id uuid references public.bd_opportunities(id) on delete set null,
  type text not null default 'note' check (type in ('call', 'email', 'meeting', 'note')),
  subject text not null,
  notes text,
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.bd_job_requirements (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null unique,
  company_id uuid references public.bd_companies(id) on delete set null,
  title text not null,
  description text,
  experience text,
  skills jsonb not null default '[]'::jsonb,
  custom_fields jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bd_contacts_company_id_idx on public.bd_contacts(company_id);
create index if not exists bd_opportunities_company_id_idx on public.bd_opportunities(company_id);
create index if not exists bd_opportunities_stage_idx on public.bd_opportunities(stage);
create index if not exists bd_activities_due_at_idx on public.bd_activities(due_at);
create index if not exists bd_job_requirements_job_id_idx on public.bd_job_requirements(job_id);

alter table public.bd_companies enable row level security;
alter table public.bd_job_requirements enable row level security;
alter table public.bd_contacts enable row level security;
alter table public.bd_opportunities enable row level security;
alter table public.bd_activities enable row level security;

create or replace function public.is_hirex_owner()
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where profiles.id = auth.uid() and lower(profiles.role) = 'owner' and (profiles.status is null or lower(profiles.status) = 'active'));
$$;

create policy "Owners manage BD companies" on public.bd_companies for all using (public.is_hirex_owner()) with check (public.is_hirex_owner());
create policy "Owners manage BD job requirements" on public.bd_job_requirements for all using (public.is_hirex_owner()) with check (public.is_hirex_owner());
create policy "Owners manage BD contacts" on public.bd_contacts for all using (public.is_hirex_owner()) with check (public.is_hirex_owner());
create policy "Owners manage BD opportunities" on public.bd_opportunities for all using (public.is_hirex_owner()) with check (public.is_hirex_owner());
create policy "Owners manage BD activities" on public.bd_activities for all using (public.is_hirex_owner()) with check (public.is_hirex_owner());

alter table public.bd_companies add column if not exists address text;
alter table public.bd_companies add column if not exists country text;
alter table public.bd_companies add column if not exists linkedin_url text;
alter table public.bd_companies add column if not exists employee_count integer;
alter table public.bd_companies add column if not exists revenue_range text;
alter table public.bd_companies add column if not exists custom_fields jsonb not null default '{}'::jsonb;
alter table public.bd_contacts add column if not exists department text;
alter table public.bd_contacts add column if not exists linkedin_url text;
alter table public.bd_contacts add column if not exists custom_fields jsonb not null default '{}'::jsonb;