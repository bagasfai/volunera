create type public.user_role as enum ('student', 'tutor', 'admin');

create type public.account_status as enum ('active', 'suspended', 'deactivated');

create type public.tutor_application_status as enum (
  'pending', 'approved', 'rejected', 'inactive', 'suspended'
);

create type public.grade_category as enum ('elementary', 'middle', 'high');
