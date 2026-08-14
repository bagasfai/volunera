begin;
select plan(37);

select has_type('public', 'user_role', 'user_role enum exists');
select enum_has_labels(
  'public', 'user_role', array['student', 'tutor', 'admin'],
  'user_role has student/tutor/admin'
);
select enum_has_labels(
  'public', 'account_status', array['active', 'suspended', 'deactivated'],
  'account_status labels'
);
select enum_has_labels(
  'public', 'tutor_application_status',
  array['pending', 'approved', 'rejected', 'inactive', 'suspended'],
  'tutor_application_status labels'
);
select enum_has_labels(
  'public', 'grade_category', array['elementary', 'middle', 'high'],
  'grade_category labels'
);

select has_function('public', 'set_updated_at', 'set_updated_at() exists');
select has_function('public', 'validate_timezone', 'validate_timezone() exists');

select has_table('public', 'grade_levels', 'grade_levels table exists');
select col_type_is('public', 'grade_levels', 'category', 'grade_category',
  'grade_levels.category is grade_category');
select col_not_null('public', 'grade_levels', 'is_active',
  'grade_levels.is_active is NOT NULL');

select has_table('public', 'subjects', 'subjects table exists');
select col_type_is('public', 'subjects', 'category', 'text',
  'subjects.category is nullable text');
select col_is_null('public', 'subjects', 'category',
  'subjects.category is nullable');

select is(
  (select relrowsecurity from pg_class where oid = 'public.subjects'::regclass),
  true,
  'RLS is enabled on subjects'
);

select has_table('public', 'profiles', 'profiles table exists');
select col_is_pk('public', 'profiles', 'id', 'profiles.id is the PK');
select fk_ok(
  'public', 'profiles', 'id',
  'auth', 'users', 'id',
  'profiles.id references auth.users.id'
);
select col_not_null('public', 'profiles', 'role', 'profiles.role is NOT NULL');
select has_schema('private', 'the private helper schema exists');
select has_function('private', 'is_admin', 'private.is_admin() exists');
select is(
  has_function_privilege('anon', 'private.is_admin()', 'EXECUTE'),
  false,
  'anon cannot execute private.is_admin()'
);
select is(
  (select prosecdef from pg_proc
    where oid = 'private.is_admin()'::regprocedure),
  true,
  'is_admin() is SECURITY DEFINER'
);
select is(
  (select count(*)::int from pg_proc
    where oid = 'private.is_admin()'::regprocedure
      and exists (
        select 1 from unnest(proconfig) as c
        where c like 'search_path=%'
      )),
  1,
  'is_admin() pins search_path'
);

select has_table('public', 'students', 'students table exists');
select col_is_pk('public', 'students', 'profile_id', 'students PK is profile_id');
select fk_ok(
  'public', 'students', 'grade_level_id',
  'public', 'grade_levels', 'id',
  'students.grade_level_id references grade_levels.id'
);
select col_is_null('public', 'students', 'grade_level_id',
  'students.grade_level_id is nullable (no seed data yet)');

select has_table('public', 'tutor_profiles', 'tutor_profiles table exists');
select col_is_pk('public', 'tutor_profiles', 'profile_id',
  'tutor_profiles PK is profile_id');
select col_type_is('public', 'tutor_profiles', 'teaching_style_tags', 'text[]',
  'teaching_style_tags is text[]');
select col_type_is('public', 'tutor_profiles', 'application_status',
  'tutor_application_status', 'application_status is the enum');
select is(
  (select column_default from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tutor_profiles'
      and column_name = 'application_status'),
  '''pending''::tutor_application_status',
  'application_status defaults to pending'
);
select has_function('public', 'protect_tutor_application_columns',
  'protect_tutor_application_columns() exists');
select has_index('public', 'students', 'students_grade_level_id_idx',
  'students.grade_level_id is indexed');
select has_index('public', 'tutor_profiles', 'tutor_profiles_reviewed_by_idx',
  'tutor_profiles.reviewed_by is indexed');

-- Explicit Data API grants: select and update only, never insert or delete.
select is(
  (select count(*)::int from information_schema.role_table_grants
    where table_schema = 'public' and table_name = 'students'
      and grantee = 'authenticated'
      and privilege_type in ('INSERT', 'DELETE')),
  0,
  'authenticated has no INSERT or DELETE grant on students'
);
select is(
  (select count(*)::int from information_schema.role_table_grants
    where table_schema = 'public' and table_name = 'tutor_profiles'
      and grantee = 'authenticated'
      and privilege_type in ('INSERT', 'DELETE')),
  0,
  'authenticated has no INSERT or DELETE grant on tutor_profiles'
);

select * from finish();
rollback;
