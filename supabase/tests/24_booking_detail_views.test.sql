-- supabase/tests/24_booking_detail_views.test.sql
begin;
select plan(13);

insert into public.bookings (
  id, tutor_id, student_id, start_time, end_time,
  subject_id, grade_level_id, topic_category, topic, meet_link
) values (
  'bbbbbbbb-0000-0000-0000-000000000001',
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  now() + interval '3 days', now() + interval '3 days' + interval '45 minutes',
  (select id from public.subjects where label = 'Algebra I'),
  (select id from public.grade_levels where label = 'Fixture Active Grade'),
  'homework', 'Fractions', 'https://meet.google.com/aaa-bbbb-ccc'
);

-- The tutor-facing view must not carry a column that could hold anything
-- beyond first name, grade, subject and topic.
select hasnt_column('public', 'tutor_booking_details', 'student_last_name',
  'tutor_booking_details has no student surname column');
select hasnt_column('public', 'tutor_booking_details', 'student_email',
  'tutor_booking_details has no student email column');
select hasnt_column('public', 'tutor_booking_details', 'student_id',
  'tutor_booking_details does not even expose the student id');
select hasnt_column('public', 'tutor_booking_details', 'school',
  'tutor_booking_details has no school column');
select hasnt_column('public', 'tutor_booking_details', 'guardian_name',
  'tutor_booking_details has no guardian column');

savepoint s1;
select tests.authenticate_as('11111111-1111-1111-1111-111111111111'); -- student Ada
select is(
  (select tutor_first_name from public.student_booking_details
    where id = 'bbbbbbbb-0000-0000-0000-000000000001'),
  'Dev',
  'the student sees the tutor''s first name'
);
select is(
  (select tutor_last_initial from public.student_booking_details
    where id = 'bbbbbbbb-0000-0000-0000-000000000001'),
  'D',
  'the student sees only the tutor''s last initial'
);
select is(
  (select count(*)::int from public.tutor_booking_details),
  0,
  'a student sees nothing through the tutor-facing view'
);
reset role;
release savepoint s1;

savepoint s2;
select tests.authenticate_as('22222222-2222-2222-2222-222222222222'); -- student Ben
select is(
  (select count(*)::int from public.student_booking_details),
  0,
  'a student sees nothing of another student''s bookings'
);
reset role;
release savepoint s2;

savepoint s3;
select tests.authenticate_as('44444444-4444-4444-4444-444444444444'); -- the tutor
select is(
  (select student_first_name from public.tutor_booking_details
    where id = 'bbbbbbbb-0000-0000-0000-000000000001'),
  'Ada',
  'the tutor sees the student''s first name'
);
select is(
  (select count(*)::int from public.admin_booking_details),
  0,
  'a tutor sees nothing through the admin view'
);
reset role;
release savepoint s3;

savepoint s4;
select tests.authenticate_as('55555555-5555-5555-5555-555555555555'); -- admin Eve
select is(
  (select student_email from public.admin_booking_details
    where id = 'bbbbbbbb-0000-0000-0000-000000000001'),
  'student.a@test.local',
  'an admin sees both parties in full'
);
reset role;
release savepoint s4;

savepoint s5;
select tests.authenticate_as_anon();
select throws_ok(
  $$select * from public.tutor_booking_details$$,
  '42501',
  null,
  'anon has no grant on the tutor-facing view'
);
reset role;
release savepoint s5;

select * from finish();
rollback;
