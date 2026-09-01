begin;
select plan(9);

select has_column('public', 'bookings', 'calendar_event_id', 'bookings has calendar_event_id');
select has_column('public', 'bookings', 'meet_link', 'bookings has meet_link');
select col_type_is('public', 'bookings', 'calendar_event_id', 'text', 'calendar_event_id is text');
select col_type_is('public', 'bookings', 'meet_link', 'text', 'meet_link is text');

select has_trigger(
  'public', 'bookings', 'bookings_canceled_notify',
  'bookings_canceled_notify trigger exists'
);

insert into public.bookings (
  tutor_id, student_id, start_time, end_time,
  subject_id, grade_level_id, topic_category, topic
) values (
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  '2026-09-10 09:00+00',
  '2026-09-10 09:45+00',
  (select id from public.subjects where label = 'Algebra I'),
  (select id from public.grade_levels where label = 'Fixture Active Grade'),
  'homework'::public.topic_category,
  'Fractions'
);

savepoint s1;

select vault.create_secret('fixture-secret-key', 'booking_calendar_secret_key');
select vault.create_secret('http://fixture.local/functions/v1/booking-calendar-event', 'booking_calendar_function_url');

update public.bookings
set status = 'canceled'
where tutor_id = '44444444-4444-4444-4444-444444444444';

select is(
  (select count(*)::int from net.http_request_queue
    where url = 'http://fixture.local/functions/v1/booking-calendar-event'),
  1,
  'canceling a booking queues one HTTP POST via pg_net'
);

select is(
  (select convert_from(body, 'utf8')::jsonb ->> 'action' from net.http_request_queue
    where url = 'http://fixture.local/functions/v1/booking-calendar-event'),
  'cancel',
  'the queued request body has action=cancel'
);

select is(
  (select headers ->> 'apikey' from net.http_request_queue
    where url = 'http://fixture.local/functions/v1/booking-calendar-event'),
  'fixture-secret-key',
  'the queued request headers apikey matches the fixture secret value'
);

select is(
  (select convert_from(body, 'utf8')::jsonb ->> 'bookingId' from net.http_request_queue
    where url = 'http://fixture.local/functions/v1/booking-calendar-event'),
  (select id::text from public.bookings
    where tutor_id = '44444444-4444-4444-4444-444444444444' and status = 'canceled'),
  'the queued request body bookingId matches the booking''s actual id'
);

release savepoint s1;

select * from finish();
rollback;
