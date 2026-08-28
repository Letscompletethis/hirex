-- HireX new Supabase project setup
-- Target project: vcdacaqkvadvbptfxlem
-- Run manually in the NEW project's SQL Editor only.
-- Google Drive stores candidate resumes/documents; no Supabase Storage bucket is created.

-- Migration: 20260822000000_core_tables.sql
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'recruiter',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  must_change_password boolean not null default false
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  job_id text,
  title text not null,
  company text not null,
  recruiter_id uuid references public.profiles(id) on delete set null,
  client_id uuid,
  location text not null,
  type text not null,
  experience text not null,
  description text not null,
  responsibilities text[] not null,
  qualifications text[] not null,
  salary text,
  deadline date,
  openings integer not null default 1,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.candidates (
  "ID" uuid primary key default gen_random_uuid(),
  candidate_id text unique,
  candidate_number bigint,
  first_name text,
  last_name text,
  email text,
  phone text,
  current_job_title text,
  job_id uuid references public.jobs(id) on delete set null,
  job_title text,
  resume_path text,
  resume_paths jsonb not null default '[]'::jsonb,
  status text,
  notes text,
  viewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates("ID") on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  recruiter_id uuid references public.profiles(id) on delete set null,
  status text not null default 'new',
  applied_at timestamptz not null default now(),
  job_candidate_number bigint
);

create index if not exists profiles_role_status_idx
  on public.profiles (role, status);
create index if not exists jobs_status_created_at_idx
  on public.jobs (status, created_at desc);
create index if not exists jobs_client_id_idx
  on public.jobs (client_id);
create index if not exists candidates_email_idx
  on public.candidates (email);
create index if not exists candidates_job_id_idx
  on public.candidates (job_id);
create index if not exists candidates_status_created_at_idx
  on public.candidates (status, created_at desc);
create index if not exists applications_candidate_id_idx
  on public.applications (candidate_id);
create index if not exists applications_job_id_idx
  on public.applications (job_id);
create index if not exists applications_recruiter_id_idx
  on public.applications (recruiter_id);
create index if not exists applications_status_idx
  on public.applications (status);
create unique index if not exists jobs_job_id_unique_idx
  on public.jobs (job_id)
  where job_id is not null;

create or replace function public.is_hirex_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and lower(profiles.role) in ('owner', 'admin', 'super_admin', 'recruiter')
      and (profiles.status is null or lower(profiles.status) = 'active')
  );
$$;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, status, must_change_password)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    case
      when lower(coalesce(new.raw_user_meta_data ->> 'role', '')) in ('owner', 'admin', 'super_admin', 'recruiter')
        then lower(new.raw_user_meta_data ->> 'role')
      else 'recruiter'
    end,
    'active',
    false
  )
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user_profile();

alter table public.profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.candidates enable row level security;
alter table public.applications enable row level security;

create policy "Public can read open jobs"
  on public.jobs for select
  to anon, authenticated
  using (lower(status) = 'open');

create policy "Staff can manage jobs"
  on public.jobs for all
  to authenticated
  using (public.is_hirex_staff())
  with check (public.is_hirex_staff());

create policy "Users can read their own profile"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_hirex_staff());

create policy "Staff can manage profiles"
  on public.profiles for update
  to authenticated
  using (public.is_hirex_staff())
  with check (public.is_hirex_staff());

create policy "Staff can manage candidates"
  on public.candidates for all
  to authenticated
  using (public.is_hirex_staff())
  with check (public.is_hirex_staff());

create policy "Staff can manage applications"
  on public.applications for all
  to authenticated
  using (public.is_hirex_staff())
  with check (public.is_hirex_staff());

create policy "Public can submit applications"
  on public.applications for insert
  to anon, authenticated
  with check (true);

-- Migration: 20260823000000_google_drive_documents.sql
alter table public.candidates
  add column if not exists google_drive_folder_id text;

