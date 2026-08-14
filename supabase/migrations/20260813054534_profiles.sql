create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null,
  first_name text not null check (length(trim(first_name)) > 0),
  last_name text not null check (length(trim(last_name)) > 0),
  email text not null,
  timezone text not null default 'UTC',
  avatar_url text,
  status public.account_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create index profiles_role_idx on public.profiles (role);

-- SECURITY DEFINER bypasses RLS, which is what prevents infinite recursion
-- when a profiles policy asks "is the caller an admin?". The status check
-- means suspending an admin revokes their powers everywhere, immediately.
--
-- It lives in `private`, not `public`: Postgres grants EXECUTE to PUBLIC on
-- every new function, so a SECURITY DEFINER function in public is a callable
-- Data API RPC endpoint by default. `private` is not an exposed schema.
-- authenticated still needs EXECUTE because RLS policy expressions run with
-- the querying role's privileges.
create function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
      and status = 'active'
  );
$$;

revoke execute on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

-- RLS WITH CHECK cannot reference the OLD row, so "you may edit your profile
-- but not your own role" is not expressible as a policy. This trigger reverts
-- the privileged columns instead. It is the defence against role escalation
-- and against a suspended user restoring their own access.
create function public.protect_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    new.id := old.id;
    new.role := old.role;
    new.status := old.status;
    new.email := old.email;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;

-- BEFORE row triggers fire in alphabetical order by trigger name:
-- protect_columns, then set_updated_at, then validate_timezone.
create trigger profiles_protect_columns
  before update on public.profiles
  for each row execute function public.protect_profile_columns();

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger profiles_validate_timezone
  before insert or update of timezone on public.profiles
  for each row execute function public.validate_timezone();

-- Explicit Data API exposure. Deliberately no insert and no delete: rows are
-- created only by complete_onboarding(), and deactivation is a status change.
grant select, update on public.profiles to authenticated;
