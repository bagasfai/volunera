begin;
select plan(7);

-- Assertion 5: a tutor cannot self-approve.
savepoint s1;
select tests.authenticate_as('33333333-3333-3333-3333-333333333333');
update public.tutor_profiles set application_status = 'approved'
  where profile_id = '33333333-3333-3333-3333-333333333333';
reset role;
release savepoint s1;
select is(
  (select application_status::text from public.tutor_profiles
    where profile_id = '33333333-3333-3333-3333-333333333333'),
  'pending',
  'a tutor setting application_status=approved leaves it unchanged'
);

-- Assertion 6: a tutor cannot stamp the review fields.
savepoint s2;
select tests.authenticate_as('33333333-3333-3333-3333-333333333333');
update public.tutor_profiles
  set reviewed_at = now(),
      reviewed_by = '33333333-3333-3333-3333-333333333333'
  where profile_id = '33333333-3333-3333-3333-333333333333';
reset role;
release savepoint s2;
select is(
  (select reviewed_at from public.tutor_profiles
    where profile_id = '33333333-3333-3333-3333-333333333333'),
  null,
  'a tutor cannot set reviewed_at'
);
select is(
  (select reviewed_by from public.tutor_profiles
    where profile_id = '33333333-3333-3333-3333-333333333333'),
  null,
  'a tutor cannot set reviewed_by'
);

-- A tutor CAN edit their own non-privileged fields.
savepoint s3;
select tests.authenticate_as('33333333-3333-3333-3333-333333333333');
update public.tutor_profiles set bio = 'Edited bio.'
  where profile_id = '33333333-3333-3333-3333-333333333333';
select is(
  (select bio from public.tutor_profiles
    where profile_id = '33333333-3333-3333-3333-333333333333'),
  'Edited bio.',
  'a tutor can edit their own bio'
);
reset role;
release savepoint s3;

-- Final-review Fix 3: an approved tutor's direct UPDATE is frozen. The
-- USING clause on tutor_profiles_update_own now requires
-- application_status in ('pending', 'rejected'), so this tutor's row is
-- simply not matched by the UPDATE -- 0 rows affected, no error, bio
-- unchanged. This is the direct-PostgREST-write hole that made an approved
-- tutor's bio/photo/languages editable outside submit_tutor_application().
savepoint s3b;
select tests.authenticate_as('44444444-4444-4444-4444-444444444444'); -- approved tutor
update public.tutor_profiles set bio = 'Attempted direct edit.'
  where profile_id = '44444444-4444-4444-4444-444444444444';
select is(
  (select bio from public.tutor_profiles
    where profile_id = '44444444-4444-4444-4444-444444444444'),
  'Approved tutor bio.',
  'an approved tutor cannot edit their own bio directly'
);
reset role;
release savepoint s3b;

-- Assertion 7: anon cannot reach tutor_profiles at all.
--
-- This asserts a *denial*, not an empty result, and that is deliberate.
-- anon holds no SELECT grant on this table, so the request is refused at the
-- grant layer before RLS is ever consulted. That is strictly stronger than
-- granting SELECT and relying on "no applicable policy" to yield zero rows:
-- with no grant, even a mistakenly-added permissive policy could not leak.
-- Phase 4's public tutor discovery goes through a restricted view, never
-- through table-level anon access, so this grant should never be added.
savepoint s4;
select tests.authenticate_as_anon();
select throws_ok(
  'select count(*) from public.tutor_profiles',
  '42501',
  null,
  'anon is refused at the grant layer on tutor_profiles'
);
reset role;
release savepoint s4;

-- Assertion 8: an authenticated non-admin cannot read another tutor's row.
savepoint s5;
select tests.authenticate_as('11111111-1111-1111-1111-111111111111');
select is(
  (select count(*)::int from public.tutor_profiles),
  0,
  'a student reading tutor_profiles sees zero rows'
);
reset role;
release savepoint s5;

select * from finish();
rollback;
