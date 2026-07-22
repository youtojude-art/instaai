create table if not exists public.content_approvals (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  post_id uuid not null references public.content_posts(id) on delete cascade,
  action text not null check (action in ('requested', 'approved', 'rejected', 'cancelled')),
  from_status text,
  to_status text not null,
  note text,
  action_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists content_approvals_project_id_idx on public.content_approvals(project_id, created_at);
create index if not exists content_approvals_post_id_idx on public.content_approvals(post_id, created_at);

alter table public.content_approvals enable row level security;

drop policy if exists "members can read content approvals" on public.content_approvals;
create policy "members can read content approvals"
on public.content_approvals for select
using (public.is_project_member(project_id));

drop policy if exists "owners operators and approvers can create approvals" on public.content_approvals;
create policy "owners operators and approvers can create approvals"
on public.content_approvals for insert
with check (
  public.has_project_role(project_id, array['owner', 'operator', 'approver'])
  and (action_by = auth.uid() or action_by is null)
);

drop policy if exists "owners and operators can update content posts" on public.content_posts;
create policy "owners operators and approvers can update content posts"
on public.content_posts for update
using (public.has_project_role(project_id, array['owner', 'operator', 'approver']))
with check (public.has_project_role(project_id, array['owner', 'operator', 'approver']));
