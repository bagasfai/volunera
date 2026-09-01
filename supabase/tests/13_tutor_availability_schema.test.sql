-- supabase/tests/13_tutor_availability_schema.test.sql
begin;
select plan(12);

select has_table('public', 'tutor_availability', 'tutor_availability table exists');
select has_column('public', 'tutor_availability', 'tutor_id', 'has tutor_id');
select has_column('public', 'tutor_availability', 'weekday', 'has weekday');
select has_column('public', 'tutor_availability', 'start_time', 'has start_time');
select has_column('public', 'tutor_availability', 'end_time', 'has end_time');
select fk_ok(
  'public', 'tutor_availability', 'tutor_id',
  'public', 'tutor_profiles', 'profile_id'
);
select is(
  (select relrowsecurity from pg_class
    where oid = 'public.tutor_availability'::regclass),
  true,
  'RLS is enabled on tutor_availability'
);
select throws_ok(
  $$insert into public.tutor_availability (tutor_id, weekday, start_time, end_time)
    values ('44444444-4444-4444-4444-444444444444', 1, '10:00', '09:00')$$,
  '23514',
  null,
  'end_time must be after start_time'
);
select throws_ok(
  $$insert into public.tutor_availability (tutor_id, weekday, start_time, end_time)
    values ('44444444-4444-4444-4444-444444444444', 7, '09:00', '10:00')$$,
  '23514',
  null,
  'weekday must be between 0 and 6'
);

insert into public.tutor_availability (tutor_id, weekday, start_time, end_time)
values ('44444444-4444-4444-4444-444444444444', 1, '09:00', '11:00');

select throws_ok(
  $$insert into public.tutor_availability (tutor_id, weekday, start_time, end_time)
    values ('44444444-4444-4444-4444-444444444444', 1, '10:00', '12:00')$$,
  '23P01',
  null,
  'an overlapping window on the same weekday is rejected'
);
select lives_ok(
  $$insert into public.tutor_availability (tutor_id, weekday, start_time, end_time)
    values ('44444444-4444-4444-4444-444444444444', 1, '12:00', '14:00')$$,
  'a non-overlapping window on the same weekday is accepted'
);
select lives_ok(
  $$insert into public.tutor_availability (tutor_id, weekday, start_time, end_time)
    values ('44444444-4444-4444-4444-444444444444', 2, '09:00', '11:00')$$,
  'the same time range on a different weekday does not conflict'
);

select * from finish();
rollback;
