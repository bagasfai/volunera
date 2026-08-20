-- supabase/tests/26_admin_account_status.test.sql
begin;
select plan(13);

select has_function(
  'public', 'admin_set_account_status', array['uuid', 'account_status'],
  'admin_set_account_status() exists'
);
select has_column('public', 'tutor_profiles', 'application_status_prior',
  'application_status_prior exists');

-- Two bookings for the approved tutor (Dev) with student Ada: one in the
-- future, one already past. Inserted as postgres, so RLS does not apply here.
insert into public.bookings (
  id, tutor_id, student_id, start_time, end_time,
  subject_id, grade_level_id, topic_category, topic
) values (
  'eeeeeeee-0000-0000-0000-000000000001',
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  now() + interval '6 days', now() + interval '6 days' + interval '45 minutes',
  (select id from public.subjects where label = 'Algebra I'),
  (select id from public.grade_levels where label = 'Fixture Active Grade'),
  'homework', 'Future session'
), (
  'eeeeeeee-0000-0000-0000-000000000002',
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  now() - interval '6 days', now() - interval '6 days' + interval '45 minutes',
  (select id from public.subjects where label = 'Algebra I'),
  (select id from public.grade_levels where label = 'Fixture Active Grade'),
  'homework', 'Past session'
);

savepoint s1;
select tests.authenticate_as('11111111-1111-1111-1111-111111111111'); -- a student
select throws_ok(
  $$select public.admin_set_account_status(
      '44444444-4444-4444-4444-444444444444', 'suspended')$$,
  '42501',
  null,
  'a non-admin cannot change anyone''s account status'
);
reset role;
release savepoint s1;

savepoint s2;
select tests.authenticate_as('55555555-5555-5555-5555-555555555555'); -- admin Eve
select throws_ok(
  $$select public.admin_set_account_status(
      '55555555-5555-5555-5555-555555555555', 'suspended')$$,
  'P0001',
  null,
  'an admin cannot suspend themselves out of the only surface that could undo it'
);

-- Approved tutor Dev: suspend, then reactivate.
select public.admin_set_account_status(
  '44444444-4444-4444-4444-444444444444', 'suspended');
select is(
  (select status::text from public.profiles
    where id = '44444444-4444-4444-4444-444444444444'),
  'suspended',
  'suspending writes profiles.status'
);
select is(
  (select application_status::text from public.tutor_profiles
    where profile_id = '44444444-4444-4444-4444-444444444444'),
  'suspended',
  'suspending mirrors into the tutor application status'
);
select is(
  (select count(*)::int from public.tutor_public_profiles
    where id = '44444444-4444-4444-4444-444444444444'),
  0,
  'a suspended tutor leaves public discovery with no view change'
);
select is(
  (select status::text from public.bookings
    where id = 'eeeeeeee-0000-0000-0000-000000000001'),
  'canceled',
  'suspending a tutor cancels their future confirmed sessions, so no student is left holding a live Meet link'
);
select is(
  (select status::text from public.bookings
    where id = 'eeeeeeee-0000-0000-0000-000000000002'),
  'confirmed',
  'a session that already happened is left alone, so the tutor keeps the volunteer hours they earned'
);
select public.admin_set_account_status(
  '44444444-4444-4444-4444-444444444444', 'active');
select is(
  (select application_status::text from public.tutor_profiles
    where profile_id = '44444444-4444-4444-4444-444444444444'),
  'approved',
  'reactivating restores the approved tutor to approved'
);

-- Pending tutor Cara must come back as pending, never as approved.
select public.admin_set_account_status(
  '33333333-3333-3333-3333-333333333333', 'suspended');
select public.admin_set_account_status(
  '33333333-3333-3333-3333-333333333333', 'active');
select is(
  (select application_status::text from public.tutor_profiles
    where profile_id = '33333333-3333-3333-3333-333333333333'),
  'pending',
  'reactivating a tutor suspended while pending returns them to pending'
);
select is(
  (select application_status_prior from public.tutor_profiles
    where profile_id = '33333333-3333-3333-3333-333333333333'),
  null,
  'the prior status is cleared once restored'
);
reset role;
release savepoint s2;

savepoint s3;
select tests.authenticate_as_anon();
select throws_ok(
  $$select public.admin_set_account_status(
      '44444444-4444-4444-4444-444444444444', 'suspended')$$,
  '42501',
  null,
  'anon has no execute grant on admin_set_account_status'
);
reset role;
release savepoint s3;

select * from finish();
rollback;
