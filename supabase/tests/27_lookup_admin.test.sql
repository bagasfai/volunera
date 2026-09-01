-- supabase/tests/27_lookup_admin.test.sql
begin;
select plan(7);

insert into public.bookings (
  id, tutor_id, student_id, start_time, end_time,
  subject_id, grade_level_id, topic_category, topic
) values (
  'dddddddd-0000-0000-0000-000000000001',
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  now() + interval '5 days', now() + interval '5 days' + interval '45 minutes',
  (select id from public.subjects where label = 'Algebra I'),
  (select id from public.grade_levels where label = 'Fixture Active Grade'),
  'homework', 'In use'
);

insert into public.grade_levels (label, category, sort_order)
values ('Student Only Grade', 'middle', 501);

update public.students
set grade_level_id = (select id from public.grade_levels where label = 'Student Only Grade')
where profile_id = '22222222-2222-2222-2222-222222222222';

savepoint s1;
select tests.authenticate_as('55555555-5555-5555-5555-555555555555'); -- admin Eve
select throws_ok(
  $$delete from public.subjects where label = 'Algebra I'$$,
  'P0001',
  null,
  'deleting a subject referenced by a booking raises a clear guard error'
);
select throws_ok(
  $$delete from public.grade_levels where label = 'Fixture Active Grade'$$,
  'P0001',
  null,
  'deleting a grade level referenced by a booking raises a clear guard error'
);
select throws_ok(
  $$delete from public.grade_levels where label = 'Student Only Grade'$$,
  'P0001',
  null,
  'deleting a grade level held only by a student record also raises the guard, not a raw foreign-key error'
);
update public.subjects set is_active = false where label = 'Algebra I';
select is(
  (select is_active from public.subjects where label = 'Algebra I'),
  false,
  'deactivating an in-use subject succeeds'
);
delete from public.subjects where label = 'Retired Subject';
select is(
  (select count(*)::int from public.subjects where label = 'Retired Subject'),
  0,
  'deleting an unreferenced subject still works'
);
insert into public.subjects (label, category, sort_order)
values ('Statistics', 'STEM', 20);
select is(
  (select count(*)::int from public.subjects where label = 'Statistics'),
  1,
  'an admin can add a subject without a code change'
);
reset role;
release savepoint s1;

savepoint s2;
select tests.authenticate_as('11111111-1111-1111-1111-111111111111'); -- a student
select throws_ok(
  $$insert into public.subjects (label, category, sort_order)
    values ('Bogus', 'STEM', 99)$$,
  '42501',
  null,
  'a non-admin cannot add a subject'
);
reset role;
release savepoint s2;

select * from finish();
rollback;
