begin;
select plan(7);

select has_table('public', 'tutor_availability_exceptions',
  'tutor_availability_exceptions table exists');
select has_column('public', 'tutor_availability_exceptions', 'tutor_id',
  'has tutor_id');
select has_column('public', 'tutor_availability_exceptions', 'exception_date',
  'has exception_date');
select fk_ok(
  'public', 'tutor_availability_exceptions', 'tutor_id',
  'public', 'tutor_profiles', 'profile_id'
);
select is(
  (select relrowsecurity from pg_class
    where oid = 'public.tutor_availability_exceptions'::regclass),
  true,
  'RLS is enabled on tutor_availability_exceptions'
);

insert into public.tutor_availability_exceptions (tutor_id, exception_date)
values ('44444444-4444-4444-4444-444444444444', '2026-09-01');

select lives_ok(
  $$insert into public.tutor_availability_exceptions (tutor_id, exception_date)
    values ('44444444-4444-4444-4444-444444444444', '2026-09-02')$$,
  'a second, different exception date for the same tutor is accepted'
);
select throws_ok(
  $$insert into public.tutor_availability_exceptions (tutor_id, exception_date)
    values ('44444444-4444-4444-4444-444444444444', '2026-09-01')$$,
  '23505',
  null,
  'a duplicate exception date for the same tutor is rejected'
);

select * from finish();
rollback;
