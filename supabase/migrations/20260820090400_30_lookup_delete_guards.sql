create function private.guard_lookup_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_table_name = 'subjects' then
    if exists (
      select 1 from public.bookings where subject_id = old.id
    ) then
      raise exception 'subject is referenced by existing bookings'
        using errcode = 'P0001';
    end if;
  elsif tg_table_name = 'grade_levels' then
    if exists (
      select 1 from public.bookings where grade_level_id = old.id
    ) or exists (
      select 1 from public.students where grade_level_id = old.id
    ) then
      raise exception 'grade level is referenced by existing bookings or student records'
        using errcode = 'P0001';
    end if;
  else
    raise exception 'guard_lookup_delete attached to unsupported table %', tg_table_name
      using errcode = 'P0001';
  end if;
  return old;
end;
$$;

create trigger subjects_guard_delete
  before delete on public.subjects
  for each row execute function private.guard_lookup_delete();

create trigger grade_levels_guard_delete
  before delete on public.grade_levels
  for each row execute function private.guard_lookup_delete();
