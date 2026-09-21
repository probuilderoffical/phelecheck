create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  status text not null default 'pending' check (status in ('pending','verified','completed','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.account_deletion_requests enable row level security;

drop policy if exists "No client access to account deletion requests" on public.account_deletion_requests;
create policy "No client access to account deletion requests"
on public.account_deletion_requests
for all
using (false)
with check (false);

create index if not exists account_deletion_requests_status_created_idx
on public.account_deletion_requests(status, created_at);
