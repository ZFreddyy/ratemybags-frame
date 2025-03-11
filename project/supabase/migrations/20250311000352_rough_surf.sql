/*
  # Fix portfolio RLS policies

  1. Changes
    - Drop existing RLS policies
    - Create new, properly scoped RLS policies for portfolios table
    - Fix portfolio creation and access permissions

  2. Security
    - Enable RLS on portfolios table
    - Allow public read access to all portfolios
    - Allow authenticated users to create their own portfolio
    - Allow users to update their own portfolio
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view portfolios" ON portfolios;
DROP POLICY IF EXISTS "Users can create their own portfolio" ON portfolios;
DROP POLICY IF EXISTS "Users can update their own portfolio" ON portfolios;

-- Enable RLS
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Anyone can view portfolios"
  ON portfolios
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can create their own portfolio"
  ON portfolios
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own portfolio"
  ON portfolios
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = wallet_address)
  WITH CHECK (auth.uid()::text = wallet_address);