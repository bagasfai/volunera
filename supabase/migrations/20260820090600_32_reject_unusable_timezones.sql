create or replace function public.validate_timezone()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1 from pg_catalog.pg_timezone_names
    where name = new.timezone
      and name not like 'posix/%'
      and name <> 'Factory'
  ) then
    raise exception 'invalid IANA timezone: %', new.timezone
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;
