begin;
select plan(14);

-- tutor_grade_levels ------------------------------------------------------
select has_table('public', 'tutor_grade_levels', 'tutor_grade_levels table exists');
select has_column('public', 'tutor_grade_levels', 'tutor_id', 'has tutor_id');
select has_column('public', 'tutor_grade_levels', 'grade_level_id', 'has grade_level_id');
select col_is_pk(
  'public', 'tutor_grade_levels', array['tutor_id', 'grade_level_id'],
  'PK is (tutor_id, grade_level_id)'
);
select fk_ok(
  'public', 'tutor_grade_levels', 'tutor_id',
  'public', 'tutor_profiles', 'profile_id'
);
select fk_ok(
  'public', 'tutor_grade_levels', 'grade_level_id',
  'public', 'grade_levels', 'id'
);
select is(
  (select relrowsecurity from pg_class
    where oid = 'public.tutor_grade_levels'::regclass),
  true,
  'RLS is enabled on tutor_grade_levels'
);

-- tutor_subjects ------------------------------------------------------------
select has_table('public', 'tutor_subjects', 'tutor_subjects table exists');
select has_column('public', 'tutor_subjects', 'tutor_id', 'has tutor_id');
select has_column('public', 'tutor_subjects', 'subject_id', 'has subject_id');
select col_is_pk(
  'public', 'tutor_subjects', array['tutor_id', 'subject_id'],
  'PK is (tutor_id, subject_id)'
);
select fk_ok(
  'public', 'tutor_subjects', 'tutor_id',
  'public', 'tutor_profiles', 'profile_id'
);
select fk_ok(
  'public', 'tutor_subjects', 'subject_id',
  'public', 'subjects', 'id'
);
select is(
  (select relrowsecurity from pg_class
    where oid = 'public.tutor_subjects'::regclass),
  true,
  'RLS is enabled on tutor_subjects'
);

select * from finish();
rollback;
