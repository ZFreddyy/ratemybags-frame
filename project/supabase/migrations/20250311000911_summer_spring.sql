/*
  # Update portfolios table structure

  1. Changes
    - Remove show_usd column as we're switching to percentage-based display
    - Ensure proper RLS policies are in place

  2. Security
    - Maintain existing RLS policies for portfolios table
*/

-- Remove the show_usd column if it exists
ALTER TABLE portfolios DROP COLUMN IF EXISTS show_usd;

-- Ensure RLS is enabled
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Anyone can view portfolios" ON portfolios;
DROP POLICY IF EXISTS "Authenticated users can create their portfolio" ON portfolios;

-- Create new policies
CREATE POLICY "Anyone can view portfolios"
ON portfolios FOR SELECT
TO public
USING (true);

CREATE POLICY "Authenticated users can create their portfolio"
ON portfolios FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = wallet_address);