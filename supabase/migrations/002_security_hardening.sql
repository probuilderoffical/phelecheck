-- Explicitly deny all client access to the training queue.
-- Trusted service-role code can still manage reviewed candidates.
drop policy if exists "No client access to training candidates" on public.training_candidates;
create policy "No client access to training candidates"
on public.training_candidates
for all
using (false)
with check (false);

-- The signup trigger invokes this internally; clients must not invoke it via RPC.
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;
