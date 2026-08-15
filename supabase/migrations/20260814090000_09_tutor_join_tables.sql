-- supabase/migrations/20260814090000_09_tutor_join_tables.sql
-- Many-to-many join tables between a tutor's application and the grade
-- levels/subjects they can teach. RLS is enabled here but no policies are
-- added yet -- that's Task 3 (20260814090200_11_tutor_application_rls.sql).
-- No UPDATE grant/policy on either table: a selection change is always a
-- delete-then-insert (see submit_tutor_application()), never an in-place
-- row edit.

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

-- The primary key already indexes (tutor_id, grade_level_id) /
-- (tutor_id, subject_id) leading with tutor_id, so tutor-id lookups (the
-- common case: "what did this tutor select") are covered. These add the
-- reverse direction, since grade_level_id/subject_id is not the PK's
-- leading column.
create index tutor_grade_levels_grade_level_id_idx
  on public.tutor_grade_levels (grade_level_id);

create index tutor_subjects_subject_id_idx
  on public.tutor_subjects (subject_id);

grant select, insert, delete on public.tutor_grade_levels to authenticated;
grant select, insert, delete on public.tutor_subjects to authenticated;
