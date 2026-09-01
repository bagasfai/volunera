create table public.students (
  profile_id uuid primary key
    references public.profiles (id) on delete cascade,
  grade_level_id uuid references public.grade_levels (id) on delete restrict,
  school text,
  guardian_name text,
  guardian_email text,
  guardian_consent boolean not null default false,
  guardian_consent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint students_guardian_consent_timestamp check (
    (guardian_consent and guardian_consent_at is not null)
    or (not guardian_consent and guardian_consent_at is null)
  )
);

alter table public.students enable row level security;

create index students_grade_level_id_idx
  on public.students (grade_level_id);

create trigger students_set_updated_at
  before update on public.students
  for each row execute function public.set_updated_at();

grant select, update on public.students to authenticated;
