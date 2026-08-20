alter table public.bookings
  add column confirmation_email_sent_at timestamptz,
  add column cancellation_email_sent_at timestamptz;

grant select, update (confirmation_email_sent_at, cancellation_email_sent_at)
  on public.bookings to service_role;
