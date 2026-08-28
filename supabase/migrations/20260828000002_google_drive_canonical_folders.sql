alter table public.google_drive_connections
  add column if not exists root_folder_id text,
  add column if not exists jobs_folder_id text,
  add column if not exists candidates_folder_id text;