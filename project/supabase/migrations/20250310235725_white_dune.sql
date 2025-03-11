/*
  # Fix portfolio RLS policies

  1. Changes
    - Drop existing policies
    - Recreate policies with proper permissions:
      - Public read access
      - Authenticated users can create their own portfolios
      - Users can update their own portfolios

  2. Security
    - Portfolio owners can only update their own portfolios
    - Anyone can view portfolios
    - Users can only create portfolios with their own wallet address
*/

-- Drop existing policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Anyone can view portfolios" ON portfolios;
  DROP POLICY IF EXISTS "Users can create their own portfolio" ON portfolios;
  DROP POLICY IF EXISTS "Users can update their own portfolio" ON portfolios;
END $$;

-- Enable RLS (if not already enabled)
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

-- Recreate policies with proper permissions
CREATE POLICY "Anyone can view portfolios"
  ON portfolios
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can create their own portfolio"
  ON portfolios
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = wallet_address);

CREATE POLICY "Users can update their own portfolio"
  ON portfolios
  FOR UPDATE
  TO authenticated
  USING (wallet_address = auth.uid()::text)
  WITH CHECK (wallet_address = auth.uid()::text);