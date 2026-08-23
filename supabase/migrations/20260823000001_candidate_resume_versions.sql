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
