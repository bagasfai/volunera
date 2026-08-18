create function public.complete_onboarding(
  p_role public.user_role,
  p_first_name text,
  p_last_name text,
  p_timezone text
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_email text;
  v_avatar text;
  v_profile public.profiles;
begin
  if v_uid is null then
    raise exception 'not authenticated'
      using errcode = '28000';
  end if;

  if p_role = 'admin' then
    raise exception 'the admin role cannot be self-assigned'
      using errcode = '42501';
  end if;

  if exists (select 1 from public.profiles where id = v_uid) then
    raise exception 'profile already exists for this user'
      using errcode = '23505';
  end if;

  select u.email,
         nullif(u.raw_user_meta_data ->> 'avatar_url', '')
    into v_email, v_avatar
    from auth.users u
   where u.id = v_uid;

  insert into public.profiles (
    id, role, first_name, last_name, email, timezone, avatar_url
  )
  values (
    v_uid,
    p_role,
    trim(p_first_name),
    trim(p_last_name),
    v_email,
    coalesce(nullif(trim(p_timezone), ''), 'UTC'),
    v_avatar
  )
  returning * into v_profile;

  if p_role = 'student' then
    insert into public.students (profile_id) values (v_uid);
  elsif p_role = 'tutor' then
    insert into public.tutor_profiles (profile_id) values (v_uid);
  end if;

  return v_profile;
end;
$$;

revoke execute on function public.complete_onboarding(
  public.user_role, text, text, text
) from public, anon;

grant execute on function public.complete_onboarding(
  public.user_role, text, text, text
) to authenticated;
