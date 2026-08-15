-- storage.objects ships with RLS already enabled by Supabase; this migration
-- only adds the bucket row and this bucket's policies.

insert into storage.buckets (id, name, public)
values ('tutor-photos', 'tutor-photos', false)
on conflict (id) do nothing;

-- Mirrors private.is_admin(): a policy cannot safely query tutor_profiles
-- directly for anon (Phase 1 deliberately withholds all SELECT grant from
-- anon on that table -- "this table should never gain an anon grant").
-- SECURITY DEFINER bypasses that grant restriction for exactly one narrow,
-- safe check: is this specific tutor's application approved.
--
-- Takes text, not uuid: the folder segment comes from storage.foldername(),
-- which is untrusted, admin-writable free text (tutor_photos_insert_admin
-- does not restrict the folder name, and service_role bypasses RLS
-- entirely). Casting to uuid inside the policy would raise 22P02 for any
-- off-convention object name and break every subsequent read of the bucket
-- for anon/authenticated -- so compare as text instead, matching the
-- brief's original text-to-text comparison, which never had this failure
-- mode.
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

-- Postgres grants EXECUTE to PUBLIC on every new function by default, so the
-- grant below alone would not narrow anything -- revoke first, same pattern
-- as private.is_admin() in 20260813054534_profiles.sql.
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
