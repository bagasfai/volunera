create type public.booking_status as enum (
  'confirmed', 'completed', 'no_show', 'canceled'
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null
    references public.tutor_profiles (profile_id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status public.booking_status not null default 'confirmed',
  created_at timestamptz not null default now(),
  check (end_time > start_time)
);

alter table public.bookings enable row level security;

create unique index bookings_tutor_start_time_not_canceled_idx
  on public.bookings (tutor_id, start_time)
  where status <> 'canceled';

grant select on public.bookings to authenticated;
