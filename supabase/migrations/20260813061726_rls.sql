-- ---------------------------------------------------------------------------
-- All Row Level Security policies live in this one file so the entire policy
-- surface is auditable in a single read. This platform puts adults into 1:1
-- video calls with minors; scattering policies across migrations is how gaps
-- go unnoticed.
--
-- auth.uid() is wrapped in (select ...) throughout so Postgres evaluates it
-- once as an InitPlan rather than once per row.
-- ---------------------------------------------------------------------------

-- profiles -------------------------------------------------------------------
-- No INSERT policy: rows are created only by complete_onboarding(), which
-- refuses role='admin'. With self-insert allowed, a new account's first
-- available action would be making itself an admin.
-- No DELETE policy for anyone, admins included: deactivation is
-- status='deactivated'. Deleting a profile strands an auth.users row.

create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

create policy profiles_select_admin
  on public.profiles
  for select
  to authenticated
  using (private.is_admin());

create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy profiles_update_admin
  on public.profiles
  for update
  to authenticated
  using (private.is_admin())
  with check (private.is_admin());

-- students -------------------------------------------------------------------
-- A tutor gets zero rows here. The narrow paired-student slice (first name,
-- grade, subject, topic) joins through bookings and arrives in Phase 5.
-- No INSERT policy: rows come from complete_onboarding(). No DELETE.

create policy students_select_own
  on public.students
  for select
  to authenticated
  using ((select auth.uid()) = profile_id);

create policy students_select_admin
  on public.students
  for select
  to authenticated
  using (private.is_admin());

create policy students_update_own
  on public.students
  for update
  to authenticated
  using ((select auth.uid()) = profile_id)
  with check ((select auth.uid()) = profile_id);

create policy students_update_admin
  on public.students
  for update
  to authenticated
  using (private.is_admin())
  with check (private.is_admin());

-- tutor_profiles -------------------------------------------------------------
-- There is deliberately no public SELECT policy, so an unapproved tutor is
-- unreachable by construction rather than filtered out. The restricted public
-- view (first name + last initial, photo, bio, teaching style) arrives in
-- Phase 4 with discovery.
-- No INSERT policy: rows come from complete_onboarding(). No DELETE.
--
-- anon holds no SELECT grant on this table at all (see the table's own
-- migration), and that is deliberate defence-in-depth: with no grant, anon's
-- request is refused before RLS is ever consulted, so a permissive policy
-- added by mistake in a later phase still could not leak phone numbers or
-- dates of birth. Phase 4's public tutor discovery goes through a restricted
-- view, never table-level anon access, so this table should never gain an
-- anon grant.

create policy tutor_profiles_select_own
  on public.tutor_profiles
  for select
  to authenticated
  using ((select auth.uid()) = profile_id);

create policy tutor_profiles_select_admin
  on public.tutor_profiles
  for select
  to authenticated
  using (private.is_admin());

create policy tutor_profiles_update_own
  on public.tutor_profiles
  for update
  to authenticated
  using ((select auth.uid()) = profile_id)
  with check ((select auth.uid()) = profile_id);

create policy tutor_profiles_update_admin
  on public.tutor_profiles
  for update
  to authenticated
  using (private.is_admin())
  with check (private.is_admin());

-- grade_levels and subjects --------------------------------------------------
-- SELECT is split by role rather than written as a single
-- `using (is_active or private.is_admin())`. EXECUTE on is_admin() is revoked
-- from anon, and Postgres does not guarantee `or` short-circuits, so a single
-- policy would raise a permission error for anonymous readers.
--
-- Restricting the public read to is_active means a deactivated subject cannot
-- leak into a public filter list by accident.

create policy grade_levels_select_anon
  on public.grade_levels
  for select
  to anon
  using (is_active);

create policy grade_levels_select_authenticated
  on public.grade_levels
  for select
  to authenticated
  using (is_active or private.is_admin());

create policy grade_levels_write_admin
  on public.grade_levels
  for all
  to authenticated
  using (private.is_admin())
  with check (private.is_admin());

create policy subjects_select_anon
  on public.subjects
  for select
  to anon
  using (is_active);

create policy subjects_select_authenticated
  on public.subjects
  for select
  to authenticated
  using (is_active or private.is_admin());

create policy subjects_write_admin
  on public.subjects
  for all
  to authenticated
  using (private.is_admin())
  with check (private.is_admin());

-- Belt and braces: block writes at the grant layer as well as the policy layer.
revoke insert, update, delete on public.grade_levels from anon;
revoke insert, update, delete on public.subjects from anon;

-- ---------------------------------------------------------------------------
-- Grant-surface hardening across all five tables.
--
-- Supabase's schema-level default privileges hand `anon` and `authenticated`
-- TRUNCATE, REFERENCES, and TRIGGER on every new table in `public`. The
-- explicit grants in the earlier migrations ADD verbs; they do not remove
-- these. Verified on this database: `anon` held TRUNCATE on `profiles`,
-- a table it cannot read a single row of.
--
-- This matters because **RLS does not filter TRUNCATE**. A role holding it can
-- empty the table regardless of every policy above. TRIGGER is nearly as bad:
-- it lets a role attach triggers to a table it does not own. REFERENCES allows
-- probing for the existence of values via foreign keys.
--
-- PostgREST cannot issue TRUNCATE, so the practical attack surface today is
-- narrow — but this design's whole premise is that the database enforces
-- access, not that the API surface happens not to expose it.
-- ---------------------------------------------------------------------------

-- MAINTAIN is included deliberately. It is a Postgres 17 privilege covering
-- VACUUM, ANALYZE, CLUSTER, REINDEX, REFRESH MATERIALIZED VIEW and — the one
-- that matters here — LOCK TABLE. Without this revoke, any anonymous visitor
-- could `LOCK TABLE public.profiles` and stall reads and writes on a table of
-- minors' data. It is also invisible to `information_schema.role_table_grants`,
-- so it must be checked with has_table_privilege(); see the test file.
revoke truncate, references, trigger, maintain on public.profiles from anon, authenticated;
revoke truncate, references, trigger, maintain on public.students from anon, authenticated;
revoke truncate, references, trigger, maintain on public.tutor_profiles from anon, authenticated;
revoke truncate, references, trigger, maintain on public.grade_levels from anon, authenticated;
revoke truncate, references, trigger, maintain on public.subjects from anon, authenticated;

-- The revokes above fix the five tables that exist today. They are NOT durable:
-- pg_default_acl carries an entry for role `postgres` in schema `public` granting
-- anon and authenticated `Dxtm` (TRUNCATE, REFERENCES, TRIGGER, MAINTAIN) on every
-- newly created table. Migrations run as `postgres`, so without the statement
-- below, Phase 3's tutor_availability and bookings would silently reacquire the
-- exact hole this block just closed — and a test naming only today's five tables
-- would keep passing while it happened.
alter default privileges for role postgres in schema public
  revoke truncate, references, trigger, maintain on tables from anon, authenticated;
