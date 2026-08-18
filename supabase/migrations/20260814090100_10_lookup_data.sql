insert into public.grade_levels (label, category, sort_order) values
  ('Grade 1', 'elementary', 10),
  ('Grade 2', 'elementary', 20),
  ('Grade 3', 'elementary', 30),
  ('Grade 4', 'elementary', 40),
  ('Grade 5', 'elementary', 50),
  ('Grade 6', 'middle', 60),
  ('Grade 7', 'middle', 70),
  ('Grade 8', 'middle', 80),
  ('Grade 9', 'high', 90),
  ('Grade 10', 'high', 100),
  ('Grade 11', 'high', 110),
  ('Grade 12', 'high', 120)
on conflict (label) do nothing;

insert into public.subjects (label, sort_order) values
  ('Math', 10),
  ('Science', 20),
  ('English', 30),
  ('Reading', 40),
  ('Writing', 50),
  ('Biology', 60),
  ('Chemistry', 70),
  ('Physics', 80),
  ('Algebra', 90),
  ('Geometry', 100)
on conflict (label) do nothing;
