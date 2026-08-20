begin;
select plan(9);

select has_column('public', 'bookings', 'confirmation_email_sent_at', 'bookings has confirmation_email_sent_at');
select has_column('public', 'bookings', 'cancellation_email_sent_at', 'bookings has cancellation_email_sent_at');
select col_type_is('public', 'bookings', 'confirmation_email_sent_at', 'timestamp with time zone', 'confirmation_email_sent_at is timestamptz');
select col_type_is('public', 'bookings', 'cancellation_email_sent_at', 'timestamp with time zone', 'cancellation_email_sent_at is timestamptz');

select has_trigger(
  'public', 'bookings', 'bookings_canceled_notify_email',
  'bookings_canceled_notify_email trigger exists'
);

insert into public.bookings (
  tutor_id, student_id, start_time, end_time,
  subject_id, grade_level_id, topic_category, topic
) values (
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  '2026-09-11 09:00+00',
  '2026-09-11 09:45+00',
  (select id from public.subjects where label = 'Algebra I'),
  (select id from public.grade_levels where label = 'Fixture Active Grade'),
  'homework'::public.topic_category,
  'Fractions'
);

savepoint s1;

select vault.create_secret('fixture-notification-secret-key', 'booking_notification_secret_key');
select vault.create_secret('http://fixture.local/functions/v1/booking-notification-email', 'booking_notification_function_url');

update public.bookings
set status = 'canceled'
where tutor_id = '44444444-4444-4444-4444-444444444444'
  and start_time = '2026-09-11 09:00+00';

select is(
  (select count(*)::int from net.http_request_queue
    where url = 'http://fixture.local/functions/v1/booking-notification-email'),
  1,
  'canceling a booking queues one HTTP POST to the notification function'
);

select is(
  (select convert_from(body, 'utf8')::jsonb ->> 'action' from net.http_request_queue
    where url = 'http://fixture.local/functions/v1/booking-notification-email'),
  'cancel',
  'the queued request body has action=cancel'
);

select is(
  (select headers ->> 'apikey' from net.http_request_queue
    where url = 'http://fixture.local/functions/v1/booking-notification-email'),
  'fixture-notification-secret-key',
  'the queued request headers apikey matches the fixture secret value'
);

select is(
  (select convert_from(body, 'utf8')::jsonb ->> 'bookingId' from net.http_request_queue
    where url = 'http://fixture.local/functions/v1/booking-notification-email'),
  (select id::text from public.bookings
    where tutor_id = '44444444-4444-4444-4444-444444444444'
      and start_time = '2026-09-11 09:00+00'),
  'the queued request body bookingId matches the booking''s actual id'
);

release savepoint s1;

select * from finish();
rollback;
