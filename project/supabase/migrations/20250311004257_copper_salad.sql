/*
  # Add RLS policies for NFT metadata storage and portfolios

  1. Changes
    - Enable RLS on portfolios table
    - Add policies for portfolio creation and viewing
    - Add storage bucket for NFT metadata
    - Add storage policies for NFT metadata

  2. Security
    - Enable RLS on portfolios table
    - Add policy for authenticated users to create their own portfolio
    - Add policy for public users to view any portfolio
    - Add storage policies for NFT metadata uploads
*/

-- Enable RLS on portfolios table
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

-- Allow users to create their own portfolio
CREATE POLICY "Users can create their own portfolio"
ON portfolios
FOR INSERT
TO authenticated
WITH CHECK (
  wallet_address = auth.uid()::text
);

-- Allow anyone to view portfolios
CREATE POLICY "Anyone can view portfolios"
ON portfolios
FOR SELECT
TO public
USING (true);

-- Create storage bucket for NFT metadata if it doesn't exist
INSERT INTO storage.buckets (id, name)
VALUES ('nft-metadata', 'nft-metadata')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the storage bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to upload NFT metadata
CREATE POLICY "Users can upload their own NFT metadata"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'nft-metadata' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow anyone to download NFT metadata
CREATE POLICY "Anyone can download NFT metadata"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'nft-metadata');