-- PheleCheck release hardening: AI rate limits, report protection, and safer defaults.

alter table public.profiles
  alter column improve_phelecheck set default false;

create table if not exists public.sentinel_rate_limits (
  subject_hash text not null,
  bucket_start timestamptz not null,
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (subject_hash, bucket_start)
);

alter table public.sentinel_rate_limits enable row level security;

drop policy if exists "No client access to sentinel rate limits" on public.sentinel_rate_limits;
create policy "No client access to sentinel rate limits"
on public.sentinel_rate_limits
for all
using (false)
with check (false);

create or replace function public.consume_sentinel_quota(
  p_subject_hash text,
  p_limit integer default 30
)
returns table(allowed boolean, remaining integer, current_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bucket timestamptz := date_trunc('hour', now());
  v_count integer;
begin
  insert into public.sentinel_rate_limits(subject_hash, bucket_start, request_count, updated_at)
  values (p_subject_hash, v_bucket, 1, now())
  on conflict (subject_hash, bucket_start)
  do update set
    request_count = public.sentinel_rate_limits.request_count + 1,
    updated_at = now()
  returning request_count into v_count;

  return query
  select
    v_count <= greatest(p_limit, 1),
    greatest(greatest(p_limit, 1) - v_count, 0),
    v_count;
end;
$$;

revoke all on function public.consume_sentinel_quota(text, integer) from public;
revoke all on function public.consume_sentinel_quota(text, integer) from anon;
revoke all on function public.consume_sentinel_quota(text, integer) from authenticated;

drop policy if exists "Users can create reports" on public.scam_reports;
drop policy if exists "Users can create own reports" on public.scam_reports;
create policy "Users can create own reports"
on public.scam_reports
for insert
with check (auth.uid() = user_id and user_id is not null);

update public.training_candidates
set user_id = null,
    source_check_id = null
where review_status = 'pending';
