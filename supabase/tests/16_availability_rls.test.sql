-- supabase/tests/16_availability_rls.test.sql
begin;
select plan(25);

-- tutor_availability ---------------------------------------------------

savepoint s1;
select tests.authenticate_as('33333333-3333-3333-3333-333333333333'); -- pending tutor
select lives_ok(
  $$insert into public.tutor_availability (tutor_id, weekday, start_time, end_time)
    values ('33333333-3333-3333-3333-333333333333', 1, '09:00', '11:00')$$,
  'a tutor can insert their own availability window'
);
select is(
  (select count(*)::int from public.tutor_availability
    where tutor_id = '33333333-3333-3333-3333-333333333333'),
  1,
  'the tutor sees their own inserted window'
);
reset role;
release savepoint s1;

savepoint s2;
select tests.authenticate_as('44444444-4444-4444-4444-444444444444'); -- approved tutor
select is(
  (select count(*)::int from public.tutor_availability
    where tutor_id = '33333333-3333-3333-3333-333333333333'),
  0,
  'a different tutor cannot see the first tutor''s availability window'
);
select throws_ok(
  $$insert into public.tutor_availability (tutor_id, weekday, start_time, end_time)
    values ('33333333-3333-3333-3333-333333333333', 2, '09:00', '11:00')$$,
  '42501',
  null,
  'a tutor cannot insert an availability window under another tutor''s id'
);
reset role;
release savepoint s2;

savepoint s3;
select tests.authenticate_as_anon();
select throws_ok(
  'select count(*) from public.tutor_availability',
  '42501',
  null,
  'anon is refused at the grant layer on tutor_availability'
);
reset role;
release savepoint s3;

savepoint s4;
select tests.authenticate_as('55555555-5555-5555-5555-555555555555'); -- admin
select is(
  (select count(*)::int from public.tutor_availability
    where tutor_id = '33333333-3333-3333-3333-333333333333'),
  1,
  'an admin sees the pending tutor''s availability window'
);
reset role;
release savepoint s4;

savepoint s5;
select tests.authenticate_as('33333333-3333-3333-3333-333333333333');
update public.tutor_availability
  set end_time = '12:00'
  where tutor_id = '33333333-3333-3333-3333-333333333333';
select is(
  (select end_time::text from public.tutor_availability
    where tutor_id = '33333333-3333-3333-3333-333333333333'),
  '12:00:00',
  'a tutor can update their own availability window'
);
delete from public.tutor_availability
  where tutor_id = '33333333-3333-3333-3333-333333333333';
select is(
  (select count(*)::int from public.tutor_availability
    where tutor_id = '33333333-3333-3333-3333-333333333333'),
  0,
  'a tutor can delete their own availability window'
);
reset role;
release savepoint s5;

-- tutor_availability_exceptions -----------------------------------------

savepoint s6;
select tests.authenticate_as('33333333-3333-3333-3333-333333333333');
select lives_ok(
  $$insert into public.tutor_availability_exceptions (tutor_id, exception_date)
    values ('33333333-3333-3333-3333-333333333333', '2026-09-10')$$,
  'a tutor can insert their own exception date'
);
select is(
  (select count(*)::int from public.tutor_availability_exceptions
    where tutor_id = '33333333-3333-3333-3333-333333333333'),
  1,
  'the tutor sees their own inserted exception'
);
reset role;
release savepoint s6;

savepoint s7;
select tests.authenticate_as('44444444-4444-4444-4444-444444444444');
select is(
  (select count(*)::int from public.tutor_availability_exceptions
    where tutor_id = '33333333-3333-3333-3333-333333333333'),
  0,
  'a different tutor cannot see the first tutor''s exception'
);
select throws_ok(
  $$insert into public.tutor_availability_exceptions (tutor_id, exception_date)
    values ('33333333-3333-3333-3333-333333333333', '2026-09-11')$$,
  '42501',
  null,
  'a tutor cannot insert an exception under another tutor''s id'
);
reset role;
release savepoint s7;

savepoint s8;
select tests.authenticate_as_anon();
select throws_ok(
  'select count(*) from public.tutor_availability_exceptions',
  '42501',
  null,
  'anon is refused at the grant layer on tutor_availability_exceptions'
);
reset role;
release savepoint s8;

savepoint s9;
select tests.authenticate_as('55555555-5555-5555-5555-555555555555');
select is(
  (select count(*)::int from public.tutor_availability_exceptions
    where tutor_id = '33333333-3333-3333-3333-333333333333'),
  1,
  'an admin sees the pending tutor''s exception'
);
reset role;
release savepoint s9;

savepoint s10;
select tests.authenticate_as('33333333-3333-3333-3333-333333333333');
delete from public.tutor_availability_exceptions
  where tutor_id = '33333333-3333-3333-3333-333333333333';
