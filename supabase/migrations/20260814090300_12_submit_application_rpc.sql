-- supabase/migrations/20260814090300_12_submit_application_rpc.sql

-- Phase 2 amendment: submit_tutor_application() is the one legitimate path
-- that must write application_status/reviewed_at/reviewed_by as the tutor
-- themselves (flipping back to 'pending' on submit/resubmit). SECURITY
-- DEFINER elevates SQL privilege but does not change what auth.uid() /
-- private.is_admin() report, so without this the trigger silently reverted
-- the RPC's own UPDATE. A transaction-local GUC is the narrow escape hatch:
-- scoped to exactly this transaction (no risk to concurrent sessions,
-- unlike disabling the trigger table-wide), and set only by the RPC below.
-- Not reachable by a client directly — PostgREST exposes only table CRUD
-- and named RPCs, never set_config as a callable endpoint.
create or replace function public.protect_tutor_application_columns()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.profile_id := old.profile_id;
  new.created_at := old.created_at;
  if not private.is_admin()
     and coalesce(current_setting('app.bypass_tutor_application_protect', true), '') <> 'on'
  then
    new.application_status := old.application_status;
    new.reviewed_at := old.reviewed_at;
    new.reviewed_by := old.reviewed_by;
  end if;
  return new;
end;
$$;

-- The only path that writes application_status back to 'pending'. It can
-- never write 'approved' — that is only ever set by an admin's direct
-- UPDATE, which is what makes "approving is the only way to approve" true
-- by construction. protect_tutor_application_columns() has a narrow,
-- transaction-scoped exception (above) that lets this specific UPDATE
-- through; the bypass is opened only after the state-machine guard above
-- has already refused any non-pending/rejected tutor, and closed again
-- immediately after the UPDATE.
create function public.submit_tutor_application(
  p_bio text,
  p_motivation text,
  p_prior_experience text,
  p_phone text,
  p_date_of_birth date,
  p_education_status text,
  p_languages text[],
  p_teaching_style_tags text[],
  p_photo_url text,
  p_grade_level_ids uuid[],
  p_subject_ids uuid[]
)
returns public.tutor_profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_status public.tutor_application_status;
  v_result public.tutor_profiles;
begin
  if v_uid is null then
    raise exception 'not authenticated'
      using errcode = '28000';
  end if;

  select application_status into v_status
    from public.tutor_profiles
    where profile_id = v_uid
    for update;

  if not found then
    raise exception 'no tutor application exists for this user'
      using errcode = 'P0002';
  end if;

  if v_status not in ('pending', 'rejected') then
    raise exception 'an application in status % cannot be submitted', v_status
      using errcode = '42501';
  end if;

  if p_grade_level_ids is null or array_length(p_grade_level_ids, 1) is null then
    raise exception 'at least one grade level must be selected'
      using errcode = '23514';
  end if;

  if p_subject_ids is null or array_length(p_subject_ids, 1) is null then
    raise exception 'at least one subject must be selected'
      using errcode = '23514';
  end if;

  perform set_config('app.bypass_tutor_application_protect', 'on', true);

  update public.tutor_profiles set
    bio = p_bio,
    motivation = p_motivation,
    prior_experience = p_prior_experience,
    phone = p_phone,
    date_of_birth = p_date_of_birth,
    education_status = p_education_status,
    languages = p_languages,
    teaching_style_tags = p_teaching_style_tags,
    photo_url = p_photo_url,
    application_status = 'pending',
    application_submitted_at = now(),
    reviewed_at = null,
    reviewed_by = null
  where profile_id = v_uid
  returning * into v_result;

  perform set_config('app.bypass_tutor_application_protect', 'off', true);

  delete from public.tutor_grade_levels where tutor_id = v_uid;
  insert into public.tutor_grade_levels (tutor_id, grade_level_id)
    select v_uid, gl_id from unnest(p_grade_level_ids) as gl_id;

  delete from public.tutor_subjects where tutor_id = v_uid;
  insert into public.tutor_subjects (tutor_id, subject_id)
    select v_uid, s_id from unnest(p_subject_ids) as s_id;

  return v_result;
end;
$$;

revoke execute on function public.submit_tutor_application(
  text, text, text, text, date, text, text[], text[], text, uuid[], uuid[]
) from public, anon;

grant execute on function public.submit_tutor_application(
  text, text, text, text, date, text, text[], text[], text, uuid[], uuid[]
) to authenticated;
