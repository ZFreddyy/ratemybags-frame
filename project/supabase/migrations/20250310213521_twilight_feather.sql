/*
  # Create NFT metadata storage bucket and policies

  1. Storage Configuration
    - Create NFT metadata bucket for storing JSON files
    - Set up public access for reading metadata
    - Configure authenticated user upload permissions

  2. Security
    - Public read access for all NFT metadata
    - Authenticated users can only upload to their own folders
*/

-- Create the bucket if it doesn't exist
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('nft-metadata', 'nft-metadata', true)
    ON CONFLICT (id) DO NOTHING;
END $$;

-- Allow public access to files
DO $$
BEGIN
    DROP POLICY IF EXISTS "NFT metadata is publicly accessible" ON storage.objects;
    
    CREATE POLICY "NFT metadata is publicly accessible"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'nft-metadata');
END $$;

-- Allow authenticated users to upload metadata
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can upload their own NFT metadata" ON storage.objects;
    
    CREATE POLICY "Users can upload their own NFT metadata"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'nft-metadata' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );
END $$;