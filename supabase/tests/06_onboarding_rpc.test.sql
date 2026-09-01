begin;
select plan(8);

-- A direct INSERT is denied: there is no INSERT policy on profiles.
savepoint s0;
select tests.authenticate_as('77777777-7777-7777-7777-777777777777');
select throws_ok(
  $$insert into public.profiles (id, role, first_name, last_name, email)
    values ('77777777-7777-7777-7777-777777777777', 'admin', 'X', 'Y',
            'fresh@test.local')$$,
  '42501',
  null,
  'a direct insert into profiles as authenticated is denied'
);
reset role;
release savepoint s0;

-- The happy path for a student.
savepoint s1;
select tests.authenticate_as('77777777-7777-7777-7777-777777777777');
select lives_ok(
  $$select public.complete_onboarding('student', 'Fresh', 'User', 'America/Chicago')$$,
  'complete_onboarding succeeds for a student'
);
select is(
  (select role::text from public.profiles
    where id = '77777777-7777-7777-7777-777777777777'),
  'student',
  'the profile row is created with role=student'
);
select is(
  (select email from public.profiles
    where id = '77777777-7777-7777-7777-777777777777'),
  'fresh@test.local',
  'email is copied from auth.users, not from the caller'
);
select is(
  (select count(*)::int from public.students
    where profile_id = '77777777-7777-7777-7777-777777777777'),
  1,
  'the matching students row is created'
);
-- A second call must fail.
select throws_ok(
  $$select public.complete_onboarding('student', 'Fresh', 'User', 'UTC')$$,
  '23505',
  null,
  'calling complete_onboarding twice raises'
);
reset role;
-- Only one no-profile fixture exists (Fresh), and complete_onboarding
-- permits exactly one profile per user, so the tutor-path savepoint below
-- (s3) needs Fresh reset to a no-profile state. This is forward DML run as
-- postgres (table owner, bypasses RLS) after "reset role" -- not a
-- ROLLBACK TO SAVEPOINT, which the test-structure rules forbid because it
-- would also discard pgTAP's __tcache__ bookkeeping for the assertions
-- already recorded above in this same savepoint.
delete from public.students
  where profile_id = '77777777-7777-7777-7777-777777777777';
delete from public.profiles
  where id = '77777777-7777-7777-7777-777777777777';
release savepoint s1;

-- admin cannot be self-assigned.
savepoint s2;
select tests.authenticate_as('77777777-7777-7777-7777-777777777777');
select throws_ok(
  $$select public.complete_onboarding('admin', 'Fresh', 'User', 'UTC')$$,
  '42501',
  null,
  'complete_onboarding refuses role=admin'
);
reset role;
release savepoint s2;

-- The tutor path creates a pending tutor_profiles row.
savepoint s3;
select tests.authenticate_as('77777777-7777-7777-7777-777777777777');
select public.complete_onboarding('tutor', 'Fresh', 'User', 'UTC');
select is(
  (select application_status::text from public.tutor_profiles
    where profile_id = '77777777-7777-7777-7777-777777777777'),
  'pending',
  'the tutor path creates a pending tutor_profiles row'
);
reset role;
release savepoint s3;

select * from finish();
rollback;
