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
