create or replace function private.guard_booking_status_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user = 'authenticated' then
    if private.is_admin() then
      if new.status not in ('confirmed', 'completed', 'canceled', 'no_show') then
        raise exception 'unsupported booking status'
          using errcode = 'P0001';
      end if;
    else
      if old.status <> 'confirmed' then
        raise exception 'this session can no longer be canceled'
          using errcode = 'P0001';
      end if;
      if new.status <> 'canceled' then
        raise exception 'only cancellation is permitted'
          using errcode = 'P0001';
      end if;
      if old.start_time <= now() then
        raise exception 'this session can no longer be canceled'
          using errcode = 'P0001';
      end if;

      new.id := old.id;
      new.tutor_id := old.tutor_id;
      new.student_id := old.student_id;
      new.start_time := old.start_time;
      new.end_time := old.end_time;
      new.subject_id := old.subject_id;
      new.grade_level_id := old.grade_level_id;
      new.topic_category := old.topic_category;
      new.topic := old.topic;
      new.created_at := old.created_at;
      new.calendar_event_id := old.calendar_event_id;
      new.meet_link := old.meet_link;
      new.confirmation_email_sent_at := old.confirmation_email_sent_at;
      new.cancellation_email_sent_at := old.cancellation_email_sent_at;
    end if;
  end if;

  if new.status = 'canceled' and old.status is distinct from 'canceled' then
    new.canceled_at := now();
    new.canceled_by := (select auth.uid());
  end if;

  if new.status <> 'canceled' and old.status = 'canceled' then
    new.canceled_at := null;
    new.canceled_by := null;
  end if;

  return new;
end;
$$;
