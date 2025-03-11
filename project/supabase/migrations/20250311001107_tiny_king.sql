/*
  # Fix Portfolio RLS Policies

  1. Changes
    - Update RLS policies for portfolios table to properly handle creation and updates
    - Simplify policy structure

  2. Security
    - Enable RLS
    - Allow public read access
    - Allow authenticated users to create and update their own portfolios
*/

-- First enable RLS
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view portfolios" ON portfolios;
DROP POLICY IF EXISTS "Authenticated users can create their portfolio" ON portfolios;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON portfolios;
DROP POLICY IF EXISTS "Enable read access for all users" ON portfolios;
DROP POLICY IF EXISTS "Enable update for users based on wallet_address" ON portfolios;

-- Create new simplified policies
CREATE POLICY "Enable read access for all users"
ON portfolios FOR SELECT
TO public
USING (true);

CREATE POLICY "Enable insert for authenticated users"
ON portfolios FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = wallet_address);

CREATE POLICY "Enable update for portfolio owners"
ON portfolios FOR UPDATE
TO authenticated
USING (auth.uid()::text = wallet_address)
WITH CHECK (auth.uid()::text = wallet_address);