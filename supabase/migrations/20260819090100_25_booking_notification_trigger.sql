create function private.notify_booking_canceled_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_service_key text;
  v_function_url text;
begin
  select decrypted_secret into v_service_key
  from vault.decrypted_secrets
  where name = 'booking_notification_secret_key';

  select decrypted_secret into v_function_url
  from vault.decrypted_secrets
  where name = 'booking_notification_function_url';

  if v_service_key is null or v_function_url is null then
    raise log 'notify_booking_canceled_email: vault secrets not configured, skipping notification for booking %', new.id;
    return new;
  end if;

  perform net.http_post(
    url := v_function_url,
    body := jsonb_build_object('action', 'cancel', 'bookingId', new.id),
    headers := jsonb_build_object(
      'apikey', v_service_key,
      'Content-Type', 'application/json'
    )
  );

  return new;
end;
$$;

create trigger bookings_canceled_notify_email
  after update of status on public.bookings
  for each row
  when (new.status = 'canceled' and old.status <> 'canceled')
  execute function private.notify_booking_canceled_email();
