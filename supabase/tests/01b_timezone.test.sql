begin;
select plan(2);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values (
  '00000000-0000-0000-0000-000000000000',
  'aaaaaaaa-0000-0000-0000-000000000001',
  'authenticated', 'authenticated', 'tz@test.local',
  'x', now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
  '', '', '', ''
);

select lives_ok(
  $$insert into public.profiles (id, role, first_name, last_name, email, timezone)
    values ('aaaaaaaa-0000-0000-0000-000000000001', 'student', 'Tz', 'Test',
            'tz@test.local', 'America/Chicago')$$,
  'a valid IANA zone is accepted'
);

select throws_ok(
  $$update public.profiles set timezone = 'Mars/Olympus'
    where id = 'aaaaaaaa-0000-0000-0000-000000000001'$$,
  '23514',
  null,
  'an invalid IANA zone is rejected'
);

select * from finish();
rollback;
