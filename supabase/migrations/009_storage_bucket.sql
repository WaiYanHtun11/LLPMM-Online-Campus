-- Create storage bucket for course images
-- Run this in Supabase SQL Editor

-- Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-images', 'course-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policy to allow public read access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-images');

-- Allow authenticated users (admins) to upload
CREATE POLICY "Admins can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'course-images' AND
  auth.role() = 'authenticated'
);

-- Allow authenticated users (admins) to update
CREATE POLICY "Admins can update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'course-images' AND
  auth.role() = 'authenticated'
);

-- Allow authenticated users (admins) to delete
CREATE POLICY "Admins can delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'course-images' AND
  auth.role() = 'authenticated'
);

SELECT 'Storage bucket created successfully!' as status;
