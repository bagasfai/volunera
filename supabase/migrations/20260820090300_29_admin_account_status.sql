alter table public.tutor_profiles
  add column application_status_prior public.tutor_application_status;

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
    new.application_status_prior := old.application_status_prior;
    new.reviewed_at := old.reviewed_at;
    new.reviewed_by := old.reviewed_by;
  end if;
  return new;
end;
$$;

create function public.admin_set_account_status(
  p_profile_id uuid,
  p_status public.account_status
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role public.user_role;
  v_current public.tutor_application_status;
  v_prior public.tutor_application_status;
  v_profile public.profiles;
begin
  if not private.is_admin() then
    raise exception 'only an admin may change account status'
      using errcode = '42501';
  end if;

  if p_profile_id = (select auth.uid()) then
    raise exception 'an admin cannot change their own account status'
      using errcode = 'P0001';
  end if;

  select role into v_role from public.profiles where id = p_profile_id;
  if v_role is null then
    raise exception 'no such profile' using errcode = 'P0002';
  end if;

  update public.profiles
  set status = p_status
  where id = p_profile_id
  returning * into v_profile;

  if v_role = 'tutor' then
    select application_status, application_status_prior
      into v_current, v_prior
    from public.tutor_profiles
    where profile_id = p_profile_id;

    if p_status = 'active' then
      if v_current in ('suspended', 'inactive') then
        update public.tutor_profiles
        set application_status = coalesce(v_prior, 'pending'),
            application_status_prior = null
        where profile_id = p_profile_id;
      end if;
    else
      update public.tutor_profiles
      set application_status_prior = case
            when v_current in ('suspended', 'inactive') then v_prior
            else v_current
          end,
          application_status = case
            when p_status = 'suspended' then 'suspended'::public.tutor_application_status
            else 'inactive'::public.tutor_application_status
          end
      where profile_id = p_profile_id;

      update public.bookings
      set status = 'canceled'
      where tutor_id = p_profile_id
        and status = 'confirmed'
        and start_time > now();
    end if;
  end if;

  return v_profile;
end;
$$;

revoke execute on function public.admin_set_account_status(
  uuid, public.account_status
) from public, anon;
grant execute on function public.admin_set_account_status(
  uuid, public.account_status
) to authenticated;
