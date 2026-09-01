create table public.tutor_availability_exceptions (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null
    references public.tutor_profiles (profile_id) on delete cascade,
  exception_date date not null,
  reason text,
  created_at timestamptz not null default now(),
  unique (tutor_id, exception_date)
);

alter table public.tutor_availability_exceptions enable row level security;

grant select, insert, update, delete
  on public.tutor_availability_exceptions to authenticated;
