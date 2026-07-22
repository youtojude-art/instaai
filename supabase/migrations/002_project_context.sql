create table if not exists public.brand_profiles (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.projects(id) on delete cascade,
  concept text,
  tone text,
  speaking_rules text,
  required_appeals text,
  prohibited_words text,
  legal_notes text,
  colors text,
  fonts text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.target_profiles (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.projects(id) on delete cascade,
  name text not null default 'メインターゲット',
  age_range text,
  gender text,
  area text,
  occupation text,
  lifestyle text,
  pains text,
  desires text,
  behavior_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.ai_employees (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.projects(id) on delete cascade,
  name text not null,
  personality text,
  speaking_style text,
  task_scope text[] not null default array[
    '投稿企画作成',
    '投稿文章作成',
    'リール台本作成',
    '投稿実績分析'
  ],
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists brand_profiles_project_id_idx on public.brand_profiles(project_id);
create index if not exists target_profiles_project_id_idx on public.target_profiles(project_id);
create index if not exists ai_employees_project_id_idx on public.ai_employees(project_id);

drop trigger if exists set_brand_profiles_updated_at on public.brand_profiles;
create trigger set_brand_profiles_updated_at
before update on public.brand_profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_target_profiles_updated_at on public.target_profiles;
create trigger set_target_profiles_updated_at
before update on public.target_profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_ai_employees_updated_at on public.ai_employees;
create trigger set_ai_employees_updated_at
before update on public.ai_employees
for each row execute function public.set_updated_at();

alter table public.brand_profiles enable row level security;
alter table public.target_profiles enable row level security;
alter table public.ai_employees enable row level security;

drop policy if exists "members can read brand profiles" on public.brand_profiles;
create policy "members can read brand profiles"
on public.brand_profiles for select
using (public.is_project_member(project_id));

drop policy if exists "owners and operators can manage brand profiles" on public.brand_profiles;
create policy "owners and operators can manage brand profiles"
on public.brand_profiles for all
using (public.has_project_role(project_id, array['owner', 'operator']))
with check (public.has_project_role(project_id, array['owner', 'operator']));

drop policy if exists "members can read target profiles" on public.target_profiles;
create policy "members can read target profiles"
on public.target_profiles for select
using (public.is_project_member(project_id));

drop policy if exists "owners and operators can manage target profiles" on public.target_profiles;
create policy "owners and operators can manage target profiles"
on public.target_profiles for all
using (public.has_project_role(project_id, array['owner', 'operator']))
with check (public.has_project_role(project_id, array['owner', 'operator']));

drop policy if exists "members can read ai employees" on public.ai_employees;
create policy "members can read ai employees"
on public.ai_employees for select
using (public.is_project_member(project_id));

drop policy if exists "owners and operators can manage ai employees" on public.ai_employees;
create policy "owners and operators can manage ai employees"
on public.ai_employees for all
using (public.has_project_role(project_id, array['owner', 'operator']))
with check (public.has_project_role(project_id, array['owner', 'operator']));