create table if not exists public.candidate_documents (
  id uuid primary key default gen_random_uuid(),
  candidate_id text not null,
  file_name text not null,
  drive_file_id text not null unique,
  drive_folder_id text,
  mime_type text,
  web_view_link text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists candidate_documents_candidate_id_idx
  on public.candidate_documents (candidate_id);

alter table public.candidate_documents enable row level security;

create policy "Authenticated users can manage candidate documents"
  on public.candidate_documents
  for all
  to authenticated
  using (true)
  with check (true);

-- Migration: 20260823000001_candidate_resume_versions.sql
alter table public.candidates
  add column if not exists linkedin_profile_url text;

create table if not exists public.candidate_resume_versions (
  id uuid primary key default gen_random_uuid(),
  candidate_id text not null,
  file_name text not null,
  storage_path text,
  drive_file_id text,
  drive_folder_id text,
  mime_type text,
  document_type text,
  is_current boolean not null default true,
  uploaded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists candidate_resume_versions_candidate_idx
  on public.candidate_resume_versions (candidate_id, uploaded_at desc);

create unique index if not exists candidate_resume_versions_current_idx
  on public.candidate_resume_versions (candidate_id)
  where is_current = true;

alter table public.candidate_resume_versions enable row level security;

create policy "Authenticated users can manage candidate resume versions"
  on public.candidate_resume_versions
  for all
  to authenticated
  using (true)
  with check (true);

create table if not exists public.google_drive_connections (
  id uuid primary key default gen_random_uuid(),
  provider text not null unique default 'google_drive',
  account_email text not null,
  encrypted_refresh_token text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.google_drive_connections enable row level security;

create policy "Owners and admins manage Google Drive connection"
  on public.google_drive_connections
  for all
  to authenticated
  using (exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and lower(profiles.role) in ('owner', 'admin', 'super_admin')
  ))
  with check (exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and lower(profiles.role) in ('owner', 'admin', 'super_admin')
  ));

-- Migration: 20260824000000_business_development.sql
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

-- Migration: 20260824000001_recruiting_history.sql
create table if not exists public.candidate_notes (
  id uuid primary key default gen_random_uuid(),
  candidate_id text not null,
  application_id uuid references public.applications(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists candidate_notes_candidate_idx
  on public.candidate_notes(candidate_id, created_at desc);

create table if not exists public.candidate_activity_events (
  id uuid primary key default gen_random_uuid(),
  candidate_id text not null,
  application_id uuid references public.applications(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  old_value text,
  new_value text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists candidate_activity_events_candidate_idx
  on public.candidate_activity_events(candidate_id, created_at desc);
create index if not exists candidate_activity_events_application_idx
  on public.candidate_activity_events(application_id, created_at desc);

alter table public.candidate_notes enable row level security;
alter table public.candidate_activity_events enable row level security;

create policy "Recruiters manage candidate notes"
  on public.candidate_notes for all to authenticated
  using (exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and lower(profiles.role) in ('owner', 'admin', 'super_admin', 'recruiter')
      and (profiles.status is null or lower(profiles.status) = 'active')
  ))
  with check (exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and lower(profiles.role) in ('owner', 'admin', 'super_admin', 'recruiter')
      and (profiles.status is null or lower(profiles.status) = 'active')
  ));

create policy "Recruiters read candidate activity"
  on public.candidate_activity_events for select to authenticated
  using (exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and lower(profiles.role) in ('owner', 'admin', 'super_admin', 'recruiter')
      and (profiles.status is null or lower(profiles.status) = 'active')
  ));

-- Migration: 20260824000002_candidate_profile_fields.sql
alter table public.candidates add column if not exists current_company text;
alter table public.candidates add column if not exists location text;
alter table public.candidates add column if not exists experience text;
alter table public.candidates add column if not exists skills jsonb not null default '[]'::jsonb;
alter table public.candidates add column if not exists education jsonb not null default '{}'::jsonb;

-- Migration: 20260824000003_bd_outreach.sql
create table if not exists public.bd_audiences (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  filters jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bd_audience_contacts (
  audience_id uuid not null references public.bd_audiences(id) on delete cascade,
  contact_id uuid not null references public.bd_contacts(id) on delete cascade,
  added_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (audience_id, contact_id)
);

create table if not exists public.bd_campaign_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subject text not null,
  body text not null,
  merge_fields jsonb not null default '[]'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bd_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  audience_id uuid references public.bd_audiences(id) on delete set null,
  template_id uuid references public.bd_campaign_templates(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'ready', 'queued', 'sending', 'paused', 'completed', 'failed')),
  provider text,
  provider_status text not null default 'not_configured',
  provider_message text,
  scheduled_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bd_campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.bd_campaigns(id) on delete cascade,
  contact_id uuid references public.bd_contacts(id) on delete set null,
  email text,
  name text,
  status text not null default 'pending' check (status in ('pending', 'ready', 'sent', 'delivered', 'bounced', 'failed', 'skipped')),
  provider_message_id text,
  provider_status text,
  error text,
  rendered_subject text,
  rendered_body text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (campaign_id, contact_id)
);

create table if not exists public.bd_campaign_events (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.bd_campaigns(id) on delete cascade,
  recipient_id uuid references public.bd_campaign_recipients(id) on delete cascade,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists bd_audience_contacts_contact_idx on public.bd_audience_contacts(contact_id);
create index if not exists bd_campaigns_status_idx on public.bd_campaigns(status);
create index if not exists bd_campaign_recipients_campaign_idx on public.bd_campaign_recipients(campaign_id, status);
create index if not exists bd_campaign_events_campaign_idx on public.bd_campaign_events(campaign_id, created_at desc);

alter table public.bd_audiences enable row level security;
alter table public.bd_audience_contacts enable row level security;
alter table public.bd_campaign_templates enable row level security;
alter table public.bd_campaigns enable row level security;
alter table public.bd_campaign_recipients enable row level security;
alter table public.bd_campaign_events enable row level security;

create policy "Owners manage BD audiences" on public.bd_audiences for all using (public.is_hirex_owner()) with check (public.is_hirex_owner());
create policy "Owners manage BD audience contacts" on public.bd_audience_contacts for all using (public.is_hirex_owner()) with check (public.is_hirex_owner());
create policy "Owners manage BD campaign templates" on public.bd_campaign_templates for all using (public.is_hirex_owner()) with check (public.is_hirex_owner());
create policy "Owners manage BD campaigns" on public.bd_campaigns for all using (public.is_hirex_owner()) with check (public.is_hirex_owner());
create policy "Owners manage BD campaign recipients" on public.bd_campaign_recipients for all using (public.is_hirex_owner()) with check (public.is_hirex_owner());
create policy "Owners manage BD campaign events" on public.bd_campaign_events for all using (public.is_hirex_owner()) with check (public.is_hirex_owner());

-- Migration: 20260828000000_client_inquiries.sql
create table if not exists public.client_inquiries (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  company_name text not null,
  company_email text not null,
  contact_number text not null,
  message text not null,
  source text not null default 'Talk to HireX',
  status text not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists client_inquiries_created_at_idx
  on public.client_inquiries (created_at desc);

alter table public.client_inquiries enable row level security;

create policy "Authenticated recruiters can manage inquiries"
  on public.client_inquiries
  for all
  to authenticated
  using (true)
  with check (true);

-- Migration: 20260828000001_google_drive_folder_ids.sql
alter table public.jobs
  add column if not exists drive_folder_id text,
  add column if not exists drive_applications_folder_id text;

alter table public.candidate_documents
  add column if not exists drive_file_id text unique,
  add column if not exists document_type text default 'resume';

create index if not exists candidate_documents_drive_file_id_idx
  on public.candidate_documents (drive_file_id);

-- Migration: 20260828000002_google_drive_canonical_folders.sql
alter table public.google_drive_connections
  add column if not exists root_folder_id text,
  add column if not exists jobs_folder_id text,
  add column if not exists candidates_folder_id text;

-- Migration: 20260828000003_public_jobs_and_recruiter_assignment.sql
alter table public.jobs
  add column if not exists recruiter_id uuid references public.profiles(id) on delete set null;

create index if not exists jobs_recruiter_id_idx
  on public.jobs (recruiter_id);

revoke select on public.jobs from anon;

create or replace view public.public_jobs as
select
  id,
  job_id,
  title,
  'Confidential Client'::text as company,
  location,
  type,
  experience,
  description,
  responsibilities,
  qualifications,
  status,
  openings,
  salary,
  deadline,
  created_at
from public.jobs
where lower(status) in ('published', 'active', 'open');

grant select on public.public_jobs to anon, authenticated;
