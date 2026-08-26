CREATE TABLE public.video_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Projeto sem título',
  source_url text,
  source_path text,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.video_projects TO authenticated;
GRANT ALL ON public.video_projects TO service_role;
ALTER TABLE public.video_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own video projects" ON public.video_projects FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_video_projects_updated_at BEFORE UPDATE ON public.video_projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.video_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  project_id uuid REFERENCES public.video_projects(id) ON DELETE SET NULL,
  storage_path text,
  public_url text,
  mime_type text NOT NULL DEFAULT 'video/mp4',
  width integer,
  height integer,
  duration numeric,
  status text NOT NULL DEFAULT 'processing',
  error_message text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.video_exports TO authenticated;
GRANT ALL ON public.video_exports TO service_role;
ALTER TABLE public.video_exports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own video exports" ON public.video_exports FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_video_exports_updated_at BEFORE UPDATE ON public.video_exports FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.social_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  platform text NOT NULL,
  account_id text,
  account_name text,
  access_token text NOT NULL,
  refresh_token text,
  expires_at timestamptz,
  scopes text[] NOT NULL DEFAULT '{}',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, platform, account_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_connections TO authenticated;
GRANT ALL ON public.social_connections TO service_role;
ALTER TABLE public.social_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own social connections" ON public.social_connections FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_social_connections_updated_at BEFORE UPDATE ON public.social_connections FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.social_publications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  connection_id uuid REFERENCES public.social_connections(id) ON DELETE SET NULL,
  export_id uuid REFERENCES public.video_exports(id) ON DELETE SET NULL,
  platform text NOT NULL,
  caption text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'processing',
  external_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_publications TO authenticated;
GRANT ALL ON public.social_publications TO service_role;
ALTER TABLE public.social_publications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own social publications" ON public.social_publications FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_social_publications_updated_at BEFORE UPDATE ON public.social_publications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();