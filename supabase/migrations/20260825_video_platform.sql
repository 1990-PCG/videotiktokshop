-- VideoTikTokShop: video processing + social publishing foundation
-- Run this migration in Supabase SQL Editor before enabling automatic publishing.

create table if not exists public.video_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Novo vídeo',
  source_url text,
  source_path text,
  settings jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft','processing','ready','failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.video_exports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.video_projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text,
  public_url text,
  mime_type text not null default 'video/mp4',
  width integer,
  height integer,
  duration numeric,
  status text not null default 'queued' check (status in ('queued','processing','completed','failed')),
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.social_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('tiktok','instagram')),
  account_id text,
  account_name text,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  scopes text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, platform, account_id)
);

create table if not exists public.social_publications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  export_id uuid references public.video_exports(id) on delete set null,
  connection_id uuid references public.social_connections(id) on delete set null,
  platform text not null check (platform in ('tiktok','instagram')),
  caption text,
  scheduled_at timestamptz,
  external_id text,
  external_url text,
  status text not null default 'queued' check (status in ('queued','processing','published','failed')),
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  published_at timestamptz
);

create index if not exists video_projects_user_id_idx on public.video_projects(user_id);
create index if not exists video_exports_user_id_idx on public.video_exports(user_id);
create index if not exists social_connections_user_id_idx on public.social_connections(user_id);
create index if not exists social_publications_user_id_status_idx on public.social_publications(user_id,status);

alter table public.video_projects enable row level security;
alter table public.video_exports enable row level security;
alter table public.social_connections enable row level security;
alter table public.social_publications enable row level security;

create policy "video_projects_owner" on public.video_projects for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "video_exports_owner" on public.video_exports for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "social_connections_owner" on public.social_connections for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "social_publications_owner" on public.social_publications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists video_projects_updated_at on public.video_projects;
create trigger video_projects_updated_at before update on public.video_projects for each row execute function public.set_updated_at();
drop trigger if exists social_connections_updated_at on public.social_connections;
create trigger social_connections_updated_at before update on public.social_connections for each row execute function public.set_updated_at();
