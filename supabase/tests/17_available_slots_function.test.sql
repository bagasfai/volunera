begin;
select plan(13);

select has_function(
  'public', 'get_tutor_available_slots',
  array['uuid', 'date', 'date'],
  'get_tutor_available_slots() exists'
);

insert into public.tutor_availability (tutor_id, weekday, start_time, end_time)
values (
  '44444444-4444-4444-4444-444444444444',
  extract(dow from date '2026-08-16')::smallint,
  '09:00', '11:00'
);

select tests.authenticate_as('44444444-4444-4444-4444-444444444444');

select is(
  (select count(*)::int from public.get_tutor_available_slots(
    '44444444-4444-4444-4444-444444444444', '2026-08-16', '2026-08-16')),
  1,
  'one recurring window with no exceptions or bookings produces one free slot'
);

select is(
  (select slot_start = ('2026-08-16 09:00'::timestamp at time zone 'America/Los_Angeles')
    and slot_end = ('2026-08-16 11:00'::timestamp at time zone 'America/Los_Angeles')
   from public.get_tutor_available_slots(
      '44444444-4444-4444-4444-444444444444', '2026-08-16', '2026-08-16')),
  true,
  'the slot converts the tutor''s local time to the correct UTC instant'
);

select is(
  (select extract(hour from slot_start at time zone 'UTC')::int
   from public.get_tutor_available_slots(
      '44444444-4444-4444-4444-444444444444', '2026-03-01', '2026-03-01')),
  17,
  'the Sunday before spring-forward is UTC-8 (PST): 09:00 local = 17:00 UTC'
);

select is(
  (select extract(hour from slot_start at time zone 'UTC')::int
   from public.get_tutor_available_slots(
      '44444444-4444-4444-4444-444444444444', '2026-03-08', '2026-03-08')),
  16,
  'spring-forward Sunday is already UTC-7 (PDT): 09:00 local = 16:00 UTC'
);

select is(
  (select extract(hour from slot_start at time zone 'UTC')::int
   from public.get_tutor_available_slots(
      '44444444-4444-4444-4444-444444444444', '2026-10-25', '2026-10-25')),
  16,
  'the Sunday before fall-back is UTC-7 (PDT): 09:00 local = 16:00 UTC'
);

select is(
  (select extract(hour from slot_start at time zone 'UTC')::int
   from public.get_tutor_available_slots(
      '44444444-4444-4444-4444-444444444444', '2026-11-01', '2026-11-01')),
  17,
  'fall-back Sunday is back to UTC-8 (PST): 09:00 local = 17:00 UTC'
);

reset role;

insert into public.tutor_availability_exceptions (tutor_id, exception_date)
values ('44444444-4444-4444-4444-444444444444', '2026-08-16');

select tests.authenticate_as('44444444-4444-4444-4444-444444444444');
select is(
  (select count(*)::int from public.get_tutor_available_slots(
    '44444444-4444-4444-4444-444444444444', '2026-08-16', '2026-08-16')),
  0,
  'an exception date removes that date''s window from the output'
);
reset role;

select tests.authenticate_as('44444444-4444-4444-4444-444444444444');
select is(
  (select count(*)::int from public.get_tutor_available_slots(
    '44444444-4444-4444-4444-444444444444', '2026-08-23', '2026-08-23')),
  1,
  'a different date is unaffected by another date''s exception'
);
reset role;

insert into public.bookings (
    tutor_id, student_id, start_time, end_time, status,
    subject_id, grade_level_id, topic_category, topic
  )
values (
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  '2026-08-23 09:45-07', '2026-08-23 10:15-07',
  'confirmed',
  (select id from public.subjects where label = 'Algebra I'),
  (select id from public.grade_levels where label = 'Fixture Active Grade'),
  'homework', 'Fixture booking'
);

select tests.authenticate_as('44444444-4444-4444-4444-444444444444');
select is(
  (select count(*)::int from public.get_tutor_available_slots(
    '44444444-4444-4444-4444-444444444444', '2026-08-23', '2026-08-23')),
  2,
  'a booking in the middle of a window splits it into two remaining gaps'
);
reset role;

insert into public.bookings (
    tutor_id, student_id, start_time, end_time, status,
    subject_id, grade_level_id, topic_category, topic
  )
values (
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  '2026-08-30 09:00-07', '2026-08-30 11:00-07',
  'confirmed',
  (select id from public.subjects where label = 'Algebra I'),
  (select id from public.grade_levels where label = 'Fixture Active Grade'),
  'homework', 'Fixture booking'
);

select tests.authenticate_as('44444444-4444-4444-4444-444444444444');
select is(
  (select count(*)::int from public.get_tutor_available_slots(
    '44444444-4444-4444-4444-444444444444', '2026-08-30', '2026-08-30')),
  0,
  'a booking covering the entire window removes it entirely'
);
reset role;

-- Final-review additions: RPC-level isolation -- the entire justification
-- for SECURITY INVOKER (spec section 5) had no direct assertion. At this
-- point in the file, 2026-08-23 has the mid-window booking from the split
-- test above, so the owner's own result there is 2 rows.

select tests.authenticate_as('33333333-3333-3333-3333-333333333333'); -- a different tutor
select is(
  (select count(*)::int from public.get_tutor_available_slots(
    '44444444-4444-4444-4444-444444444444', '2026-08-23', '2026-08-23')),
  0,
  'a different tutor calling get_tutor_available_slots for someone else sees 0 rows'
);
reset role;

select tests.authenticate_as('55555555-5555-5555-5555-555555555555'); -- admin
select is(
  (select count(*)::int from public.get_tutor_available_slots(
    '44444444-4444-4444-4444-444444444444', '2026-08-23', '2026-08-23')),
  2,
  'an admin calling get_tutor_available_slots for a tutor sees that tutor''s real slots'
);
reset role;

select * from finish();
rollback;
