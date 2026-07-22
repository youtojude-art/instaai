create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  avatar_url text,
  status text not null default 'active' check (status in ('active', 'invited', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.user_roles (
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null check (role in ('admin', 'staff', 'reviewer', 'viewer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (user_id, role)
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company_name text,
  shop_name text,
  industry text,
  website_url text,
  location text,
  business_hours text,
  phone text,
  reservation_url text,
  line_url text,
  inquiry_url text,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  project_role text not null check (project_role in ('owner', 'operator', 'approver', 'viewer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (project_id, user_id)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.users(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  action text not null,
  target_table text,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists users_email_idx on public.users(email);
create index if not exists users_status_idx on public.users(status);
create index if not exists projects_status_idx on public.projects(status);
create index if not exists projects_name_idx on public.projects(name);
create index if not exists project_members_user_id_idx on public.project_members(user_id);
create index if not exists audit_logs_actor_user_id_idx on public.audit_logs(actor_user_id);
create index if not exists audit_logs_project_id_idx on public.audit_logs(project_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists set_user_roles_updated_at on public.user_roles;
create trigger set_user_roles_updated_at
before update on public.user_roles
for each row execute function public.set_updated_at();

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

drop trigger if exists set_project_members_updated_at on public.project_members;
create trigger set_project_members_updated_at
before update on public.project_members
for each row execute function public.set_updated_at();

create or replace function public.is_admin(check_user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = check_user_id
      and role = 'admin'
      and deleted_at is null
  );
$$;

create or replace function public.is_project_member(check_project_id uuid, check_user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.is_admin(check_user_id)
    or exists (
      select 1
      from public.project_members
      where project_id = check_project_id
        and user_id = check_user_id
        and deleted_at is null
    );
$$;

create or replace function public.has_project_role(
  check_project_id uuid,
  allowed_roles text[],
  check_user_id uuid default auth.uid()
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.is_admin(check_user_id)
    or exists (
      select 1
      from public.project_members
      where project_id = check_project_id
        and user_id = check_user_id
        and project_role = any(allowed_roles)
        and deleted_at is null
    );
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users
  set email = new.email,
      name = coalesce(public.users.name, new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
      updated_at = now()
  where id = new.id;

  if not found then
    insert into public.users (id, email, name, status)
    values (
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
      'active'
    );
  end if;

  insert into public.user_roles (user_id, role)
  select new.id, 'staff'
  where not exists (
    select 1
    from public.user_roles
    where user_id = new.id
      and role = 'staff'
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

alter table public.users enable row level security;
alter table public.user_roles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "users can read own profile or admins read all" on public.users;
create policy "users can read own profile or admins read all"
on public.users for select
using (id = auth.uid() or public.is_admin());

drop policy if exists "admins can manage users" on public.users;
create policy "admins can manage users"
on public.users for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "users can read own roles or admins read all" on public.user_roles;
create policy "users can read own roles or admins read all"
on public.user_roles for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "admins can manage roles" on public.user_roles;
create policy "admins can manage roles"
on public.user_roles for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "members can read projects" on public.projects;
create policy "members can read projects"
on public.projects for select
using (public.is_project_member(id));

drop policy if exists "admins can create projects" on public.projects;
create policy "admins can create projects"
on public.projects for insert
with check (public.is_admin());

drop policy if exists "owners can update projects" on public.projects;
create policy "owners can update projects"
on public.projects for update
using (public.has_project_role(id, array['owner']))
with check (public.has_project_role(id, array['owner']));

drop policy if exists "members can read project members" on public.project_members;
create policy "members can read project members"
on public.project_members for select
using (public.is_project_member(project_id));

drop policy if exists "admins and owners can manage project members" on public.project_members;
create policy "admins and owners can manage project members"
on public.project_members for all
using (public.has_project_role(project_id, array['owner']))
with check (public.has_project_role(project_id, array['owner']));

drop policy if exists "admins can read audit logs" on public.audit_logs;
create policy "admins can read audit logs"
on public.audit_logs for select
using (public.is_admin());

drop policy if exists "authenticated users can insert audit logs" on public.audit_logs;
create policy "authenticated users can insert audit logs"
on public.audit_logs for insert
with check (auth.uid() = actor_user_id);
