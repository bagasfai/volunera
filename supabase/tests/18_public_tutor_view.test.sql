begin;
select plan(25);

select has_view(
  'public', 'tutor_public_profiles',
  'tutor_public_profiles view exists'
);

select hasnt_column(
  'public', 'tutor_public_profiles', 'phone',
  'the view never exposes phone'
);
select hasnt_column(
  'public', 'tutor_public_profiles', 'date_of_birth',
  'the view never exposes date_of_birth'
);
select hasnt_column(
  'public', 'tutor_public_profiles', 'motivation',
  'the view never exposes motivation'
);
select hasnt_column(
  'public', 'tutor_public_profiles', 'prior_experience',
  'the view never exposes prior_experience'
);
select hasnt_column(
  'public', 'tutor_public_profiles', 'education_status',
  'the view never exposes education_status'
);
select hasnt_column(
  'public', 'tutor_public_profiles', 'email',
  'the view never exposes email'
);

-- Baseline: one approved+active tutor (44444444…) from seed, one pending
-- tutor (33333333…) from seed.

savepoint s1;
select tests.authenticate_as_anon();
select is(
  (select count(*)::int from public.tutor_public_profiles),
  1,
  'anon sees exactly the one approved+active tutor'
);
select is(
  (select first_name from public.tutor_public_profiles
    where id = '44444444-4444-4444-4444-444444444444'),
  'Dev',
  'the approved tutor''s first name is exposed'
);
select is(
  (select last_initial from public.tutor_public_profiles
    where id = '44444444-4444-4444-4444-444444444444'),
  'D',
  'only the last initial is exposed, not the full last name'
);
select is(
  (select count(*)::int from public.tutor_public_profiles
    where id = '33333333-3333-3333-3333-333333333333'),
  0,
  'the pending tutor is absent from the public view'
);
reset role;
release savepoint s1;

-- Every non-'approved' application_status, and a suspended/deactivated
-- profile even with application_status = 'approved', must be absent. Each
-- check mutates the approved fixture, asserts, then rolls back to restore
-- it for the remaining assertions.

savepoint s2;
select tests.authenticate_as('55555555-5555-5555-5555-555555555555');
update public.tutor_profiles set application_status = 'rejected'
  where profile_id = '44444444-4444-4444-4444-444444444444';
reset role;
select is(
  (select count(*)::int from public.tutor_public_profiles
    where id = '44444444-4444-4444-4444-444444444444'),
  0,
  'a rejected application is absent from the public view'
);
rollback to savepoint s2;

savepoint s3;
select tests.authenticate_as('55555555-5555-5555-5555-555555555555');
update public.tutor_profiles set application_status = 'inactive'
  where profile_id = '44444444-4444-4444-4444-444444444444';
reset role;
select is(
  (select count(*)::int from public.tutor_public_profiles
    where id = '44444444-4444-4444-4444-444444444444'),
  0,
  'an inactive application is absent from the public view'
);
rollback to savepoint s3;

savepoint s4;
select tests.authenticate_as('55555555-5555-5555-5555-555555555555');
update public.tutor_profiles set application_status = 'suspended'
  where profile_id = '44444444-4444-4444-4444-444444444444';
reset role;
select is(
  (select count(*)::int from public.tutor_public_profiles
    where id = '44444444-4444-4444-4444-444444444444'),
  0,
  'a suspended application is absent from the public view'
);
rollback to savepoint s4;

savepoint s5;
select tests.authenticate_as('55555555-5555-5555-5555-555555555555');
update public.profiles set status = 'suspended'
  where id = '44444444-4444-4444-4444-444444444444';
reset role;
select is(
  (select count(*)::int from public.tutor_public_profiles
    where id = '44444444-4444-4444-4444-444444444444'),
  0,
  'an approved tutor with a suspended account is absent from the public view'
);
rollback to savepoint s5;

savepoint s6;
select tests.authenticate_as('55555555-5555-5555-5555-555555555555');
update public.profiles set status = 'deactivated'
  where id = '44444444-4444-4444-4444-444444444444';
reset role;
select is(
  (select count(*)::int from public.tutor_public_profiles
    where id = '44444444-4444-4444-4444-444444444444'),
  0,
  'an approved tutor with a deactivated account is absent from the public view'
);
rollback to savepoint s6;

-- Grade level / subject / language aggregation and filtering.

update public.tutor_profiles
  set languages = array['English', 'Spanish']
  where profile_id = '44444444-4444-4444-4444-444444444444';

insert into public.tutor_grade_levels (tutor_id, grade_level_id)
select '44444444-4444-4444-4444-444444444444', id
from public.grade_levels where label = 'Fixture Active Grade';

insert into public.tutor_subjects (tutor_id, subject_id)
select '44444444-4444-4444-4444-444444444444', id
from public.subjects where label = 'Algebra I';

savepoint s7;
select tests.authenticate_as_anon();
select is(
  (select languages from public.tutor_public_profiles
    where id = '44444444-4444-4444-4444-444444444444'),
  array['English', 'Spanish'],
  'languages are exposed as an array'
);
select is(
  (select grade_level_labels from public.tutor_public_profiles
    where id = '44444444-4444-4444-4444-444444444444'),
  array['Fixture Active Grade'],
  'grade level labels are aggregated from the join table'
);
select is(
  (select subject_labels from public.tutor_public_profiles
    where id = '44444444-4444-4444-4444-444444444444'),
  array['Algebra I'],
  'subject labels are aggregated from the join table'
);
select is(
  (select count(*)::int from public.tutor_public_profiles
    where grade_level_ids @> (
      select array[id] from public.grade_levels where label = 'Fixture Active Grade'
    )),
  1,
  'filtering by grade_level_ids finds the matching tutor'
);
select is(
  (select count(*)::int from public.tutor_public_profiles
    where subject_ids @> (
      select array[id] from public.subjects where label = 'Algebra I'
    )),
  1,
  'filtering by subject_ids finds the matching tutor'
);
select is(
  (select count(*)::int from public.tutor_public_profiles
    where grade_level_ids @> (
      select array[id] from public.grade_levels where label = 'Retired Grade'
    )),
  0,
  'filtering by a grade level the tutor does not teach finds nobody'
);
select is(
  (select count(*)::int from public.tutor_public_profiles
    where languages @> array['Spanish']),
  1,
  'filtering by language finds the matching tutor'
);
select is(
  (select count(*)::int from public.tutor_public_profiles
    where grade_level_ids @> (
      select array[id] from public.grade_levels where label = 'Fixture Active Grade'
    )
    and languages @> array['Spanish']),
  1,
  'combining grade and language filters finds the matching tutor'
);
reset role;
release savepoint s7;

savepoint s8;
select tests.authenticate_as_anon();
select throws_ok(
  $$insert into public.tutor_public_profiles (id, first_name, last_initial)
    values ('44444444-4444-4444-4444-444444444444', 'X', 'X')$$,
  '55000', null,
  'anon cannot insert through the public view'
);
reset role;
release savepoint s8;

select * from finish();
rollback;
