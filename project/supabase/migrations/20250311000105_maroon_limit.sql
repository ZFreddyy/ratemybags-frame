/*
  # Fix portfolio RLS policies

  1. Changes
    - Drop existing RLS policies
    - Create new, properly scoped RLS policies
    - Fix portfolio creation and access permissions

  2. Security
    - Allow public read access to all portfolios
    - Allow authenticated users to create their own portfolio
    - Ensure users can only create/update their own portfolio
*/

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Anyone can view portfolios" ON portfolios;
DROP POLICY IF EXISTS "Users can create their own portfolio" ON portfolios;
DROP POLICY IF EXISTS "Users can update their own portfolio" ON portfolios;

-- Enable RLS
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view any portfolio
CREATE POLICY "Anyone can view portfolios"
  ON portfolios
  FOR SELECT
  TO public
  USING (true);

-- Allow authenticated users to create their own portfolio
CREATE POLICY "Users can create their own portfolio"
  ON portfolios
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.uid())::text = wallet_address);

-- Allow users to update their own portfolio
CREATE POLICY "Users can update their own portfolio"
  ON portfolios
  FOR UPDATE
  TO authenticated
  USING ((auth.uid())::text = wallet_address)
  WITH CHECK ((auth.uid())::text = wallet_address);