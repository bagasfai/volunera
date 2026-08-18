create table public.tutor_grade_levels (
  tutor_id uuid not null
    references public.tutor_profiles (profile_id) on delete cascade,
  grade_level_id uuid not null
    references public.grade_levels (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (tutor_id, grade_level_id)
);

create table public.tutor_subjects (
  tutor_id uuid not null
    references public.tutor_profiles (profile_id) on delete cascade,
  subject_id uuid not null
    references public.subjects (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (tutor_id, subject_id)
);

alter table public.tutor_grade_levels enable row level security;
alter table public.tutor_subjects enable row level security;

create index tutor_grade_levels_grade_level_id_idx
  on public.tutor_grade_levels (grade_level_id);

create index tutor_subjects_subject_id_idx
  on public.tutor_subjects (subject_id);

grant select, insert, delete on public.tutor_grade_levels to authenticated;
grant select, insert, delete on public.tutor_subjects to authenticated;
