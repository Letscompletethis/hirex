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
