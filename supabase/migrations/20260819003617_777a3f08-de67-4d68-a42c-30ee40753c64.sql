
-- Revoke from everyone first
REVOKE ALL ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_role(UUID, public.app_role) FROM authenticated;
REVOKE ALL ON FUNCTION public.has_role(UUID, public.app_role) FROM anon;

-- Grant only to service_role and authenticated
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;

-- Storage policies for the 'videos' bucket
-- Allow authenticated users to upload their own videos
CREATE POLICY "Users can upload their own videos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to see their own videos or admins to see all
CREATE POLICY "Users can view their own videos or admins all"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'videos' 
  AND (
    (storage.foldername(name))[1] = auth.uid()::text 
    OR public.has_role(auth.uid(), 'admin')
  )
);

-- Allow users to delete their own videos
CREATE POLICY "Users can delete their own videos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text);
