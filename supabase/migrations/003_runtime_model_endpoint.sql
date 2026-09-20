create table if not exists public.runtime_config (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.runtime_config enable row level security;

drop policy if exists "Runtime config is publicly readable" on public.runtime_config;
create policy "Runtime config is publicly readable"
on public.runtime_config for select
using (true);

-- Clients can read runtime routing data but cannot insert/update/delete it.
insert into public.runtime_config (key, value)
values ('sentinel_endpoint', '{"url":""}'::jsonb)
on conflict (key) do nothing;
