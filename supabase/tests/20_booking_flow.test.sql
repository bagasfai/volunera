-- supabase/tests/20_booking_flow.test.sql
begin;
select plan(14);

select has_function(
  'public', 'book_tutor_session',
  array['uuid', 'timestamptz', 'uuid', 'uuid', 'topic_category', 'text'],
  'book_tutor_session() exists'
);

insert into public.tutor_availability (tutor_id, weekday, start_time, end_time)
values (
  '44444444-4444-4444-4444-444444444444',
  extract(dow from date '2026-09-01')::smallint,
  '09:00', '11:00'
);

-- 2026-09-01 09:00 America/Los_Angeles == 16:00 UTC (PDT). 13:00 local that
-- same day falls outside the 09:00-11:00 window.

savepoint s1;
select tests.authenticate_as('11111111-1111-1111-1111-111111111111'); -- student Ada

select is(
  (select count(*)::int from public.book_tutor_session(
    '44444444-4444-4444-4444-444444444444',
    ('2026-09-01 09:00'::timestamp at time zone 'America/Los_Angeles'),
    (select id from public.subjects where label = 'Algebra I'),
    (select id from public.grade_levels where label = 'Fixture Active Grade'),
    'homework'::public.topic_category,
    'Fractions'
  )),
  1,
  'booking a real open slot succeeds'
);

select is(
  (select end_time - start_time from public.bookings
    where tutor_id = '44444444-4444-4444-4444-444444444444'),
  interval '45 minutes',
  'the booked session is exactly 45 minutes'
);

select is(
  (select student_id from public.bookings
    where tutor_id = '44444444-4444-4444-4444-444444444444'),
  '11111111-1111-1111-1111-111111111111'::uuid,
  'student_id is the caller, taken from auth.uid(), not a parameter'
);

-- Empirically verified (2026-08-17): now that bookings_insert_own checks
-- private.slot_is_bookable(), a second row for an already-booked slot is
-- rejected by RLS's WITH CHECK (42501) before the request ever reaches the
-- unique index (23505) or the exclusion constraint (23P01) below -- because
-- this test runs sequentially, the first booking is already visible when
-- the second insert's slot_is_bookable() check runs. The unique index and
-- exclusion constraint still matter for a genuine concurrent race (two
-- transactions whose slot_is_bookable() reads both see the slot as free
-- before either commits), which this single-connection pgTAP suite cannot
-- exercise.
select throws_ok(
  $$insert into public.bookings (
      tutor_id, student_id, start_time, end_time,
      subject_id, grade_level_id, topic_category, topic
    )
    select
      '44444444-4444-4444-4444-444444444444',
      '11111111-1111-1111-1111-111111111111',
      ('2026-09-01 09:00'::timestamp at time zone 'America/Los_Angeles'),
      ('2026-09-01 09:45'::timestamp at time zone 'America/Los_Angeles'),
      id, (select id from public.grade_levels where label = 'Fixture Active Grade'),
      'homework'::public.topic_category, 'Duplicate attempt'
    from public.subjects where label = 'Algebra I'$$,
  '42501',
  null,
  'a second row for the exact same tutor and start time is rejected by the hardened RLS policy, even bypassing the RPC'
);

-- Same reasoning as above: an overlapping-but-not-identical start_time
-- (09:30-10:15 overlaps the 09:00-09:45 booking from subtest 2) is also
-- caught by slot_is_bookable() at the RLS layer (42501), not by the
-- bookings_no_overlap exclusion constraint (23P01) -- the latter only
-- fires for a race the RLS read can't see yet.
select throws_ok(
  $$insert into public.bookings (
      tutor_id, student_id, start_time, end_time,
      subject_id, grade_level_id, topic_category, topic
    )
    select
      '44444444-4444-4444-4444-444444444444',
      '11111111-1111-1111-1111-111111111111',
      ('2026-09-01 09:30'::timestamp at time zone 'America/Los_Angeles'),
      ('2026-09-01 10:15'::timestamp at time zone 'America/Los_Angeles'),
      id, (select id from public.grade_levels where label = 'Fixture Active Grade'),
      'homework'::public.topic_category, 'Overlap attempt'
    from public.subjects where label = 'Algebra I'$$,
  '42501',
  null,
  'a row overlapping (but not exactly matching) an already-booked slot is also rejected by the hardened RLS policy'
);

