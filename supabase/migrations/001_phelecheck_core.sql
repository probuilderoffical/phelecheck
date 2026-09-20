-- PheleCheck core schema
create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  language text not null default 'en',
  appearance text not null default 'light' check (appearance in ('light','dark','system')),
  improve_phelecheck boolean not null default true,
  memory_enabled boolean not null default true,
  save_history boolean not null default true,
  notifications boolean not null default true,
  safety_reminders boolean not null default true,
  upload_retention text not null default '24h' check (upload_retention in ('immediate','24h','7d')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  input_type text not null,
  input_preview text,
  risk_level text not null,
  risk_score int check (risk_score between 0 and 100),
  confidence int check (confidence between 0 and 100),
  model_name text not null default 'PheleCheck Sentinel-1',
  model_version text,
  result jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  memory_key text not null,
  memory_value jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, memory_key)
);

create table if not exists public.scam_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  report_type text,
  report_text text not null,
  status text not null default 'pending' check (status in ('pending','reviewed','rejected')),
  created_at timestamptz not null default now()
);

-- Training candidates are never populated from users who opted out.
create table if not exists public.training_candidates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  source_check_id uuid references public.checks(id) on delete set null,
  deidentified_payload jsonb not null,
  review_status text not null default 'pending' check (review_status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.checks enable row level security;
alter table public.memories enable row level security;
alter table public.scam_reports enable row level security;
alter table public.training_candidates enable row level security;

create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

create policy "Users can view own checks" on public.checks for select using (auth.uid() = user_id);
create policy "Users can insert own checks" on public.checks for insert with check (auth.uid() = user_id);
create policy "Users can delete own checks" on public.checks for delete using (auth.uid() = user_id);

create policy "Users can manage own memories" on public.memories for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can create reports" on public.scam_reports for insert with check (auth.uid() = user_id or user_id is null);
create policy "Users can view own reports" on public.scam_reports for select using (auth.uid() = user_id);

-- Users never directly read/write the training queue. Only trusted server-side service roles may access it.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
