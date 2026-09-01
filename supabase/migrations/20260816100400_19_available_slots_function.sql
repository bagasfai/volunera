create function public.get_tutor_available_slots(
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

revoke execute on function public.get_tutor_available_slots(uuid, date, date)
  from public, anon;
grant execute on function public.get_tutor_available_slots(uuid, date, date)
  to authenticated;
