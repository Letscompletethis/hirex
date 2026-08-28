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
    'recruiter',
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
