create view public.tutor_public_profiles
  with (security_barrier = true)
as
select
  tp.profile_id as id,
  p.first_name,
  left(p.last_name, 1) as last_initial,
  tp.photo_url,
  tp.bio,
  tp.teaching_style_tags,
  tp.languages,
  coalesce(gl.grade_level_ids, array[]::uuid[]) as grade_level_ids,
  coalesce(gl.grade_level_labels, array[]::text[]) as grade_level_labels,
  coalesce(sj.subject_ids, array[]::uuid[]) as subject_ids,
  coalesce(sj.subject_labels, array[]::text[]) as subject_labels
from public.tutor_profiles tp
join public.profiles p on p.id = tp.profile_id
left join lateral (
  select
    array_agg(tgl.grade_level_id order by g.sort_order) as grade_level_ids,
    array_agg(g.label order by g.sort_order) as grade_level_labels
  from public.tutor_grade_levels tgl
  join public.grade_levels g on g.id = tgl.grade_level_id
  where tgl.tutor_id = tp.profile_id
) gl on true
left join lateral (
  select
    array_agg(ts.subject_id order by s.sort_order) as subject_ids,
    array_agg(s.label order by s.sort_order) as subject_labels
  from public.tutor_subjects ts
  join public.subjects s on s.id = ts.subject_id
  where ts.tutor_id = tp.profile_id
) sj on true
where tp.application_status = 'approved'
  and p.status = 'active';

grant select on public.tutor_public_profiles to anon, authenticated;

create function private.compute_available_slots(
  p_tutor_id uuid,
  p_range_start date,
  p_range_end date
)
returns table (slot_start timestamptz, slot_end timestamptz)
language plpgsql
stable
set search_path = ''
as $$
declare
  v_timezone text;
  v_day date;
  v_window record;
  v_local_start timestamptz;
  v_local_end timestamptz;
  v_cursor timestamptz;
  v_booking record;
begin
  select timezone into v_timezone
  from public.profiles
  where id = p_tutor_id;

  if v_timezone is null then
    return;
  end if;

  v_day := p_range_start;
  while v_day <= p_range_end loop
    if not exists (
      select 1 from public.tutor_availability_exceptions e
      where e.tutor_id = p_tutor_id and e.exception_date = v_day
    ) then
      for v_window in
        select a.start_time, a.end_time
        from public.tutor_availability a
        where a.tutor_id = p_tutor_id
          and a.weekday = extract(dow from v_day)::smallint
        order by a.start_time
      loop
        v_local_start := (v_day + v_window.start_time) at time zone v_timezone;
        v_local_end := (v_day + v_window.end_time) at time zone v_timezone;
        v_cursor := v_local_start;

        for v_booking in
          select b.start_time, b.end_time
          from public.bookings b
          where b.tutor_id = p_tutor_id
            and b.status <> 'canceled'
            and b.start_time < v_local_end
            and b.end_time > v_local_start
          order by b.start_time
        loop
          if v_booking.start_time > v_cursor then
            slot_start := v_cursor;
            slot_end := v_booking.start_time;
            return next;
          end if;
          if v_booking.end_time > v_cursor then
            v_cursor := v_booking.end_time;
          end if;
        end loop;

        if v_cursor < v_local_end then
          slot_start := v_cursor;
          slot_end := v_local_end;
          return next;
        end if;
      end loop;
    end if;

    v_day := v_day + 1;
  end loop;

  return;
end;
$$;

revoke execute on function private.compute_available_slots(uuid, date, date)
  from public, anon;
grant execute on function private.compute_available_slots(uuid, date, date)
  to authenticated;

create or replace function public.get_tutor_available_slots(
  p_tutor_id uuid,
  p_range_start date,
  p_range_end date
)
returns table (slot_start timestamptz, slot_end timestamptz)
language sql
stable
set search_path = ''
as $$
  select * from private.compute_available_slots(p_tutor_id, p_range_start, p_range_end);
$$;

create function public.get_tutor_public_available_slots(
  p_tutor_id uuid,
  p_range_start date,
  p_range_end date
)
returns table (slot_start timestamptz, slot_end timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.tutor_public_profiles where id = p_tutor_id
  ) then
    return;
  end if;

  return query
    select * from private.compute_available_slots(p_tutor_id, p_range_start, p_range_end);
end;
$$;

revoke execute on function public.get_tutor_public_available_slots(uuid, date, date)
  from public;
grant execute on function public.get_tutor_public_available_slots(uuid, date, date)
  to anon, authenticated;
