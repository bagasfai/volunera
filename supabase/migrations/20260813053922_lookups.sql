create table public.grade_levels (
  id uuid primary key default gen_random_uuid(),
  label text not null unique check (length(trim(label)) > 0),
  category public.grade_category not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  label text not null unique check (length(trim(label)) > 0),
  category text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.grade_levels enable row level security;
alter table public.subjects enable row level security;

create index grade_levels_active_sort_idx
  on public.grade_levels (is_active, sort_order);
create index subjects_active_sort_idx
  on public.subjects (is_active, sort_order);

grant select on public.grade_levels to anon, authenticated;
grant select on public.subjects to anon, authenticated;
grant insert, update, delete on public.grade_levels to authenticated;
grant insert, update, delete on public.subjects to authenticated;
