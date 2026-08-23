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
