begin;
select plan(3);

-- Assertion 2: a student cannot read another student's row.
savepoint s1;
select tests.authenticate_as('11111111-1111-1111-1111-111111111111');
select is(
  (select count(*)::int from public.students
    where profile_id = '22222222-2222-2222-2222-222222222222'),
  0,
  'student A reading student B''s students row sees zero rows'
);
select is(
  (select count(*)::int from public.students),
  1,
  'student A sees only their own students row'
);
reset role;
release savepoint s1;

-- A tutor currently sees no student rows at all. The narrow paired-student
-- slice joined through bookings arrives in Phase 5.
savepoint s2;
select tests.authenticate_as('44444444-4444-4444-4444-444444444444');
select is(
  (select count(*)::int from public.students),
  0,
  'an approved tutor sees zero student rows in Phase 1'
);
reset role;
release savepoint s2;

select * from finish();
rollback;
