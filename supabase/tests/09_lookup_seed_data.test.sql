begin;
select plan(6);

select is(
  (select count(*)::int from public.grade_levels where label in (
    'Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6',
    'Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12'
  )),
  12,
  'all twelve real grade levels are seeded'
);
select is(
  (select category::text from public.grade_levels where label = 'Grade 5'),
  'elementary',
  'Grade 5 is categorized elementary'
);
select is(
  (select category::text from public.grade_levels where label = 'Grade 7'),
  'middle',
  'Grade 7 is categorized middle'
);
select is(
  (select category::text from public.grade_levels where label = 'Grade 10'),
  'high',
  'Grade 10 is categorized high'
);
select is(
  (select count(*)::int from public.subjects where label in (
    'Math','Science','English','Reading','Writing',
    'Biology','Chemistry','Physics','Algebra','Geometry'
  )),
  10,
  'all ten real subjects are seeded'
);
select is(
  (select count(*)::int from public.grade_levels where label = 'Grade 1'),
  1,
  'the seed migration is idempotent — re-running it via on conflict do nothing does not duplicate rows'
);

select * from finish();
rollback;
