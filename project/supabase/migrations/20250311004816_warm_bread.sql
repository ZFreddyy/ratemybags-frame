/*
  # Storage and Portfolio RLS Setup

  1. Changes
    - Create NFT metadata storage bucket
    - Set up storage access policies
    - Configure portfolio table policies

  2. Security
    - Enable RLS on storage.objects table
    - Add policies for NFT metadata upload and download
    - Add policies for portfolio access
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

-- Drop and recreate storage policies
DO $$
BEGIN
  -- Drop existing storage policies if they exist
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

-- Create storage policies
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

-- Drop and recreate portfolio policies
DO $$
BEGIN
  -- Drop existing portfolio policies if they exist
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'portfolios' 
    AND schemaname = 'public'
    AND policyname = 'Anyone can view portfolios'
  ) THEN
    DROP POLICY "Anyone can view portfolios" ON portfolios;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'portfolios' 
    AND schemaname = 'public'
    AND policyname = 'Users can create their own portfolio'
  ) THEN
    DROP POLICY "Users can create their own portfolio" ON portfolios;
  END IF;
END $$;

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