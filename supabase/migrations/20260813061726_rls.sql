create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

create policy profiles_select_admin
  on public.profiles
  for select
  to authenticated
  using (private.is_admin());

create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy profiles_update_admin
  on public.profiles
  for update
  to authenticated
  using (private.is_admin())
  with check (private.is_admin());

create policy students_select_own
  on public.students
  for select
  to authenticated
  using ((select auth.uid()) = profile_id);

create policy students_select_admin
  on public.students
  for select
  to authenticated
  using (private.is_admin());

create policy students_update_own
  on public.students
  for update
  to authenticated
  using ((select auth.uid()) = profile_id)
  with check ((select auth.uid()) = profile_id);

create policy students_update_admin
  on public.students
  for update
  to authenticated
  using (private.is_admin())
  with check (private.is_admin());

create policy tutor_profiles_select_own
  on public.tutor_profiles
  for select
  to authenticated
  using ((select auth.uid()) = profile_id);

create policy tutor_profiles_select_admin
  on public.tutor_profiles
  for select
  to authenticated
  using (private.is_admin());

create policy tutor_profiles_update_own
  on public.tutor_profiles
  for update
  to authenticated
  using ((select auth.uid()) = profile_id)
  with check ((select auth.uid()) = profile_id);

create policy tutor_profiles_update_admin
  on public.tutor_profiles
  for update
  to authenticated
  using (private.is_admin())
  with check (private.is_admin());

create policy grade_levels_select_anon
  on public.grade_levels
  for select
  to anon
  using (is_active);

create policy grade_levels_select_authenticated
  on public.grade_levels
  for select
  to authenticated
  using (is_active or private.is_admin());

create policy grade_levels_write_admin
  on public.grade_levels
  for all
  to authenticated
  using (private.is_admin())
  with check (private.is_admin());

create policy subjects_select_anon
  on public.subjects
  for select
  to anon
  using (is_active);

create policy subjects_select_authenticated
  on public.subjects
  for select
  to authenticated
  using (is_active or private.is_admin());

create policy subjects_write_admin
  on public.subjects
  for all
  to authenticated
  using (private.is_admin())
  with check (private.is_admin());

revoke insert, update, delete on public.grade_levels from anon;
revoke insert, update, delete on public.subjects from anon;

revoke truncate, references, trigger, maintain on public.profiles from anon, authenticated;
revoke truncate, references, trigger, maintain on public.students from anon, authenticated;
revoke truncate, references, trigger, maintain on public.tutor_profiles from anon, authenticated;
revoke truncate, references, trigger, maintain on public.grade_levels from anon, authenticated;
revoke truncate, references, trigger, maintain on public.subjects from anon, authenticated;

alter default privileges for role postgres in schema public
  revoke truncate, references, trigger, maintain on tables from anon, authenticated;
