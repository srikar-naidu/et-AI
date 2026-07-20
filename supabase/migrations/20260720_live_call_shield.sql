create table if not exists public.live_call_sessions (
  id uuid primary key default gen_random_uuid(),
  call_sid text not null unique,
  caller text,
  status text not null default 'ringing' check (status in ('ringing', 'connected', 'completed', 'error')),
  transcription_sid text,
  transcript text not null default '',
  latest_sequence_id integer,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists live_call_sessions_updated_at_idx on public.live_call_sessions (updated_at desc);
alter table public.live_call_sessions enable row level security;
