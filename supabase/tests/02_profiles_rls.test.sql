begin;
select plan(8);

-- Every block below follows: savepoint -> authenticate_as -> assert ->
-- reset role -> release savepoint. "reset role" (not "rollback to
-- savepoint") is what restores the superuser identity for the next
-- authenticate_as call. We deliberately RELEASE rather than ROLLBACK the
-- savepoint: ROLLBACK TO SAVEPOINT discards pgTAP's own bookkeeping row
-- (__tcache__.curr_test) along with any data change made inside the
-- savepoint (verified empirically -- ROLLBACK TO SAVEPOINT undoes ordinary
-- table writes and even session-level GUCs, since only sequences are exempt
-- from transactional rollback in Postgres). If every assertion in this file
-- lived inside a rolled-back savepoint, finish() would see a NULL curr_test
-- and raise "# No tests run!" even though every individual assertion
-- printed "ok". RELEASE SAVEPOINT commits the savepoint's effects into the
-- enclosing transaction instead, so pgTAP's tracking survives to finish().
-- Nothing here is ever persisted for real: the outer "rollback;" at the end
-- of the file discards the whole test transaction regardless.

-- Assertion 1: a student sees exactly their own row.
savepoint s1;
select tests.authenticate_as('11111111-1111-1111-1111-111111111111');
select is(
  (select count(*)::int from public.profiles),
  1,
  'student A reading profiles sees exactly one row'
);
select is(
  (select id from public.profiles),
  '11111111-1111-1111-1111-111111111111'::uuid,
  'and that row is their own'
);
reset role;
release savepoint s1;

-- Assertion 3: a student cannot escalate their own role.
-- The row is read after "reset role", i.e. as the superuser, so the
-- assertion observes the row's true post-update state directly -- not
-- filtered through the SELECT policy (no confound either way, since
-- profiles_select_own is keyed on id, not role, but this sidesteps the
-- question entirely).
savepoint s2;
select tests.authenticate_as('11111111-1111-1111-1111-111111111111');
update public.profiles set role = 'admin'
  where id = '11111111-1111-1111-1111-111111111111';
reset role;
select is(
  (select role::text from public.profiles
    where id = '11111111-1111-1111-1111-111111111111'),
  'student',
  'a student setting role=admin leaves role unchanged'
);
release savepoint s2;

-- Assertion 4: a suspended user cannot restore their own status.
-- Same shape as assertion 3, and for the same reason.
savepoint s3;
select tests.authenticate_as('66666666-6666-6666-6666-666666666666');
update public.profiles set status = 'active'
  where id = '66666666-6666-6666-6666-666666666666';
reset role;
select is(
  (select status::text from public.profiles
    where id = '66666666-6666-6666-6666-666666666666'),
  'suspended',
  'a suspended user setting status=active leaves status unchanged'
);
release savepoint s3;

-- Assertion 11: an active admin sees every profile.
savepoint s4;
select tests.authenticate_as('55555555-5555-5555-5555-555555555555');
select is(
  (select count(*)::int from public.profiles),
  6,
  'an active admin reading profiles sees all six rows'
);
reset role;
release savepoint s4;

-- Assertion 12: a suspended admin has no admin powers.
savepoint s5;
select tests.authenticate_as('66666666-6666-6666-6666-666666666666');
select is(private.is_admin(), false, 'is_admin() is false for a suspended admin');
select is(
  (select count(*)::int from public.profiles),
  1,
  'a suspended admin reads only their own row'
);
reset role;
release savepoint s5;

-- BOLA check: a student cannot update another student's row.
-- protect_profile_columns guards id/role/status/email/created_at on rows you
-- can already reach; first_name is not one of them, so it is not protected
-- by the trigger the way assertions 3 and 4 are. Verified empirically that
-- Postgres requires TWO independent things to hold before this UPDATE can
-- touch student B's row at all: student B's row must be visible under an
-- applicable SELECT policy (profiles_select_own, id-scoped), AND it must
-- satisfy profiles_update_own's own USING/WITH CHECK (also id-scoped) --
-- Postgres consults SELECT-policy visibility for UPDATE/DELETE targets
-- independently of the command's own policy, so a break in only one of
-- these two would still be caught by the other. This assertion catches a
-- simultaneous break in both; no other assertion in this file would notice
-- either kind of break on its own.
savepoint s6;
select tests.authenticate_as('11111111-1111-1111-1111-111111111111');
update public.profiles set first_name = 'Hacked'
  where id = '22222222-2222-2222-2222-222222222222';
reset role;
release savepoint s6;
select is(
  (select first_name from public.profiles
    where id = '22222222-2222-2222-2222-222222222222'),
  'Ben',
  'student A cannot rename student B (BOLA blocked by RLS)'
);

select * from finish();
rollback;
