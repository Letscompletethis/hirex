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
  )));
