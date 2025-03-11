/*
  # Storage bucket and RLS setup for NFT metadata

  1. Changes
    - Create storage bucket for NFT metadata
    - Set up RLS policies for storage access

  2. Security
    - Enable RLS on storage.objects table
    - Add policy for authenticated users to upload their own NFT metadata
    - Add policy for public users to view NFT metadata
*/

-- Create storage bucket for NFT metadata if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'nft-metadata'
  ) THEN
    INSERT INTO storage.buckets (id, name)
    VALUES ('nft-metadata', 'nft-metadata');
  END IF;
END $$;

-- Enable RLS on storage.objects table if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Users can upload their own NFT metadata'
  ) THEN
    DROP POLICY "Users can upload their own NFT metadata" ON storage.objects;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Anyone can download NFT metadata'
  ) THEN
    DROP POLICY "Anyone can download NFT metadata" ON storage.objects;
  END IF;
END $$;

-- Create new storage policies
CREATE POLICY "Users can upload their own NFT metadata"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'nft-metadata' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Anyone can download NFT metadata"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'nft-metadata');