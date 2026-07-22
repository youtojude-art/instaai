create table if not exists public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  ai_employee_id uuid references public.ai_employees(id) on delete set null,
  title text not null default 'AI社員チャット',
  created_by uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists chat_threads_project_id_idx on public.chat_threads(project_id);
create index if not exists chat_threads_created_by_idx on public.chat_threads(created_by);
create index if not exists chat_messages_thread_id_idx on public.chat_messages(thread_id, created_at);
create index if not exists chat_messages_project_id_idx on public.chat_messages(project_id);

drop trigger if exists set_chat_threads_updated_at on public.chat_threads;
create trigger set_chat_threads_updated_at
before update on public.chat_threads
for each row execute function public.set_updated_at();

alter table public.chat_threads enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists "members can read chat threads" on public.chat_threads;
create policy "members can read chat threads"
on public.chat_threads for select
using (public.is_project_member(project_id));

drop policy if exists "owners and operators can create chat threads" on public.chat_threads;
create policy "owners and operators can create chat threads"
on public.chat_threads for insert
with check (
  public.has_project_role(project_id, array['owner', 'operator'])
  and created_by = auth.uid()
);

drop policy if exists "owners and operators can update chat threads" on public.chat_threads;
create policy "owners and operators can update chat threads"
on public.chat_threads for update
using (public.has_project_role(project_id, array['owner', 'operator']))
with check (public.has_project_role(project_id, array['owner', 'operator']));

drop policy if exists "members can read chat messages" on public.chat_messages;
create policy "members can read chat messages"
on public.chat_messages for select
using (public.is_project_member(project_id));

drop policy if exists "owners and operators can create chat messages" on public.chat_messages;
create policy "owners and operators can create chat messages"
on public.chat_messages for insert
with check (
  public.has_project_role(project_id, array['owner', 'operator'])
  and (created_by = auth.uid() or role = 'assistant')
);
