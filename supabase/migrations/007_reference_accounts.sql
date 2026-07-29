create table if not exists public.reference_accounts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  account_name text not null,
  account_url text,
  reason text,
  strengths text,
  visual_notes text,
  content_notes text,
  avoid_notes text,
  apply_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists reference_accounts_project_id_idx on public.reference_accounts(project_id);

drop trigger if exists set_reference_accounts_updated_at on public.reference_accounts;
create trigger set_reference_accounts_updated_at
before update on public.reference_accounts
for each row execute function public.set_updated_at();

alter table public.reference_accounts enable row level security;

drop policy if exists "members can read reference accounts" on public.reference_accounts;
create policy "members can read reference accounts"
on public.reference_accounts for select
using (public.is_project_member(project_id));

drop policy if exists "owners and operators can manage reference accounts" on public.reference_accounts;
create policy "owners and operators can manage reference accounts"
on public.reference_accounts for all
using (public.has_project_role(project_id, array['owner', 'operator']))
with check (public.has_project_role(project_id, array['owner', 'operator']));
