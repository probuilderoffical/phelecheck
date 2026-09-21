-- PheleCheck release performance hardening.

create index if not exists checks_user_id_idx on public.checks(user_id);
create index if not exists scam_reports_user_id_idx on public.scam_reports(user_id);
create index if not exists training_candidates_user_id_idx on public.training_candidates(user_id);
create index if not exists training_candidates_source_check_id_idx on public.training_candidates(source_check_id);

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles for select using ((select auth.uid()) = id);
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using ((select auth.uid()) = id);
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles for insert with check ((select auth.uid()) = id);

drop policy if exists "Users can view own checks" on public.checks;
create policy "Users can view own checks" on public.checks for select using ((select auth.uid()) = user_id);
drop policy if exists "Users can insert own checks" on public.checks;
create policy "Users can insert own checks" on public.checks for insert with check ((select auth.uid()) = user_id);
drop policy if exists "Users can delete own checks" on public.checks;
create policy "Users can delete own checks" on public.checks for delete using ((select auth.uid()) = user_id);

drop policy if exists "Users can manage own memories" on public.memories;
create policy "Users can manage own memories" on public.memories
for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Users can view own reports" on public.scam_reports;
create policy "Users can view own reports" on public.scam_reports for select using ((select auth.uid()) = user_id);
drop policy if exists "Users can create own reports" on public.scam_reports;
create policy "Users can create own reports" on public.scam_reports
for insert with check ((select auth.uid()) = user_id and user_id is not null);
