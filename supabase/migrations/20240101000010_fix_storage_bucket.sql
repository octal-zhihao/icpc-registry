-- Ensure storage bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('registration-attachments', 'registration-attachments', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies to avoid conflicts and ensure clean state
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public view" ON storage.objects;
DROP POLICY IF EXISTS "Give anon access to registration-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Give authenticated access to registration-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;

-- Policy 1: Allow public (anyone) to view files in this bucket
CREATE POLICY "Allow public view"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'registration-attachments');

-- Policy 2: Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'registration-attachments');

-- Policy 3: Allow authenticated users to update/delete their own files (optional but good practice)
CREATE POLICY "Allow authenticated update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'registration-attachments');

CREATE POLICY "Allow authenticated delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'registration-attachments');