select is(
  (select count(*)::int from public.tutor_availability_exceptions
    where tutor_id = '33333333-3333-3333-3333-333333333333'),
  0,
  'a tutor can delete their own exception'
);
reset role;
release savepoint s10;

-- bookings — SELECT for everyone with visibility, INSERT only via the
-- hardened bookings_insert_own policy (see migration 21) --------------------

insert into public.bookings (
    tutor_id, student_id, start_time, end_time, status,
    subject_id, grade_level_id, topic_category, topic
  )
values (
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  '2026-09-15 16:00+00', '2026-09-15 16:45+00',
  'confirmed',
  (select id from public.subjects where label = 'Algebra I'),
  (select id from public.grade_levels where label = 'Fixture Active Grade'),
  'homework', 'Fixture booking'
);

savepoint s11;
select tests.authenticate_as('44444444-4444-4444-4444-444444444444');
select is(
  (select count(*)::int from public.bookings
    where tutor_id = '44444444-4444-4444-4444-444444444444'),
  1,
  'a tutor sees their own booking'
);
reset role;
release savepoint s11;

savepoint s12;
select tests.authenticate_as('33333333-3333-3333-3333-333333333333');
select is(
  (select count(*)::int from public.bookings),
  0,
  'a different tutor cannot see the first tutor''s booking'
);
reset role;
release savepoint s12;

savepoint s13;
select tests.authenticate_as_anon();
select throws_ok(
  'select count(*) from public.bookings',
  '42501',
  null,
  'anon is refused at the grant layer on bookings'
);
reset role;
release savepoint s13;

savepoint s14;
select tests.authenticate_as('55555555-5555-5555-5555-555555555555');
select is(
  (select count(*)::int from public.bookings
    where tutor_id = '44444444-4444-4444-4444-444444444444'),
  1,
  'an admin sees the booking'
);
reset role;
release savepoint s14;

savepoint s15;
select tests.authenticate_as('44444444-4444-4444-4444-444444444444');
select throws_ok(
  $$insert into public.bookings (tutor_id, student_id, start_time, end_time)
    values ('44444444-4444-4444-4444-444444444444',
      '11111111-1111-1111-1111-111111111111',
      '2026-09-16 16:00+00', '2026-09-16 16:45+00')$$,
  '42501',
  null,
  'a tutor cannot insert a booking directly -- migration 21 does grant INSERT to authenticated now, but bookings_insert_own rejects this: the tutor does not match student_id (and wouldn''t satisfy the policy''s other conditions either)'
);
select throws_ok(
  $$update public.bookings set status = 'canceled'
    where tutor_id = '44444444-4444-4444-4444-444444444444'$$,
  '42501',
  null,
  'a tutor cannot update a booking directly -- no grant exists this phase'
);
select throws_ok(
  $$delete from public.bookings
    where tutor_id = '44444444-4444-4444-4444-444444444444'$$,
  '42501',
  null,
  'a tutor cannot delete a booking directly -- no grant exists this phase'
);
reset role;
release savepoint s15;

-- Final-review additions: cross-tutor UPDATE/DELETE no-ops and the overlap
-- trigger firing under the `authenticated` role (not just superuser, which
-- bypasses RLS). Mirrors the no-op assertion pattern from Phase 2's
-- 10_tutor_join_tables_rls.test.sql:189-215.

insert into public.tutor_availability (tutor_id, weekday, start_time, end_time)
values ('33333333-3333-3333-3333-333333333333', 3, '09:00', '10:00');

savepoint s16;
select tests.authenticate_as('44444444-4444-4444-4444-444444444444'); -- a different tutor
update public.tutor_availability
  set end_time = '23:00'
  where tutor_id = '33333333-3333-3333-3333-333333333333' and weekday = 3;
reset role;
select is(
  (select end_time::text from public.tutor_availability
    where tutor_id = '33333333-3333-3333-3333-333333333333' and weekday = 3),
  '10:00:00',
  'a different tutor''s UPDATE on another tutor''s availability window is a silent no-op'
);
release savepoint s16;

savepoint s17;
select tests.authenticate_as('44444444-4444-4444-4444-444444444444');
delete from public.tutor_availability
  where tutor_id = '33333333-3333-3333-3333-333333333333' and weekday = 3;
reset role;
select is(
  (select count(*)::int from public.tutor_availability
    where tutor_id = '33333333-3333-3333-3333-333333333333' and weekday = 3),
  1,
  'a different tutor''s DELETE on another tutor''s availability window is a silent no-op'
);
release savepoint s17;

savepoint s18;
select tests.authenticate_as('33333333-3333-3333-3333-333333333333'); -- the owner
select throws_ok(
  $$insert into public.tutor_availability (tutor_id, weekday, start_time, end_time)
    values ('33333333-3333-3333-3333-333333333333', 3, '09:30', '10:30')$$,
  '23P01',
  null,
  'the overlap trigger rejects an overlapping window under the authenticated role, not just as superuser'
);
reset role;
release savepoint s18;

select * from finish();
rollback;
