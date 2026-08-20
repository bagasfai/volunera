-- supabase/tests/25_volunteer_hours.test.sql
begin;
select plan(11);

-- Dev (approved tutor) gets one past 45-minute session that counts, one
-- canceled session that must not, and one future session that must not.
insert into public.bookings (
  id, tutor_id, student_id, start_time, end_time,
  subject_id, grade_level_id, topic_category, topic, status
) values (
  'cccccccc-0000-0000-0000-000000000001',
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  now() - interval '2 days', now() - interval '2 days' + interval '45 minutes',
  (select id from public.subjects where label = 'Algebra I'),
  (select id from public.grade_levels where label = 'Fixture Active Grade'),
  'homework', 'Counts', 'confirmed'
), (
  'cccccccc-0000-0000-0000-000000000002',
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  now() - interval '3 days', now() - interval '3 days' + interval '45 minutes',
  (select id from public.subjects where label = 'Algebra I'),
  (select id from public.grade_levels where label = 'Fixture Active Grade'),
  'homework', 'Canceled', 'canceled'
), (
  'cccccccc-0000-0000-0000-000000000003',
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  now() + interval '3 days', now() + interval '3 days' + interval '45 minutes',
  (select id from public.subjects where label = 'Algebra I'),
  (select id from public.grade_levels where label = 'Fixture Active Grade'),
  'homework', 'Future', 'confirmed'
);

select has_table('public', 'volunteer_hour_adjustments',
  'volunteer_hour_adjustments exists');
select col_type_is('public', 'volunteer_hour_adjustments', 'minutes', 'integer',
  'minutes is a signed integer, so no rounding question ever arises');

savepoint s1;
select tests.authenticate_as('55555555-5555-5555-5555-555555555555'); -- admin Eve
insert into public.volunteer_hour_adjustments (tutor_id, minutes, reason, created_by)
values ('44444444-4444-4444-4444-444444444444', 120,
        'Ran a summer workshop outside the platform',
        '55555555-5555-5555-5555-555555555555');
select is(
  (select count(*)::int from public.volunteer_hour_adjustments),
  1,
  'an admin can file an adjustment'
);
select throws_ok(
  $$insert into public.volunteer_hour_adjustments (tutor_id, minutes, reason, created_by)
    values ('44444444-4444-4444-4444-444444444444', 0, 'Nothing',
            '55555555-5555-5555-5555-555555555555')$$,
  '23514',
  null,
  'a zero-minute adjustment is rejected'
);
reset role;
release savepoint s1;

savepoint s2;
select tests.authenticate_as('44444444-4444-4444-4444-444444444444'); -- the tutor
select is(
  (select completed_minutes from public.tutor_volunteer_hours
    where tutor_id = '44444444-4444-4444-4444-444444444444'),
  45,
  'only the past, non-canceled session counts toward completed minutes'
);
select is(
  (select adjustment_minutes from public.tutor_volunteer_hours
    where tutor_id = '44444444-4444-4444-4444-444444444444'),
  120,
  'the adjustment total is reported as its own figure, never merged'
);
select is(
  (select count(*)::int from public.volunteer_hour_adjustments),
  1,
  'a tutor can read adjustments filed against their own record'
);
select throws_ok(
  $$insert into public.volunteer_hour_adjustments (tutor_id, minutes, reason, created_by)
    values ('44444444-4444-4444-4444-444444444444', 600, 'Self-award',
            '44444444-4444-4444-4444-444444444444')$$,
  '42501',
  null,
  'a tutor cannot file an adjustment for themselves'
);
reset role;
release savepoint s2;

savepoint s3;
select tests.authenticate_as('33333333-3333-3333-3333-333333333333'); -- other tutor
select is(
  (select count(*)::int from public.volunteer_hour_adjustments),
  0,
  'a tutor cannot read another tutor''s adjustments'
);
select is(
  (select count(*)::int from public.tutor_volunteer_hours
    where tutor_id = '44444444-4444-4444-4444-444444444444'),
  0,
  'a tutor cannot read another tutor''s hours'
);
reset role;
release savepoint s3;

savepoint s4;
select tests.authenticate_as_anon();
select throws_ok(
  $$select * from public.tutor_volunteer_hours$$,
  '42501',
  null,
  'anon has no grant on the hours view'
);
reset role;
release savepoint s4;

select * from finish();
rollback;
