/*
  # Storage and Portfolio RLS Setup

  1. Changes
    - Create storage bucket for NFT metadata
    - Set up proper RLS policies for storage access
    - Enable RLS on portfolios table
    - Add portfolio policies

  2. Security
    - Enable RLS on storage.objects table
    - Add policy for authenticated users to upload their own NFT metadata
    - Add policy for public users to view NFT metadata
    - Add policies for portfolio table access
*/

-- Create storage bucket for NFT metadata if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'nft-metadata'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('nft-metadata', 'nft-metadata', true);
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

-- Create storage policies with proper checks
CREATE POLICY "Users can upload their own NFT metadata"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'nft-metadata' AND
  auth.uid()::text = (regexp_match(name, '^([^/]+)/'))[1]
);

CREATE POLICY "Anyone can download NFT metadata"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'nft-metadata');

-- Enable RLS on portfolios table
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

-- Create portfolio policies
CREATE POLICY "Anyone can view portfolios"
ON portfolios
FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can create their own portfolio"
ON portfolios
FOR INSERT
TO authenticated
WITH CHECK (
  wallet_address = auth.uid()::text
);