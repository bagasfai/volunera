begin;
select plan(18);

-- tutor_grade_levels ----------------------------------------------------
savepoint s1;
select tests.authenticate_as('33333333-3333-3333-3333-333333333333'); -- pending tutor
select lives_ok(
  format(
    $$insert into public.tutor_grade_levels (tutor_id, grade_level_id)
      values ('33333333-3333-3333-3333-333333333333', %L)$$,
    (select id from public.grade_levels where label = 'Grade 1')
  ),
  'a tutor can insert their own grade_levels selection'
);
select is(
  (select count(*)::int from public.tutor_grade_levels
    where tutor_id = '33333333-3333-3333-3333-333333333333'),
  1,
  'the tutor sees their own inserted row'
);
reset role;
release savepoint s1;

savepoint s2;
select tests.authenticate_as('44444444-4444-4444-4444-444444444444'); -- approved tutor
select is(
  (select count(*)::int from public.tutor_grade_levels),
  0,
  'a different tutor cannot see the first tutor''s grade_levels row'
);
select throws_ok(
  format(
    $$insert into public.tutor_grade_levels (tutor_id, grade_level_id)
      values ('33333333-3333-3333-3333-333333333333', %L)$$,
    (select id from public.grade_levels where label = 'Grade 2')
  ),
  '42501',
  null,
  'a tutor cannot insert a row under another tutor''s id'
);
reset role;
release savepoint s2;

savepoint s3;
select tests.authenticate_as_anon();
select throws_ok(
  'select count(*) from public.tutor_grade_levels',
  '42501',
  null,
  'anon is refused at the grant layer on tutor_grade_levels'
);
reset role;
release savepoint s3;

savepoint s4;
select tests.authenticate_as('55555555-5555-5555-5555-555555555555'); -- admin
select is(
  (select count(*)::int from public.tutor_grade_levels
    where tutor_id = '33333333-3333-3333-3333-333333333333'),
  1,
  'an admin sees the pending tutor''s grade_levels row'
);
reset role;
release savepoint s4;

savepoint s5;
select tests.authenticate_as('33333333-3333-3333-3333-333333333333');
delete from public.tutor_grade_levels
  where tutor_id = '33333333-3333-3333-3333-333333333333';
select is(
  (select count(*)::int from public.tutor_grade_levels
    where tutor_id = '33333333-3333-3333-3333-333333333333'),
  0,
  'a tutor can delete their own grade_levels row'
);
reset role;
release savepoint s5;

-- tutor_subjects — identical shape ---------------------------------------
savepoint s6;
select tests.authenticate_as('33333333-3333-3333-3333-333333333333');
select lives_ok(
  format(
    $$insert into public.tutor_subjects (tutor_id, subject_id)
      values ('33333333-3333-3333-3333-333333333333', %L)$$,
    (select id from public.subjects where label = 'Math')
  ),
  'a tutor can insert their own subjects selection'
);
select is(
  (select count(*)::int from public.tutor_subjects
    where tutor_id = '33333333-3333-3333-3333-333333333333'),
  1,
  'the tutor sees their own inserted subjects row'
);
reset role;
release savepoint s6;

savepoint s7;
select tests.authenticate_as('44444444-4444-4444-4444-444444444444');
select is(
  (select count(*)::int from public.tutor_subjects),
  0,
  'a different tutor cannot see the first tutor''s subjects row'
);
select throws_ok(
  format(
    $$insert into public.tutor_subjects (tutor_id, subject_id)
      values ('33333333-3333-3333-3333-333333333333', %L)$$,
    (select id from public.subjects where label = 'Science')
  ),
  '42501',
  null,
  'a tutor cannot insert a subjects row under another tutor''s id'
);
reset role;
release savepoint s7;

savepoint s8;
select tests.authenticate_as_anon();
select throws_ok(
  'select count(*) from public.tutor_subjects',
  '42501',
  null,
  'anon is refused at the grant layer on tutor_subjects'
);
reset role;
release savepoint s8;

savepoint s9;
select tests.authenticate_as('55555555-5555-5555-5555-555555555555');
select is(
  (select count(*)::int from public.tutor_subjects
    where tutor_id = '33333333-3333-3333-3333-333333333333'),
  1,
  'an admin sees the pending tutor''s subjects row'
);
reset role;
release savepoint s9;

savepoint s10;
select tests.authenticate_as('33333333-3333-3333-3333-333333333333');
delete from public.tutor_subjects
  where tutor_id = '33333333-3333-3333-3333-333333333333';
select is(
  (select count(*)::int from public.tutor_subjects
    where tutor_id = '33333333-3333-3333-3333-333333333333'),
  0,
  'a tutor can delete their own subjects row'
);
reset role;
release savepoint s10;

-- Final-review Fix 3: an approved tutor is frozen out of direct
-- insert/delete on both join tables. The _insert_own/_delete_own policies
-- now require the tutor's tutor_profiles.application_status to be
-- 'pending' or 'rejected', closing the hole where an approved tutor could
-- swap their grade levels/subjects outside submit_tutor_application().
savepoint s11;
select tests.authenticate_as('44444444-4444-4444-4444-444444444444'); -- approved tutor
select throws_ok(
  format(
    $$insert into public.tutor_grade_levels (tutor_id, grade_level_id)
      values ('44444444-4444-4444-4444-444444444444', %L)$$,
    (select id from public.grade_levels where label = 'Grade 3')
  ),
  '42501',
  null,
  'an approved tutor cannot insert a grade_levels row directly'
);
reset role;
release savepoint s11;

savepoint s12;
select tests.authenticate_as('44444444-4444-4444-4444-444444444444');
select throws_ok(
  format(
    $$insert into public.tutor_subjects (tutor_id, subject_id)
      values ('44444444-4444-4444-4444-444444444444', %L)$$,
    (select id from public.subjects where label = 'English')
  ),
  '42501',
  null,
  'an approved tutor cannot insert a subjects row directly'
);
reset role;
release savepoint s12;

-- Seed a grade_levels/subjects row for the approved tutor as postgres
-- (table owner, bypasses RLS -- same as submit_tutor_application() would),
-- then confirm the approved tutor cannot delete it directly: the DELETE's
-- USING clause simply matches zero rows, so the row survives with no error.
savepoint s13;
insert into public.tutor_grade_levels (tutor_id, grade_level_id)
  values (
    '44444444-4444-4444-4444-444444444444',
    (select id from public.grade_levels where label = 'Grade 4')
  );
insert into public.tutor_subjects (tutor_id, subject_id)
  values (
    '44444444-4444-4444-4444-444444444444',
    (select id from public.subjects where label = 'Biology')
  );
select tests.authenticate_as('44444444-4444-4444-4444-444444444444');
delete from public.tutor_grade_levels
  where tutor_id = '44444444-4444-4444-4444-444444444444';
select is(
  (select count(*)::int from public.tutor_grade_levels
    where tutor_id = '44444444-4444-4444-4444-444444444444'),
  1,
  'an approved tutor cannot delete their own grade_levels row directly'
);
delete from public.tutor_subjects
  where tutor_id = '44444444-4444-4444-4444-444444444444';
select is(
  (select count(*)::int from public.tutor_subjects
    where tutor_id = '44444444-4444-4444-4444-444444444444'),
  1,
  'an approved tutor cannot delete their own subjects row directly'
);
reset role;
release savepoint s13;

select * from finish();
rollback;
