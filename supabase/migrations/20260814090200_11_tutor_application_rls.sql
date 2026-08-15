-- Ordinary ownership RLS — grade/subject membership is not the sensitive
-- application_status transition, so it does not need to go through
-- submit_tutor_application(). Same shape as students_update_own in Phase 1.

create policy tutor_grade_levels_select_own
  on public.tutor_grade_levels
  for select
  to authenticated
  using ((select auth.uid()) = tutor_id);

create policy tutor_grade_levels_select_admin
  on public.tutor_grade_levels
  for select
  to authenticated
  using (private.is_admin());

create policy tutor_grade_levels_insert_own
  on public.tutor_grade_levels
  for insert
  to authenticated
  with check ((select auth.uid()) = tutor_id);

create policy tutor_grade_levels_insert_admin
  on public.tutor_grade_levels
  for insert
  to authenticated
  with check (private.is_admin());

create policy tutor_grade_levels_delete_own
  on public.tutor_grade_levels
  for delete
  to authenticated
  using ((select auth.uid()) = tutor_id);

create policy tutor_grade_levels_delete_admin
  on public.tutor_grade_levels
  for delete
  to authenticated
  using (private.is_admin());

create policy tutor_subjects_select_own
  on public.tutor_subjects
  for select
  to authenticated
  using ((select auth.uid()) = tutor_id);

create policy tutor_subjects_select_admin
  on public.tutor_subjects
  for select
  to authenticated
  using (private.is_admin());

create policy tutor_subjects_insert_own
  on public.tutor_subjects
  for insert
  to authenticated
  with check ((select auth.uid()) = tutor_id);

create policy tutor_subjects_insert_admin
  on public.tutor_subjects
  for insert
  to authenticated
  with check (private.is_admin());

create policy tutor_subjects_delete_own
  on public.tutor_subjects
  for delete
  to authenticated
  using ((select auth.uid()) = tutor_id);

create policy tutor_subjects_delete_admin
  on public.tutor_subjects
  for delete
  to authenticated
  using (private.is_admin());
