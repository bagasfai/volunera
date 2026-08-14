-- supabase/seed.sql
--
-- LOCAL DEVELOPMENT ONLY. Applied by `supabase db reset`; never by
-- `supabase db push`. Contains the pgTAP harness and test fixtures.
-- This is NOT the product seed data for grade_levels/subjects, which is
-- deferred to Phase 2 per the spec.

create extension if not exists pgtap with schema extensions;

create schema if not exists tests;

-- Impersonate a user for the remainder of the current transaction or
-- savepoint. Both settings are transaction-local, so `rollback to
-- savepoint` restores the previous identity.
create or replace function tests.authenticate_as(p_user_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
begin
  perform set_config(
    'request.jwt.claims',
    json_build_object(
      'sub', p_user_id::text,
      'role', 'authenticated',
      'aud', 'authenticated'
    )::text,
    true
  );
  perform set_config('role', 'authenticated', true);
end;
$$;

create or replace function tests.authenticate_as_anon()
returns void
language plpgsql
set search_path = ''
as $$
begin
  perform set_config(
    'request.jwt.claims',
    json_build_object('role', 'anon', 'aud', 'authenticated')::text,
    true
  );
  perform set_config('role', 'anon', true);
end;
$$;

-- ---------------------------------------------------------------------------
-- Test fixtures. LOCAL ONLY.
-- ---------------------------------------------------------------------------

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  '00000000-0000-0000-0000-000000000000',
  u.id,
  'authenticated',
  'authenticated',
  u.email,
  extensions.crypt('password123', extensions.gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('avatar_url', u.avatar),
  '', '', '', ''
from (values
  ('11111111-1111-1111-1111-111111111111'::uuid, 'student.a@test.local',  null),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'student.b@test.local',  null),
  ('33333333-3333-3333-3333-333333333333'::uuid, 'tutor.pending@test.local', null),
  ('44444444-4444-4444-4444-444444444444'::uuid, 'tutor.approved@test.local', null),
  ('55555555-5555-5555-5555-555555555555'::uuid, 'admin.active@test.local', null),
  ('66666666-6666-6666-6666-666666666666'::uuid, 'admin.suspended@test.local', null),
  ('77777777-7777-7777-7777-777777777777'::uuid, 'fresh@test.local', null)
) as u(id, email, avatar);

-- Fresh (7777…) deliberately has no profile row: the onboarding RPC tests
-- need an authenticated user who has not onboarded.
insert into public.profiles (id, role, first_name, last_name, email, timezone, status)
values
  ('11111111-1111-1111-1111-111111111111', 'student', 'Ada',  'A', 'student.a@test.local',  'America/Chicago', 'active'),
  ('22222222-2222-2222-2222-222222222222', 'student', 'Ben',  'B', 'student.b@test.local',  'America/New_York', 'active'),
  ('33333333-3333-3333-3333-333333333333', 'tutor',   'Cara', 'C', 'tutor.pending@test.local',  'America/Denver', 'active'),
  ('44444444-4444-4444-4444-444444444444', 'tutor',   'Dev',  'D', 'tutor.approved@test.local', 'America/Los_Angeles', 'active'),
  ('55555555-5555-5555-5555-555555555555', 'admin',   'Eve',  'E', 'admin.active@test.local',   'UTC', 'active'),
  ('66666666-6666-6666-6666-666666666666', 'admin',   'Finn', 'F', 'admin.suspended@test.local', 'UTC', 'suspended');

insert into public.students (profile_id) values
  ('11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222');

insert into public.tutor_profiles (profile_id, application_status, bio, phone, date_of_birth)
values
  ('33333333-3333-3333-3333-333333333333', 'pending',
   'Pending tutor bio.', '+1-555-0101', '2005-04-01'),
  ('44444444-4444-4444-4444-444444444444', 'approved',
   'Approved tutor bio.', '+1-555-0202', '2004-09-15');

insert into public.grade_levels (label, category, sort_order, is_active) values
  ('Grade 5', 'elementary', 50, true),
  ('Retired Grade', 'high', 999, false);

insert into public.subjects (label, category, sort_order, is_active) values
  ('Algebra I', 'STEM', 10, true),
  ('Retired Subject', 'STEM', 999, false);
