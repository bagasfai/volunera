begin;
select plan(7);

select has_function(
  'public', 'get_tutor_public_available_slots',
  array['uuid', 'date', 'date'],
  'get_tutor_public_available_slots() exists'
);

insert into public.tutor_availability (tutor_id, weekday, start_time, end_time)
values (
  '44444444-4444-4444-4444-444444444444',
  extract(dow from date '2026-09-01')::smallint,
  '09:00', '11:00'
);

insert into public.tutor_availability (tutor_id, weekday, start_time, end_time)
values (
  '33333333-3333-3333-3333-333333333333',
  extract(dow from date '2026-09-01')::smallint,
  '09:00', '11:00'
);

savepoint s1;
select tests.authenticate_as_anon();
select is(
  (select count(*)::int from public.get_tutor_public_available_slots(
    '44444444-4444-4444-4444-444444444444', '2026-09-01', '2026-09-01')),
  1,
  'anon sees the approved tutor''s free window'
);
select is(
  (select slot_start = ('2026-09-01 09:00'::timestamp at time zone 'America/Los_Angeles')
    and slot_end = ('2026-09-01 11:00'::timestamp at time zone 'America/Los_Angeles')
   from public.get_tutor_public_available_slots(
      '44444444-4444-4444-4444-444444444444', '2026-09-01', '2026-09-01')),
  true,
  'the returned window is the tutor''s local time converted to the correct UTC instant'
);
select is(
  (select count(*)::int from public.get_tutor_public_available_slots(
    '33333333-3333-3333-3333-333333333333', '2026-09-01', '2026-09-01')),
  0,
  'a pending tutor''s window is invisible even though the data exists'
);
select is(
  (select count(*)::int from public.get_tutor_public_available_slots(
    '99999999-9999-9999-9999-999999999999', '2026-09-01', '2026-09-01')),
  0,
  'a nonexistent tutor id returns zero rows, not an error'
);
select throws_ok(
  $$select * from private.compute_available_slots(
    '44444444-4444-4444-4444-444444444444', '2026-09-01', '2026-09-01')$$,
  '42501',
  null,
  'anon has no direct grant on the private helper -- the SECURITY DEFINER wrapper is the only path'
);
reset role;
release savepoint s1;

savepoint s2;
select tests.authenticate_as('44444444-4444-4444-4444-444444444444');
select is(
  (select count(*)::int from public.get_tutor_public_available_slots(
    '44444444-4444-4444-4444-444444444444', '2026-09-01', '2026-09-01')),
  1,
  'an authenticated caller can also use the public function for their own id'
);
reset role;
release savepoint s2;

select * from finish();
rollback;
