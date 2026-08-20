-- supabase/tests/23_booking_cancellation.test.sql
begin;
select plan(13);

select has_column('public', 'bookings', 'canceled_at', 'bookings.canceled_at exists');
select has_column('public', 'bookings', 'canceled_by', 'bookings.canceled_by exists');

-- Two bookings for the approved tutor (Dev) with student Ada: one in the
-- future, one already past. Inserted as postgres, so RLS does not apply here.
insert into public.bookings (
  id, tutor_id, student_id, start_time, end_time,
  subject_id, grade_level_id, topic_category, topic
) values (
  'aaaaaaaa-0000-0000-0000-000000000001',
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  now() + interval '7 days', now() + interval '7 days' + interval '45 minutes',
  (select id from public.subjects where label = 'Algebra I'),
  (select id from public.grade_levels where label = 'Fixture Active Grade'),
  'homework', 'Future session'
), (
  'aaaaaaaa-0000-0000-0000-000000000002',
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  now() - interval '7 days', now() - interval '7 days' + interval '45 minutes',
  (select id from public.subjects where label = 'Algebra I'),
  (select id from public.grade_levels where label = 'Fixture Active Grade'),
  'homework', 'Past session'
);

savepoint s1;
select tests.authenticate_as('22222222-2222-2222-2222-222222222222'); -- student Ben
update public.bookings set status = 'canceled'
  where id = 'aaaaaaaa-0000-0000-0000-000000000001';
reset role;
select is(
  (select status::text from public.bookings
    where id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  'confirmed',
  'an unrelated student cannot cancel someone else''s booking'
);
release savepoint s1;

savepoint s2;
select tests.authenticate_as('11111111-1111-1111-1111-111111111111'); -- student Ada
select throws_ok(
  $$update public.bookings set status = 'canceled'
    where id = 'aaaaaaaa-0000-0000-0000-000000000002'$$,
  'P0001',
  null,
  'a booking that has already started cannot be canceled'
);
select throws_ok(
  $$update public.bookings set status = 'completed'
    where id = 'aaaaaaaa-0000-0000-0000-000000000001'$$,
  'P0001',
  null,
  'a non-admin may only move a booking to canceled, never to completed'
);
select throws_ok(
  $$update public.bookings set topic = 'rewritten'
    where id = 'aaaaaaaa-0000-0000-0000-000000000001'$$,
  '42501',
  null,
  'a non-admin has no update grant on any column but status'
);
update public.bookings set status = 'canceled'
  where id = 'aaaaaaaa-0000-0000-0000-000000000001';
reset role;
select is(
  (select status::text from public.bookings
    where id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  'canceled',
  'the student who owns the booking can cancel it'
);
select is(
  (select canceled_by from public.bookings
    where id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  '11111111-1111-1111-1111-111111111111'::uuid,
  'canceled_by is stamped with the caller, not supplied by the client'
);
select isnt(
  (select canceled_at from public.bookings
    where id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  null,
  'canceled_at is stamped by the trigger'
);
-- Roll back the cancellation made in this block so booking 1 goes into s3
-- (and s4) still 'confirmed' -- these savepoint blocks each test a fresh
-- transition against the same fixture row, not a cumulative history of it.
rollback to savepoint s2;
release savepoint s2;

savepoint s3;
select tests.authenticate_as('11111111-1111-1111-1111-111111111111');
update public.bookings set status = 'canceled'
  where id = 'aaaaaaaa-0000-0000-0000-000000000001';
select throws_ok(
  $$update public.bookings set status = 'canceled'
    where id = 'aaaaaaaa-0000-0000-0000-000000000001'$$,
  'P0001',
  null,
  'an already-canceled booking cannot be canceled again'
);
reset role;
rollback to savepoint s3;
release savepoint s3;

savepoint s4;
select tests.authenticate_as('44444444-4444-4444-4444-444444444444'); -- the tutor
update public.bookings set status = 'canceled'
  where id = 'aaaaaaaa-0000-0000-0000-000000000001';
reset role;
select is(
  (select status::text from public.bookings
    where id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  'canceled',
  'the tutor on the booking can also cancel it'
);
release savepoint s4;

savepoint s5;
select tests.authenticate_as('55555555-5555-5555-5555-555555555555'); -- admin Eve
update public.bookings set status = 'no_show'
  where id = 'aaaaaaaa-0000-0000-0000-000000000002';
reset role;
select is(
  (select status::text from public.bookings
    where id = 'aaaaaaaa-0000-0000-0000-000000000002'),
  'no_show',
  'an admin may mark a past booking no_show'
);
release savepoint s5;

savepoint s6;
select tests.authenticate_as_anon();
select throws_ok(
  $$update public.bookings set status = 'canceled'
    where id = 'aaaaaaaa-0000-0000-0000-000000000001'$$,
  '42501',
  null,
  'anon has no update grant on bookings'
);
reset role;
release savepoint s6;

select * from finish();
rollback;
