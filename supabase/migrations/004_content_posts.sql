create table if not exists public.content_posts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  source_chat_message_id uuid references public.chat_messages(id) on delete set null,
  title text not null,
  content_type text not null default 'other' check (content_type in ('carousel', 'reel', 'story', 'image', 'other')),
  category text,
  objective text,
  status text not null default 'idea' check (
    status in (
      'idea',
      'planning',
      'staff_review',
      'approval_waiting',
      'approved',
      'scheduled',
      'published',
      'on_hold',
      'rejected'
    )
  ),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  scheduled_at timestamptz,
  caption text,
  cta text,
  hashtags text[] not null default array[]::text[],
  ai_payload jsonb not null default '{}'::jsonb,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.content_versions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.content_posts(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  version_number int not null,
  title text not null,
  caption text,
  cta text,
  hashtags text[] not null default array[]::text[],
  change_note text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (post_id, version_number)
);

create table if not exists public.content_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  post_id uuid references public.content_posts(id) on delete cascade,
  title text not null,
  status text not null default 'todo' check (status in ('todo', 'doing', 'review_waiting', 'done', 'blocked')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  due_at timestamptz,
  description text,
  assignee_id uuid references public.users(id) on delete set null,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists content_posts_project_id_idx on public.content_posts(project_id);
create index if not exists content_posts_status_idx on public.content_posts(project_id, status);
create index if not exists content_posts_scheduled_at_idx on public.content_posts(project_id, scheduled_at);
create index if not exists content_versions_post_id_idx on public.content_versions(post_id, version_number);
create index if not exists content_tasks_project_id_idx on public.content_tasks(project_id, status);
create index if not exists content_tasks_post_id_idx on public.content_tasks(post_id);

drop trigger if exists set_content_posts_updated_at on public.content_posts;
create trigger set_content_posts_updated_at
before update on public.content_posts
for each row execute function public.set_updated_at();

drop trigger if exists set_content_tasks_updated_at on public.content_tasks;
create trigger set_content_tasks_updated_at
before update on public.content_tasks
for each row execute function public.set_updated_at();

alter table public.content_posts enable row level security;
alter table public.content_versions enable row level security;
alter table public.content_tasks enable row level security;

drop policy if exists "members can read content posts" on public.content_posts;
create policy "members can read content posts"
on public.content_posts for select
using (public.is_project_member(project_id));

drop policy if exists "owners and operators can create content posts" on public.content_posts;
create policy "owners and operators can create content posts"
on public.content_posts for insert
with check (
  public.has_project_role(project_id, array['owner', 'operator'])
  and (created_by = auth.uid() or created_by is null)
);

drop policy if exists "owners and operators can update content posts" on public.content_posts;
create policy "owners and operators can update content posts"
on public.content_posts for update
using (public.has_project_role(project_id, array['owner', 'operator']))
with check (public.has_project_role(project_id, array['owner', 'operator']));

drop policy if exists "members can read content versions" on public.content_versions;
create policy "members can read content versions"
on public.content_versions for select
using (public.is_project_member(project_id));

drop policy if exists "owners and operators can create content versions" on public.content_versions;
create policy "owners and operators can create content versions"
on public.content_versions for insert
with check (
  public.has_project_role(project_id, array['owner', 'operator'])
  and (created_by = auth.uid() or created_by is null)
);

drop policy if exists "members can read content tasks" on public.content_tasks;
create policy "members can read content tasks"
on public.content_tasks for select
using (public.is_project_member(project_id));

drop policy if exists "owners and operators can manage content tasks" on public.content_tasks;
create policy "owners and operators can manage content tasks"
on public.content_tasks for all
using (public.has_project_role(project_id, array['owner', 'operator']))
with check (public.has_project_role(project_id, array['owner', 'operator']));
