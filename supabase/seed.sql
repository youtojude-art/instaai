insert into public.projects (id, name, company_name, industry, status)
values
  ('00000000-0000-4000-8000-000000000001', '自社広報アカウント', '自社', '広報', 'active'),
  ('00000000-0000-4000-8000-000000000002', '自社採用アカウント', '自社', '採用', 'active')
on conflict (id) do nothing;
