-- supabase/tests/15_bookings_schema.test.sql
begin;
select plan(8);

select has_type('public', 'booking_status', 'booking_status enum exists');
select enum_has_labels(
  'public', 'booking_status',
  array['confirmed', 'completed', 'no_show', 'canceled'],
  'booking_status labels'
);
select has_table('public', 'bookings', 'bookings table exists');
select has_column('public', 'bookings', 'tutor_id', 'has tutor_id');
select has_column('public', 'bookings', 'start_time', 'has start_time');
select has_column('public', 'bookings', 'end_time', 'has end_time');
select has_column('public', 'bookings', 'status', 'has status');
select is(
  (select relrowsecurity from pg_class where oid = 'public.bookings'::regclass),
  true,
  'RLS is enabled on bookings'
);

select * from finish();
rollback;
