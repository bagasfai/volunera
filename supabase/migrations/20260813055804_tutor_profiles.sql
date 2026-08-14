create table public.tutor_profiles (
  profile_id uuid primary key
    references public.profiles (id) on delete cascade,
  bio text,
  teaching_style_tags text[] not null default '{}',
  languages text[] not null default '{}',
  education_status text,
  motivation text,
  prior_experience text,
  photo_url text,
  -- phone and date_of_birth must never reach a student's browser.
  phone text,
  date_of_birth date,
  application_status public.tutor_application_status not null default 'pending',
  application_submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tutor_profiles enable row level security;

create index tutor_profiles_application_status_idx
  on public.tutor_profiles (application_status);

create index tutor_profiles_reviewed_by_idx
  on public.tutor_profiles (reviewed_by);

-- Without this a tutor could self-approve, which discards the entire
-- safety model. Same reasoning as protect_profile_columns: WITH CHECK
-- cannot see the OLD row.
create function public.protect_tutor_application_columns()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    new.profile_id := old.profile_id;
    new.application_status := old.application_status;
    new.reviewed_at := old.reviewed_at;
    new.reviewed_by := old.reviewed_by;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;

create trigger tutor_profiles_protect_columns
  before update on public.tutor_profiles
  for each row execute function public.protect_tutor_application_columns();

create trigger tutor_profiles_set_updated_at
  before update on public.tutor_profiles
  for each row execute function public.set_updated_at();

grant select, update on public.tutor_profiles to authenticated;
