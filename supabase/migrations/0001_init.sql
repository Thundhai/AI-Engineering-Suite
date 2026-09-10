-- AI Engineering Suite: core schema
-- Run this once against your Supabase project (SQL Editor, or `supabase db push`).

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  prompt text not null default '',
  selected_agents text[] not null default '{}',
  generation_mode text not null default 'Balanced',
  is_redaction_enabled boolean not null default false,
  output jsonb,
  alpha_earth_location jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  prompt text not null default '',
  selected_agents text[] not null default '{}',
  generation_mode text not null default 'Balanced',
  output jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  role text not null check (role in ('user', 'model')),
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  mime_type text not null,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create index if not exists project_versions_project_id_idx on public.project_versions(project_id);
create index if not exists chat_messages_project_id_idx on public.chat_messages(project_id);
create index if not exists project_files_project_id_idx on public.project_files(project_id);
create index if not exists projects_user_id_idx on public.projects(user_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger — this is what makes "last modified" real (the app
-- previously read a project.updatedAt field that never existed).
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_projects_updated_at on public.projects;
create trigger trg_projects_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security — every table is scoped to its owning user.
-- ---------------------------------------------------------------------------

alter table public.projects enable row level security;
alter table public.project_versions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.project_files enable row level security;

drop policy if exists "projects_owner_all" on public.projects;
create policy "projects_owner_all" on public.projects
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "project_versions_owner_all" on public.project_versions;
create policy "project_versions_owner_all" on public.project_versions
  for all
  using (exists (
    select 1 from public.projects p
    where p.id = project_versions.project_id and p.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.projects p
    where p.id = project_versions.project_id and p.user_id = auth.uid()
  ));

drop policy if exists "chat_messages_owner_all" on public.chat_messages;
create policy "chat_messages_owner_all" on public.chat_messages
  for all
  using (exists (
    select 1 from public.projects p
    where p.id = chat_messages.project_id and p.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.projects p
    where p.id = chat_messages.project_id and p.user_id = auth.uid()
  ));

drop policy if exists "project_files_owner_all" on public.project_files;
create policy "project_files_owner_all" on public.project_files
  for all
  using (exists (
    select 1 from public.projects p
    where p.id = project_files.project_id and p.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.projects p
    where p.id = project_files.project_id and p.user_id = auth.uid()
  ));

-- ---------------------------------------------------------------------------
-- Storage: private bucket for uploaded technical documents.
-- Objects are keyed "<user_id>/<project_id>/<file_id>-<filename>" so a plain
-- folder-prefix check is enough to scope access per user.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('project-files', 'project-files', false)
on conflict (id) do nothing;

drop policy if exists "project_files_storage_select" on storage.objects;
create policy "project_files_storage_select" on storage.objects
  for select
  using (bucket_id = 'project-files' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "project_files_storage_insert" on storage.objects;
create policy "project_files_storage_insert" on storage.objects
  for insert
  with check (bucket_id = 'project-files' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "project_files_storage_delete" on storage.objects;
create policy "project_files_storage_delete" on storage.objects
  for delete
  using (bucket_id = 'project-files' and (storage.foldername(name))[1] = auth.uid()::text);