select throws_ok(
  $$select * from public.book_tutor_session(
    '44444444-4444-4444-4444-444444444444',
    ('2026-09-01 13:00'::timestamp at time zone 'America/Los_Angeles'),
    (select id from public.subjects where label = 'Algebra I'),
    (select id from public.grade_levels where label = 'Fixture Active Grade'),
    'homework'::public.topic_category,
    'Fractions'
  )$$,
  '23514',
  null,
  'a start time outside the tutor''s available windows is rejected'
);

select throws_ok(
  $$select * from public.book_tutor_session(
    '44444444-4444-4444-4444-444444444444',
    ('2020-01-01 09:00'::timestamp at time zone 'America/Los_Angeles'),
    (select id from public.subjects where label = 'Algebra I'),
    (select id from public.grade_levels where label = 'Fixture Active Grade'),
    'homework'::public.topic_category,
    'Fractions'
  )$$,
  '23514',
  null,
  'a start time in the past is rejected'
);

select throws_ok(
  $$select * from public.book_tutor_session(
    '33333333-3333-3333-3333-333333333333',
    ('2026-09-01 09:00'::timestamp at time zone 'America/Denver'),
    (select id from public.subjects where label = 'Algebra I'),
    (select id from public.grade_levels where label = 'Fixture Active Grade'),
    'homework'::public.topic_category,
    'Fractions'
  )$$,
  'P0002',
  null,
  'a pending (not approved) tutor cannot be booked'
);

select is(
  (select count(*)::int from public.bookings
    where student_id = '11111111-1111-1111-1111-111111111111'),
  1,
  'the student can select their own booking'
);
reset role;
release savepoint s1;

savepoint s2;
select tests.authenticate_as('22222222-2222-2222-2222-222222222222'); -- student Ben
select is(
  (select count(*)::int from public.bookings
    where student_id = '11111111-1111-1111-1111-111111111111'),
  0,
  'a different student cannot see the first student''s booking'
);
select throws_ok(
  $$insert into public.bookings (
      tutor_id, student_id, start_time, end_time,
      subject_id, grade_level_id, topic_category, topic
    )
    select
      '44444444-4444-4444-4444-444444444444',
      '11111111-1111-1111-1111-111111111111',
      ('2026-09-02 09:00'::timestamp at time zone 'America/Los_Angeles'),
      ('2026-09-02 09:45'::timestamp at time zone 'America/Los_Angeles'),
      id, (select id from public.grade_levels where label = 'Fixture Active Grade'),
      'homework'::public.topic_category, 'Algebra'
    from public.subjects where label = 'Algebra I'$$,
  '42501',
  null,
  'a student cannot insert a booking under another student''s id, even bypassing the RPC'
);
reset role;
release savepoint s2;

savepoint s3;
select tests.authenticate_as('44444444-4444-4444-4444-444444444444'); -- the tutor
select is(
  (select count(*)::int from public.bookings
    where tutor_id = '44444444-4444-4444-4444-444444444444'),
  1,
  'the tutor can still see bookings where they are the tutor (existing policy unaffected)'
);
reset role;
release savepoint s3;

savepoint s4;
select tests.authenticate_as_anon();
select throws_ok(
  $$select * from public.book_tutor_session(
    '44444444-4444-4444-4444-444444444444',
    ('2026-09-03 09:00'::timestamp at time zone 'America/Los_Angeles'),
    (select id from public.subjects where label = 'Algebra I'),
    (select id from public.grade_levels where label = 'Fixture Active Grade'),
    'homework'::public.topic_category,
    'Fractions'
  )$$,
  '42501',
  null,
  'anon has no execute grant on book_tutor_session'
);
reset role;
release savepoint s4;

select * from finish();
rollback;
