-- Final-review fix: an approved tutor could still PATCH tutor_profiles (or
-- insert/delete tutor_grade_levels/tutor_subjects rows) directly through
-- PostgREST, entirely bypassing submit_tutor_application() and the review
-- queue. protect_tutor_application_columns() (Phase 2) only pins
-- application_status/reviewed_at/reviewed_by/profile_id/created_at -- every
-- other column, and the join tables' own rows, were wide open at any status,
-- 'approved' included. This tightens the 5 affected own-row policies so a
-- direct write only succeeds while the application is still 'pending' or
-- 'rejected' -- i.e. still actually under the tutor's control -- and an
-- approved tutor must go through the (not-yet-built) re-application flow
-- instead of silently rewriting a reviewed record.
--
-- submit_tutor_application() itself is unaffected: it is SECURITY DEFINER,
-- owned by the table owner (postgres), and RLS on these tables is
-- `enable row level security`, never `force row level security` -- a
-- SECURITY DEFINER function owned by the table owner bypasses RLS
-- entirely, same as every other RPC in this codebase.
--
-- tutor_grade_levels/tutor_subjects policies are `to authenticated`, which
-- already holds a SELECT grant on tutor_profiles (unlike anon, which holds
-- none -- that's why the storage-bucket policy in migration 13 needed a
-- SECURITY DEFINER helper). So a plain subquery against tutor_profiles is
-- sufficient here, no helper function required.

drop policy tutor_profiles_update_own on public.tutor_profiles;
create policy tutor_profiles_update_own
  on public.tutor_profiles
  for update
  to authenticated
  using (
    (select auth.uid()) = profile_id
    and application_status in ('pending', 'rejected')
  )
  with check (
    (select auth.uid()) = profile_id
    and application_status in ('pending', 'rejected')
  );

drop policy tutor_grade_levels_insert_own on public.tutor_grade_levels;
create policy tutor_grade_levels_insert_own
  on public.tutor_grade_levels
  for insert
  to authenticated
  with check (
    (select auth.uid()) = tutor_id
    and (
      select application_status from public.tutor_profiles
      where profile_id = tutor_id
    ) in ('pending', 'rejected')
  );

drop policy tutor_grade_levels_delete_own on public.tutor_grade_levels;
create policy tutor_grade_levels_delete_own
  on public.tutor_grade_levels
  for delete
  to authenticated
  using (
    (select auth.uid()) = tutor_id
    and (
      select application_status from public.tutor_profiles
      where profile_id = tutor_id
    ) in ('pending', 'rejected')
  );

drop policy tutor_subjects_insert_own on public.tutor_subjects;
create policy tutor_subjects_insert_own
  on public.tutor_subjects
  for insert
  to authenticated
  with check (
    (select auth.uid()) = tutor_id
    and (
      select application_status from public.tutor_profiles
      where profile_id = tutor_id
    ) in ('pending', 'rejected')
  );

drop policy tutor_subjects_delete_own on public.tutor_subjects;
create policy tutor_subjects_delete_own
  on public.tutor_subjects
  for delete
  to authenticated
  using (
    (select auth.uid()) = tutor_id
    and (
      select application_status from public.tutor_profiles
      where profile_id = tutor_id
    ) in ('pending', 'rejected')
  );
