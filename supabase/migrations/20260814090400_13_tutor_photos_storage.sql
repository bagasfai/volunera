insert into storage.buckets (id, name, public)
values ('tutor-photos', 'tutor-photos', false)
on conflict (id) do nothing;

create function private.tutor_is_approved(p_folder text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.tutor_profiles
    where profile_id::text = p_folder and application_status = 'approved'
  )
$$;

revoke execute on function private.tutor_is_approved(text) from public;
grant usage on schema private to anon;
grant execute on function private.tutor_is_approved(text) to anon, authenticated;

create policy tutor_photos_insert_own
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'tutor-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy tutor_photos_insert_admin
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'tutor-photos' and private.is_admin());

create policy tutor_photos_update_own
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'tutor-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'tutor-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy tutor_photos_update_admin
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'tutor-photos' and private.is_admin())
  with check (bucket_id = 'tutor-photos' and private.is_admin());

create policy tutor_photos_delete_own
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'tutor-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy tutor_photos_delete_admin
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'tutor-photos' and private.is_admin());

create policy tutor_photos_select_own
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'tutor-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy tutor_photos_select_admin
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'tutor-photos' and private.is_admin());

-- The one non-owner path: public once the owning tutor is approved.
create policy tutor_photos_select_public_when_approved
  on storage.objects
  for select
  to anon, authenticated
  using (
    bucket_id = 'tutor-photos'
    and private.tutor_is_approved((storage.foldername(name))[1])
  );
