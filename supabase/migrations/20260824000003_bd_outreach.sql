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