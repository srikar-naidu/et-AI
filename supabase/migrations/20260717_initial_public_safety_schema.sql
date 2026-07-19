create extension if not exists "pgcrypto";

create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  case_number text not null unique,
  title text not null check (char_length(title) between 1 and 160),
  status text not null default 'open' check (status in ('open', 'triaged', 'escalated', 'closed')),
  severity smallint not null default 2 check (severity between 1 and 5),
  source text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  incident_type text not null check (incident_type in ('digital_arrest', 'phishing', 'counterfeit', 'deepfake', 'other')),
  description text not null check (char_length(description) between 20 and 4000),
  location_label text,
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  consent_to_store boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.cases(id) on delete cascade,
  event_type text not null,
  actor_type text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.evidence_items (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  original_filename text not null,
  content_type text not null,
  byte_size bigint not null check (byte_size > 0),
  storage_path text not null unique,
  sha256 text not null check (char_length(sha256) = 64),
  source text not null,
  created_at timestamptz not null default now()
);

insert into storage.buckets (id, name, public, file_size_limit)
values ('case-evidence', 'case-evidence', false, 20971520)
on conflict (id) do nothing;

create table if not exists public.graph_entities (
  id uuid primary key default gen_random_uuid(),
  external_id text not null unique,
  entity_type text not null check (entity_type in ('account', 'individual', 'organization', 'phone', 'url', 'device', 'location')),
  label text not null,
  risk_score numeric(5,2) not null default 0 check (risk_score between 0 and 100),
  attributes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.graph_edges (
  id uuid primary key default gen_random_uuid(),
  source_external_id text not null,
  target_external_id text not null,
  relationship_type text not null,
  amount numeric(16,2),
  occurred_at timestamptz,
  is_flagged boolean not null default false,
  attributes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists complaints_created_at_idx on public.complaints (created_at desc);
create index if not exists complaints_coordinates_idx on public.complaints (latitude, longitude);
create index if not exists audit_events_case_id_idx on public.audit_events (case_id, created_at desc);
create index if not exists evidence_items_case_id_idx on public.evidence_items (case_id, created_at desc);
create index if not exists graph_edges_source_idx on public.graph_edges (source_external_id);
create index if not exists graph_edges_target_idx on public.graph_edges (target_external_id);
create unique index if not exists graph_edges_dedup_idx on public.graph_edges (source_external_id, target_external_id, relationship_type, occurred_at);

alter table public.cases enable row level security;
alter table public.complaints enable row level security;
alter table public.audit_events enable row level security;
alter table public.evidence_items enable row level security;
alter table public.graph_entities enable row level security;
alter table public.graph_edges enable row level security;

-- All writes are currently performed only by server Route Handlers using the secret key.
-- Public reads are deliberately disabled until operator authentication is added.
