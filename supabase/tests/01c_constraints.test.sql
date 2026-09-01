begin;
select plan(2);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values (
  '00000000-0000-0000-0000-000000000000',
  'bbbbbbbb-0000-0000-0000-000000000001',
  'authenticated', 'authenticated', 'cons@test.local',
  'x', now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
  '', '', '', ''
);

insert into public.profiles (id, role, first_name, last_name, email)
values ('bbbbbbbb-0000-0000-0000-000000000001', 'student', 'Cons', 'Traint',
        'cons@test.local');

insert into public.students (profile_id)
values ('bbbbbbbb-0000-0000-0000-000000000001');

select throws_ok(
  $$update public.students set guardian_consent = true
    where profile_id = 'bbbbbbbb-0000-0000-0000-000000000001'$$,
  '23514',
  null,
  'consent without a timestamp is rejected'
);

select lives_ok(
  $$update public.students
    set guardian_consent = true, guardian_consent_at = now()
    where profile_id = 'bbbbbbbb-0000-0000-0000-000000000001'$$,
  'consent with a timestamp is accepted'
);

select * from finish();
rollback;
