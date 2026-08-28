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