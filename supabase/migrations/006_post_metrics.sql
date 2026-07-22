create table if not exists public.post_metrics (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  post_id uuid not null references public.content_posts(id) on delete cascade,
  instagram_url text,
  measured_at timestamptz not null default now(),
  reach int not null default 0 check (reach >= 0),
  impressions int not null default 0 check (impressions >= 0),
  likes int not null default 0 check (likes >= 0),
  comments int not null default 0 check (comments >= 0),
  saves int not null default 0 check (saves >= 0),
  shares int not null default 0 check (shares >= 0),
  video_views int not null default 0 check (video_views >= 0),
  profile_accesses int not null default 0 check (profile_accesses >= 0),
  website_clicks int not null default 0 check (website_clicks >= 0),
  line_adds int not null default 0 check (line_adds >= 0),
  inquiries int not null default 0 check (inquiries >= 0),
  reservations int not null default 0 check (reservations >= 0),
  purchases int not null default 0 check (purchases >= 0),
  sales_amount numeric(12, 0) not null default 0 check (sales_amount >= 0),
  source text not null default 'manual' check (source in ('manual', 'instagram_api')),
  notes text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (post_id)
);

create index if not exists post_metrics_project_id_idx on public.post_metrics(project_id, measured_at);
create index if not exists post_metrics_post_id_idx on public.post_metrics(post_id);

drop trigger if exists set_post_metrics_updated_at on public.post_metrics;
create trigger set_post_metrics_updated_at
before update on public.post_metrics
for each row execute function public.set_updated_at();

alter table public.post_metrics enable row level security;

drop policy if exists "members can read post metrics" on public.post_metrics;
create policy "members can read post metrics"
on public.post_metrics for select
using (public.is_project_member(project_id));

drop policy if exists "owners and operators can manage post metrics" on public.post_metrics;
create policy "owners and operators can manage post metrics"
on public.post_metrics for all
using (public.has_project_role(project_id, array['owner', 'operator']))
with check (public.has_project_role(project_id, array['owner', 'operator']));
