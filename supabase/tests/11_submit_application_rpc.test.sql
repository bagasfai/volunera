-- supabase/tests/11_submit_application_rpc.test.sql
begin;
select plan(15);

-- An approved tutor cannot self-service back into review.
savepoint s1;
select tests.authenticate_as('44444444-4444-4444-4444-444444444444');
select throws_ok(
  format(
    $$select public.submit_tutor_application(
      'Bio.', 'Motivation.', null, '+1-555-0000', '2000-01-01'::date,
      'College', array['English'], array[]::text[], null,
      array[%L]::uuid[], array[%L]::uuid[]
    )$$,
    (select id from public.grade_levels where label = 'Grade 1'),
    (select id from public.subjects where label = 'Math')
  ),
  '42501',
  null,
  'an approved tutor cannot call submit_tutor_application'
);
reset role;
release savepoint s1;

-- A student has no tutor_profiles row at all.
savepoint s2;
select tests.authenticate_as('11111111-1111-1111-1111-111111111111');
select throws_ok(
  format(
    $$select public.submit_tutor_application(
      'Bio.', 'Motivation.', null, '+1-555-0000', '2000-01-01'::date,
      'College', array['English'], array[]::text[], null,
      array[%L]::uuid[], array[%L]::uuid[]
    )$$,
    (select id from public.grade_levels where label = 'Grade 1'),
    (select id from public.subjects where label = 'Math')
  ),
  'P0002',
  null,
  'a student calling submit_tutor_application raises: no application exists'
);
reset role;
release savepoint s2;

-- The pending tutor is the primary subject for the remaining assertions.
savepoint s3;
select tests.authenticate_as('33333333-3333-3333-3333-333333333333');

select throws_ok(
  format(
    $$select public.submit_tutor_application(
      'Bio.', 'Motivation.', null, '+1-555-0000', '2000-01-01'::date,
      'College', array['English'], array[]::text[], null,
      array[]::uuid[], array[%L]::uuid[]
    )$$,
    (select id from public.subjects where label = 'Math')
  ),
  '23514',
  null,
  'submitting with zero grade levels raises'
);

select throws_ok(
  format(
    $$select public.submit_tutor_application(
      'Bio.', 'Motivation.', null, '+1-555-0000', '2000-01-01'::date,
      'College', array['English'], array[]::text[], null,
      array[%L]::uuid[], array[]::uuid[]
    )$$,
    (select id from public.grade_levels where label = 'Grade 1')
  ),
  '23514',
  null,
  'submitting with zero subjects raises'
);

select lives_ok(
  format(
    $$select public.submit_tutor_application(
      'Bio.', 'Motivation.', null, '+1-555-0000', '2000-01-01'::date,
      'College', array['English'], array[]::text[], null,
      array[%L, %L]::uuid[], array[%L, %L]::uuid[]
    )$$,
    (select id from public.grade_levels where label = 'Grade 1'),
    (select id from public.grade_levels where label = 'Grade 2'),
    (select id from public.subjects where label = 'Math'),
    (select id from public.subjects where label = 'Science')
  ),
  'a pending tutor can submit a valid application'
);

select is(
  (select application_submitted_at is not null from public.tutor_profiles
    where profile_id = '33333333-3333-3333-3333-333333333333'),
  true,
  'application_submitted_at is set after submission'
);
select is(
  (select count(*)::int from public.tutor_grade_levels
    where tutor_id = '33333333-3333-3333-3333-333333333333'),
  2,
  'exactly the two submitted grade levels are recorded'
);
select is(
  (select count(*)::int from public.tutor_subjects
    where tutor_id = '33333333-3333-3333-3333-333333333333'),
  2,
  'exactly the two submitted subjects are recorded'
);
reset role;
release savepoint s3;

-- Reject as admin, then confirm the tutor can resubmit.
savepoint s4;
select tests.authenticate_as('55555555-5555-5555-5555-555555555555');
update public.tutor_profiles
  set application_status = 'rejected', reviewed_at = now(),
      reviewed_by = '55555555-5555-5555-5555-555555555555'
  where profile_id = '33333333-3333-3333-3333-333333333333';
reset role;

select tests.authenticate_as('33333333-3333-3333-3333-333333333333');
select lives_ok(
  format(
    $$select public.submit_tutor_application(
      'Updated bio.', 'Updated motivation.', null, '+1-555-0000',
      '2000-01-01'::date, 'College', array['English'], array[]::text[], null,
      array[%L]::uuid[], array[%L]::uuid[]
    )$$,
    (select id from public.grade_levels where label = 'Grade 1'),
    (select id from public.subjects where label = 'Math')
  ),
  'a rejected tutor can resubmit'
);
select is(
  (select application_status::text from public.tutor_profiles
    where profile_id = '33333333-3333-3333-3333-333333333333'),
  'pending',
  'resubmitting flips status back to pending'
);
select is(
  (select reviewed_at from public.tutor_profiles
    where profile_id = '33333333-3333-3333-3333-333333333333'),
  null,
  'resubmitting clears reviewed_at'
);
select is(
  (select reviewed_by from public.tutor_profiles
    where profile_id = '33333333-3333-3333-3333-333333333333'),
  null,
  'resubmitting clears reviewed_by'
);
select is(
  (select count(*)::int from public.tutor_grade_levels
    where tutor_id = '33333333-3333-3333-3333-333333333333'),
  1,
  'resubmitting replaces grade level selections rather than accumulating them'
);
select is(
  (select count(*)::int from public.tutor_subjects
    where tutor_id = '33333333-3333-3333-3333-333333333333'),
  1,
  'resubmitting replaces subject selections rather than accumulating them'
);
with upd as (
  update public.tutor_profiles set application_status = 'approved'
    where profile_id = '33333333-3333-3333-3333-333333333333'
    returning application_status
)
select is(
  (select application_status::text from upd),
  'pending',
  'after a successful RPC call, the tutor still cannot self-approve in the same transaction — the bypass window is closed'
);
reset role;
release savepoint s4;

select * from finish();
rollback;
