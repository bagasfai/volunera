create view public.student_booking_details
  with (security_barrier = true)
as
select
  b.id,
  b.tutor_id,
  p.first_name as tutor_first_name,
  left(p.last_name, 1) as tutor_last_initial,
  tp.photo_url as tutor_photo_url,
  s.label as subject_label,
  g.label as grade_label,
  b.topic_category,
  b.topic,
  b.start_time,
  b.end_time,
  b.status,
  b.meet_link,
  b.canceled_at
from public.bookings b
join public.tutor_profiles tp on tp.profile_id = b.tutor_id
join public.profiles p on p.id = b.tutor_id
join public.subjects s on s.id = b.subject_id
join public.grade_levels g on g.id = b.grade_level_id
where b.student_id = (select auth.uid());

create view public.tutor_booking_details
  with (security_barrier = true)
as
select
  b.id,
  p.first_name as student_first_name,
  s.label as subject_label,
  g.label as grade_label,
  b.topic_category,
  b.topic,
  b.start_time,
  b.end_time,
  b.status,
  b.meet_link,
  b.canceled_at
from public.bookings b
join public.profiles p on p.id = b.student_id
join public.subjects s on s.id = b.subject_id
join public.grade_levels g on g.id = b.grade_level_id
where b.tutor_id = (select auth.uid());

create view public.admin_booking_details
  with (security_barrier = true)
as
select
  b.id,
  b.tutor_id,
  tprof.first_name as tutor_first_name,
  tprof.last_name as tutor_last_name,
  tprof.email as tutor_email,
  b.student_id,
  sprof.first_name as student_first_name,
  sprof.last_name as student_last_name,
  sprof.email as student_email,
  s.label as subject_label,
  g.label as grade_label,
  b.topic_category,
  b.topic,
  b.start_time,
  b.end_time,
  b.status,
  b.meet_link,
  b.calendar_event_id,
  b.canceled_at,
  b.canceled_by,
  b.created_at
from public.bookings b
join public.profiles tprof on tprof.id = b.tutor_id
join public.profiles sprof on sprof.id = b.student_id
join public.subjects s on s.id = b.subject_id
join public.grade_levels g on g.id = b.grade_level_id
where private.is_admin();

grant select on public.student_booking_details to authenticated;
grant select on public.tutor_booking_details to authenticated;
grant select on public.admin_booking_details to authenticated;

revoke all on public.student_booking_details from anon;
revoke all on public.tutor_booking_details from anon;
revoke all on public.admin_booking_details from anon;
