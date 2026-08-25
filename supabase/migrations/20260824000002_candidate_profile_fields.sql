alter table public.candidates add column if not exists current_company text;
alter table public.candidates add column if not exists location text;
alter table public.candidates add column if not exists experience text;
alter table public.candidates add column if not exists skills jsonb not null default '[]'::jsonb;
alter table public.candidates add column if not exists education jsonb not null default '{}'::jsonb;