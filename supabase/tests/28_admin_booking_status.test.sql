-- supabase/tests/28_admin_booking_status.test.sql
begin;
select plan(10);

-- Four bookings for the approved tutor (Dev) with student Ada, inserted as
-- postgres so RLS does not apply here:
--   001 - past, confirmed -> the admin marks it no_show
--   002 - past, confirmed -> the admin marks it completed
--   003 - future, confirmed -> the admin cancels it, then re-confirms it
--   004 - future, confirmed -> a non-admin tries (and fails) to mark it no_show
insert into public.bookings (
  id, tutor_id, student_id, start_time, end_time,
  subject_id, grade_level_id, topic_category, topic, status
) values (
  'dddddddd-0000-0000-0000-000000000001',
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  now() - interval '2 days', now() - interval '2 days' + interval '45 minutes',
  (select id from public.subjects where label = 'Algebra I'),
  (select id from public.grade_levels where label = 'Fixture Active Grade'),
  'homework', 'Phantom session', 'confirmed'
), (
  'dddddddd-0000-0000-0000-000000000002',
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  now() - interval '3 days', now() - interval '3 days' + interval '45 minutes',
  (select id from public.subjects where label = 'Algebra I'),
  (select id from public.grade_levels where label = 'Fixture Active Grade'),
  'homework', 'Actually happened', 'confirmed'
), (
  'dddddddd-0000-0000-0000-000000000003',
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  now() + interval '5 days', now() + interval '5 days' + interval '45 minutes',
  (select id from public.subjects where label = 'Algebra I'),
  (select id from public.grade_levels where label = 'Fixture Active Grade'),
  'homework', 'Cancel then re-confirm', 'confirmed'
), (
  'dddddddd-0000-0000-0000-000000000004',
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  now() + interval '6 days', now() + interval '6 days' + interval '45 minutes',
  (select id from public.subjects where label = 'Algebra I'),
  (select id from public.grade_levels where label = 'Fixture Active Grade'),
  'homework', 'Not this admin''s call to make', 'confirmed'
);

savepoint s1;
select tests.authenticate_as('55555555-5555-5555-5555-555555555555'); -- admin Eve

update public.bookings set status = 'no_show'
  where id = 'dddddddd-0000-0000-0000-000000000001';
select is(
  (select status::text from public.bookings
    where id = 'dddddddd-0000-0000-0000-000000000001'),
  'no_show',
  'an admin can mark a phantom past booking no_show'
);

update public.bookings set status = 'completed'
  where id = 'dddddddd-0000-0000-0000-000000000002';
select is(
  (select status::text from public.bookings
    where id = 'dddddddd-0000-0000-0000-000000000002'),
  'completed',
  'an admin can mark a past booking completed'
);

update public.bookings set status = 'canceled'
  where id = 'dddddddd-0000-0000-0000-000000000003';
select is(
  (select status::text from public.bookings
    where id = 'dddddddd-0000-0000-0000-000000000003'),
  'canceled',
  'an admin can cancel a future booking'
);
select isnt(
  (select canceled_at from public.bookings
    where id = 'dddddddd-0000-0000-0000-000000000003'),
  null,
  'canceling stamps canceled_at'
);
select is(
  (select canceled_by from public.bookings
    where id = 'dddddddd-0000-0000-0000-000000000003'),
  '55555555-5555-5555-5555-555555555555'::uuid,
  'canceling stamps canceled_by with the admin who did it'
);

update public.bookings set status = 'confirmed'
  where id = 'dddddddd-0000-0000-0000-000000000003';
select is(
  (select status::text from public.bookings
    where id = 'dddddddd-0000-0000-0000-000000000003'),
  'confirmed',
  'an admin can re-confirm a canceled booking'
);
select is(
  (select canceled_at from public.bookings
    where id = 'dddddddd-0000-0000-0000-000000000003'),
  null,
  'un-canceling clears canceled_at, so no stale cancellation audit data survives'
);
select is(
  (select canceled_by from public.bookings
    where id = 'dddddddd-0000-0000-0000-000000000003'),
  null,
  'un-canceling clears canceled_by too'
);

reset role;
release savepoint s1;

savepoint s2;
select tests.authenticate_as('11111111-1111-1111-1111-111111111111'); -- student Ada
select throws_ok(
  $$update public.bookings set status = 'no_show'
    where id = 'dddddddd-0000-0000-0000-000000000004'$$,
  'P0001',
  null,
  'a non-admin cannot mark a booking no_show'
);
reset role;
release savepoint s2;

savepoint s3;
select tests.authenticate_as('44444444-4444-4444-4444-444444444444'); -- the tutor
-- Only booking 002 (completed, past) counts. Booking 001 is excluded because
-- it is no_show; bookings 003 and 004 are excluded because they are future.
select is(
  (select completed_minutes from public.tutor_volunteer_hours
    where tutor_id = '44444444-4444-4444-4444-444444444444'),
  45,
  'a no_show booking is excluded from completed_minutes while a completed one is included'
);
reset role;
release savepoint s3;

select * from finish();
rollback;
