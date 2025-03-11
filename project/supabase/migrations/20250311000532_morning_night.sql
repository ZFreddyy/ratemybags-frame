/*
  # Simplify portfolios table and policies

  1. Changes
    - Simplify portfolios table structure
    - Reset RLS policies to basic implementation

  2. Security
    - Enable RLS on portfolios table
    - Allow public read access
    - Allow authenticated users to create/update their own portfolios
*/

-- Enable RLS
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view portfolios" ON portfolios;
DROP POLICY IF EXISTS "Users can create their own portfolio" ON portfolios;
DROP POLICY IF EXISTS "Users can update their own portfolio" ON portfolios;

-- Create simplified policies
CREATE POLICY "Enable read access for all users"
  ON portfolios
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON portfolios
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = wallet_address);

CREATE POLICY "Enable update for users based on wallet_address"
  ON portfolios
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = wallet_address)
  WITH CHECK (auth.uid()::text = wallet_address);