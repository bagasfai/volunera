create table public.volunteer_hour_adjustments (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null
    references public.tutor_profiles (profile_id) on delete cascade,
  minutes integer not null
    check (minutes <> 0 and minutes between -100000 and 100000),
  reason text not null
    check (reason = btrim(reason) and length(reason) between 1 and 500),
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now()
);

alter table public.volunteer_hour_adjustments enable row level security;

create index volunteer_hour_adjustments_tutor_id_idx
  on public.volunteer_hour_adjustments (tutor_id);

create policy volunteer_hour_adjustments_select_own
  on public.volunteer_hour_adjustments
  for select
  to authenticated
  using ((select auth.uid()) = tutor_id);

create policy volunteer_hour_adjustments_select_admin
  on public.volunteer_hour_adjustments
  for select
  to authenticated
  using (private.is_admin());

create policy volunteer_hour_adjustments_insert_admin
  on public.volunteer_hour_adjustments
  for insert
  to authenticated
  with check (private.is_admin() and created_by = (select auth.uid()));

create policy volunteer_hour_adjustments_delete_admin
  on public.volunteer_hour_adjustments
  for delete
  to authenticated
  using (private.is_admin());

grant select on public.volunteer_hour_adjustments to authenticated;
grant insert (tutor_id, minutes, reason, created_by)
  on public.volunteer_hour_adjustments to authenticated;
grant delete on public.volunteer_hour_adjustments to authenticated;

revoke truncate, references, trigger, maintain
  on public.volunteer_hour_adjustments from anon, authenticated;

create view public.tutor_volunteer_hours
  with (security_barrier = true)
as
select
  tp.profile_id as tutor_id,
  coalesce((
    select sum(extract(epoch from (b.end_time - b.start_time)) / 60)::integer
    from public.bookings b
    where b.tutor_id = tp.profile_id
      and b.status in ('confirmed', 'completed')
      and b.end_time < now()
  ), 0) as completed_minutes,
  coalesce((
    select sum(a.minutes)::integer
    from public.volunteer_hour_adjustments a
    where a.tutor_id = tp.profile_id
  ), 0) as adjustment_minutes
from public.tutor_profiles tp
where tp.profile_id = (select auth.uid()) or private.is_admin();

grant select on public.tutor_volunteer_hours to authenticated;
revoke all on public.tutor_volunteer_hours from anon;
