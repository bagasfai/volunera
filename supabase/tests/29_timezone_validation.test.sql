-- supabase/tests/29_timezone_validation.test.sql
--
-- pg_timezone_names holds entries Node's Intl.DateTimeFormat cannot parse:
-- posix/* aliases and Factory. Before this fix those passed validate_timezone()
-- and then threw a RangeError in formatSessionDate/formatSessionTime,
-- bricking any dashboard rendering a session for that profile.
begin;
select plan(4);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values (
  '00000000-0000-0000-0000-000000000000',
  'dddddddd-0000-0000-0000-00000000002a',
  'authenticated', 'authenticated', 'tz29@test.local',
  'x', now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
  '', '', '', ''
);

select lives_ok(
  $$insert into public.profiles (id, role, first_name, last_name, email, timezone)
    values ('dddddddd-0000-0000-0000-00000000002a', 'student', 'Tz', 'Twentynine',
            'tz29@test.local', 'America/Chicago')$$,
  'a normal IANA zone like America/Chicago is accepted'
);

select throws_ok(
  $$update public.profiles set timezone = 'posix/America/New_York'
    where id = 'dddddddd-0000-0000-0000-00000000002a'$$,
  '23514',
  null,
  'a posix/* alias is rejected -- Node cannot parse it even though Postgres knows it'
);

select throws_ok(
  $$update public.profiles set timezone = 'Factory'
    where id = 'dddddddd-0000-0000-0000-00000000002a'$$,
  '23514',
  null,
  'Factory is rejected -- Node cannot parse it even though Postgres knows it'
);

select throws_ok(
  $$update public.profiles set timezone = 'Not/A_Real_Zone'
    where id = 'dddddddd-0000-0000-0000-00000000002a'$$,
  '23514',
  null,
  'a garbage string is still rejected'
);

select * from finish();
rollback;
