-- Add Drive folder IDs to jobs table
alter table public.jobs
  add column if not exists drive_folder_id text,
  add column if not exists drive_applications_folder_id text;

-- Add Drive file ID tracking to candidate_documents
alter table public.candidate_documents
  add column if not exists drive_file_id text unique,
  add column if not exists document_type text default 'resume';

-- Create index for Drive file lookups
create index if not exists candidate_documents_drive_file_id_idx
  on public.candidate_documents (drive_file_id);
