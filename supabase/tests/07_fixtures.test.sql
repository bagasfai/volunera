begin;
select plan(5);

select is(
  (select count(*)::int from public.profiles),
  6,
  'six fixture profiles exist (Fresh has no profile)'
);
select is(
  (select count(*)::int from auth.users),
  7,
  'seven fixture auth users exist'
);
select is(
  (select status::text from public.profiles
    where id = '66666666-6666-6666-6666-666666666666'),
  'suspended',
  'the suspended admin is suspended'
);
select is(
  (select count(*)::int from public.grade_levels where not is_active),
  1,
  'one inactive grade level exists for the visibility test'
);
select is(
  (select count(*)::int from public.subjects where not is_active),
  1,
  'one inactive subject exists for the visibility test'
);

select * from finish();
rollback;
