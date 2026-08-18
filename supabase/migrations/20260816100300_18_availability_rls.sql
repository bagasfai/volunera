create policy tutor_availability_select_own
  on public.tutor_availability
  for select
  to authenticated
  using ((select auth.uid()) = tutor_id);

create policy tutor_availability_select_admin
  on public.tutor_availability
  for select
  to authenticated
  using (private.is_admin());

create policy tutor_availability_insert_own
  on public.tutor_availability
  for insert
  to authenticated
  with check ((select auth.uid()) = tutor_id);

create policy tutor_availability_update_own
  on public.tutor_availability
  for update
  to authenticated
  using ((select auth.uid()) = tutor_id)
  with check ((select auth.uid()) = tutor_id);

create policy tutor_availability_delete_own
  on public.tutor_availability
  for delete
  to authenticated
  using ((select auth.uid()) = tutor_id);

create policy tutor_availability_exceptions_select_own
  on public.tutor_availability_exceptions
  for select
  to authenticated
  using ((select auth.uid()) = tutor_id);

create policy tutor_availability_exceptions_select_admin
  on public.tutor_availability_exceptions
  for select
  to authenticated
  using (private.is_admin());

create policy tutor_availability_exceptions_insert_own
  on public.tutor_availability_exceptions
  for insert
  to authenticated
  with check ((select auth.uid()) = tutor_id);

create policy tutor_availability_exceptions_update_own
  on public.tutor_availability_exceptions
  for update
  to authenticated
  using ((select auth.uid()) = tutor_id)
  with check ((select auth.uid()) = tutor_id);

create policy tutor_availability_exceptions_delete_own
  on public.tutor_availability_exceptions
  for delete
  to authenticated
  using ((select auth.uid()) = tutor_id);

create policy bookings_select_own
  on public.bookings
  for select
  to authenticated
  using ((select auth.uid()) = tutor_id);

create policy bookings_select_admin
  on public.bookings
  for select
  to authenticated
  using (private.is_admin());
