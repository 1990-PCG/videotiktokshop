-- Drop existing policies for cleanup
DROP POLICY IF EXISTS "Public View" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can manage their own videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;

-- Policy for viewing videos: Public can read from 'videos' bucket
CREATE POLICY "Public View"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'videos');

-- Policy for uploading: Authenticated users can upload to their own folder in 'videos' bucket
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'videos' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy for deleting: Users can delete their own videos
CREATE POLICY "Authenticated Delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'videos' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);
