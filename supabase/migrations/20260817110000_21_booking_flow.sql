create type public.topic_category as enum (
  'homework',
  'classwork',
  'general_improvement',
  'upcoming_test',
  'organization_curriculum',
  'other'
);

alter table public.bookings
  add column student_id uuid not null
    references public.students (profile_id) on delete cascade,
  add column subject_id uuid not null
    references public.subjects (id) on delete restrict,
  add column grade_level_id uuid not null
    references public.grade_levels (id) on delete restrict,
  add column topic_category public.topic_category not null,
  add column topic text not null
    check (topic = btrim(topic) and length(topic) between 1 and 200);

create index bookings_student_id_idx on public.bookings (student_id);

create function private.slot_is_bookable(
  p_tutor_id uuid,
  p_start timestamptz,
  p_end timestamptz
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.get_tutor_public_available_slots(
      p_tutor_id, (p_start::date - 1), (p_start::date + 1)
    ) s
    where s.slot_start <= p_start and s.slot_end >= p_end
  );
$$;

revoke execute on function private.slot_is_bookable(uuid, timestamptz, timestamptz)
  from public, anon;
grant execute on function private.slot_is_bookable(uuid, timestamptz, timestamptz)
  to authenticated;

create policy bookings_insert_own
  on public.bookings
  for insert
  to authenticated
  with check (
    (select auth.uid()) = student_id
    and end_time = start_time + interval '45 minutes'
    and start_time > now()
    and private.slot_is_bookable(tutor_id, start_time, end_time)
  );

create policy bookings_select_own_student
  on public.bookings
  for select
  to authenticated
  using ((select auth.uid()) = student_id);

grant insert (
  tutor_id, student_id, start_time, end_time,
  subject_id, grade_level_id, topic_category, topic
) on public.bookings to authenticated;

-- book_tutor_session -------------------------------------------------------

create function public.book_tutor_session(
  p_tutor_id uuid,
  p_start_time timestamptz,
  p_subject_id uuid,
  p_grade_level_id uuid,
  p_topic_category public.topic_category,
  p_topic text
)
returns public.bookings
language plpgsql
set search_path = ''
as $$
declare
  v_end_time timestamptz := p_start_time + interval '45 minutes';
  v_covered boolean;
  v_booking public.bookings;
begin
  if not exists (
    select 1 from public.tutor_public_profiles where id = p_tutor_id
  ) then
    raise exception 'tutor is not available for booking'
      using errcode = 'P0002';
  end if;

  if p_start_time <= now() then
    raise exception 'that time is no longer available'
      using errcode = '23514';
  end if;

  select exists (
    select 1
    from public.get_tutor_public_available_slots(
      p_tutor_id, (p_start_time::date - 1), (p_start_time::date + 1)
    ) s
    where s.slot_start <= p_start_time and s.slot_end >= v_end_time
  ) into v_covered;

  if not v_covered then
    raise exception 'that time is no longer available'
      using errcode = '23514';
  end if;

  insert into public.bookings (
    tutor_id, student_id, start_time, end_time,
    subject_id, grade_level_id, topic_category, topic
  ) values (
    p_tutor_id, (select auth.uid()), p_start_time, v_end_time,
    p_subject_id, p_grade_level_id, p_topic_category, trim(p_topic)
  )
  returning * into v_booking;

  return v_booking;
end;
$$;

revoke execute on function public.book_tutor_session(
  uuid, timestamptz, uuid, uuid, public.topic_category, text
) from public, anon;
grant execute on function public.book_tutor_session(
  uuid, timestamptz, uuid, uuid, public.topic_category, text
) to authenticated;

create extension if not exists btree_gist;

alter table public.bookings
  add constraint bookings_no_overlap
  exclude using gist (
    tutor_id with =,
    tstzrange(start_time, end_time) with &&
  )
  where (status <> 'canceled');
