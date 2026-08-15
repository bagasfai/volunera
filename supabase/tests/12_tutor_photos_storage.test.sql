begin;
select plan(12);

select is(
  (select public from storage.buckets where id = 'tutor-photos'),
  false,
  'the tutor-photos bucket exists and is not public'
);

-- The pending tutor uploads their own photo.
savepoint s1;
select tests.authenticate_as('33333333-3333-3333-3333-333333333333');
select lives_ok(
  $$insert into storage.objects (bucket_id, name, owner_id)
    values ('tutor-photos', '33333333-3333-3333-3333-333333333333/photo.jpg',
            '33333333-3333-3333-3333-333333333333')$$,
  'a tutor can upload into their own folder'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name, owner_id)
    values ('tutor-photos', '44444444-4444-4444-4444-444444444444/photo.jpg',
            '33333333-3333-3333-3333-333333333333')$$,
  '42501',
  null,
  'a tutor cannot upload into another tutor''s folder'
);
reset role;
release savepoint s1;

-- The seed fixtures' already-approved tutor (44444444...) also uploads a
-- photo here, before 33333333... is ever approved. With two tutors' objects
-- coexisting in the bucket at different approval states, the assertions
-- below can distinguish genuine per-row visibility (only the approved
-- tutor's object is visible) from a hypothetical bug that opens the whole
-- bucket once ANY tutor becomes approved -- a single-object bucket can't
-- tell those two apart.
savepoint s1b;
select tests.authenticate_as('44444444-4444-4444-4444-444444444444');
select lives_ok(
  $$insert into storage.objects (bucket_id, name, owner_id)
    values ('tutor-photos', '44444444-4444-4444-4444-444444444444/photo.jpg',
            '44444444-4444-4444-4444-444444444444')$$,
  'an already-approved tutor can also upload into their own folder'
);
reset role;
release savepoint s1b;

-- Not yet approved: invisible to everyone except owner and admin. Scoped by
-- name to 33333333...'s object specifically, since 44444444... now also has
-- their own object visible to themselves via the ordinary own-row policy --
-- a bare bucket-wide count would conflate "can't see the pending tutor's
-- photo" with "can see my own photo".
savepoint s2;
select tests.authenticate_as('44444444-4444-4444-4444-444444444444');
select is(
  (select count(*)::int from storage.objects
     where bucket_id = 'tutor-photos'
       and name = '33333333-3333-3333-3333-333333333333/photo.jpg'),
  0,
  'a different tutor cannot see the pending tutor''s unapproved photo'
);
reset role;
release savepoint s2;

savepoint s3;
select tests.authenticate_as_anon();
select is(
  (select count(*)::int from storage.objects
     where bucket_id = 'tutor-photos'
       and name = '33333333-3333-3333-3333-333333333333/photo.jpg'),
  0,
  'anon cannot see the pending tutor''s unapproved photo'
);
select is(
  (select count(*)::int from storage.objects
     where bucket_id = 'tutor-photos'
       and name = '44444444-4444-4444-4444-444444444444/photo.jpg'),
  1,
  'anon can already see the approved tutor''s photo, proving visibility is per-row and not bucket-wide'
);
reset role;
release savepoint s3;

savepoint s4;
select tests.authenticate_as('55555555-5555-5555-5555-555555555555');
select is(
  (select count(*)::int from storage.objects where bucket_id = 'tutor-photos'),
  2,
  'an admin can see both tutors'' photos regardless of approval status'
);
-- Approve the pending tutor so the next block can prove the transition.
update public.tutor_profiles
  set application_status = 'approved', reviewed_at = now(),
      reviewed_by = '55555555-5555-5555-5555-555555555555'
  where profile_id = '33333333-3333-3333-3333-333333333333';
reset role;
release savepoint s4;

savepoint s5;
select tests.authenticate_as_anon();
select is(
  (select count(*)::int from storage.objects
     where bucket_id = 'tutor-photos'
       and name = '33333333-3333-3333-3333-333333333333/photo.jpg'),
  1,
  'once approved, anon can now see the previously-pending tutor''s photo'
);
select is(
  (select count(*)::int from storage.objects where bucket_id = 'tutor-photos'),
  2,
  'anon now sees both tutors'' photos'
);
reset role;
release savepoint s5;

-- Owner can still manage their own object after approval.
savepoint s6;
select tests.authenticate_as('33333333-3333-3333-3333-333333333333');
-- storage.objects has a statement-level trigger (storage.protect_delete) that
-- rejects direct SQL DELETEs unless this session GUC is set; the Storage API
-- sets it automatically on real requests, so this only affects test SQL.
set local storage.allow_delete_query = 'true';
select lives_ok(
  $$delete from storage.objects
    where bucket_id = 'tutor-photos'
      and name = '33333333-3333-3333-3333-333333333333/photo.jpg'$$,
  'the owning tutor can delete their own photo'
);
select is(
  (select count(*)::int from storage.objects where bucket_id = 'tutor-photos'),
  1,
  'the deleted tutor''s photo is gone but the other tutor''s approved photo remains'
);
reset role;
release savepoint s6;

select * from finish();
rollback;
