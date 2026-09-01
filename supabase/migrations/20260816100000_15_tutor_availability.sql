create table public.tutor_availability (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null
    references public.tutor_profiles (profile_id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  check (end_time > start_time)
);

alter table public.tutor_availability enable row level security;

create index tutor_availability_tutor_weekday_idx
  on public.tutor_availability (tutor_id, weekday);

create function public.validate_no_overlapping_availability()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.tutor_availability
    where tutor_id = new.tutor_id
      and weekday = new.weekday
      and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
      and new.start_time < end_time
      and new.end_time > start_time
  ) then
    raise exception 'overlapping availability window for this weekday'
      using errcode = 'exclusion_violation';
  end if;
  return new;
end;
$$;

create trigger tutor_availability_validate_no_overlap
  before insert or update on public.tutor_availability
  for each row execute function public.validate_no_overlapping_availability();

grant select, insert, update, delete
  on public.tutor_availability to authenticated;
