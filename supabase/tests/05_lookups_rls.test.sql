begin;
select plan(7);

-- Grant-surface hardening. RLS does not filter TRUNCATE, and MAINTAIN carries
-- LOCK TABLE, so a stray grant of either defeats the policy set above it.
--
-- This uses has_table_privilege() rather than information_schema.role_table_grants
-- for two reasons, both learned by getting it wrong first:
--   1. information_schema does not surface MAINTAIN at all in Postgres 17 — a
--      query against it reports a clean grant surface while MAINTAIN is live.
--   2. It enumerates pg_tables rather than naming today's five tables, so it
--      automatically covers tutor_availability, bookings, and anything else a
--      later phase adds. A hardcoded list would keep passing while a new table
--      arrived carrying the default-privilege grants.
select is(
  (select count(*)::int
     from pg_tables t
     cross join unnest(array['anon', 'authenticated']) as r(role_name)
     cross join unnest(array['TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN']) as p(priv)
    where t.schemaname = 'public'
      and has_table_privilege(
            r.role_name,
            format('%I.%I', t.schemaname, t.tablename),
            p.priv
          )),
  0,
  'no public table grants TRUNCATE/REFERENCES/TRIGGER/MAINTAIN to anon or authenticated'
);

-- Ground truth, computed as table owner (RLS is ENABLE not FORCE, so this
-- default connection is unrestricted) before switching role below. This
-- makes the assertions robust to however many real seed rows exist, instead
-- of hardcoding a total that Phase 2's real lookup data would break.
select set_config(
  'test.active_grade_levels',
  (select count(*)::text from public.grade_levels where is_active),
  false
);
select set_config(
  'test.active_subjects',
  (select count(*)::text from public.subjects where is_active),
  false
);
select set_config(
  'test.total_subjects',
  (select count(*)::text from public.subjects),
  false
);

-- Assertion 9: anon reads active rows only.
savepoint s1;
select tests.authenticate_as_anon();
select is(
  (select count(*)::int from public.grade_levels),
  current_setting('test.active_grade_levels')::int,
  'anon sees exactly the active grade_levels rows'
);
select is(
  (select count(*)::int from public.grade_levels where not is_active),
  0,
  'the inactive grade level is invisible to anon'
);
select is(
  (select count(*)::int from public.subjects),
  current_setting('test.active_subjects')::int,
  'anon sees exactly the active subjects rows'
);
reset role;
release savepoint s1;

-- Assertion 10: anon cannot write.
savepoint s2;
select tests.authenticate_as_anon();
select throws_ok(
  $$insert into public.subjects (label, category) values ('Injected', 'STEM')$$,
  '42501',
  null,
  'anon inserting into subjects is denied'
);
reset role;
release savepoint s2;

-- An admin sees inactive rows and can write.
savepoint s3;
select tests.authenticate_as('55555555-5555-5555-5555-555555555555');
select is(
  (select count(*)::int from public.subjects),
  current_setting('test.total_subjects')::int,
  'an active admin sees every subject row, including inactive ones'
);
select lives_ok(
  $$insert into public.subjects (label, category) values ('Trigonometry', 'STEM')$$,
  'an admin can insert a subject'
);
reset role;
release savepoint s3;

select * from finish();
rollback;
