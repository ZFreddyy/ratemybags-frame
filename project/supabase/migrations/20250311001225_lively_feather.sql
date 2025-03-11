/*
  # Remove RLS and Simplify Database Structure

  1. Changes
    - Disable RLS on all tables
    - Remove show_usd column from portfolios table
    - Clean up any existing policies

  2. Security
    - Remove RLS since we're only showing percentages
    - Data is now publicly readable and writable
*/

-- Disable RLS on all tables
ALTER TABLE portfolios DISABLE ROW LEVEL SECURITY;
ALTER TABLE ratings DISABLE ROW LEVEL SECURITY;
ALTER TABLE reactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE nft_mints DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Anyone can view portfolios" ON portfolios;
DROP POLICY IF EXISTS "Authenticated users can create their portfolio" ON portfolios;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON portfolios;
DROP POLICY IF EXISTS "Enable read access for all users" ON portfolios;
DROP POLICY IF EXISTS "Enable update for users based on wallet_address" ON portfolios;
DROP POLICY IF EXISTS "Enable update for portfolio owners" ON portfolios;

-- Drop show_usd column if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'portfolios' 
    AND column_name = 'show_usd'
  ) THEN
    ALTER TABLE portfolios DROP COLUMN show_usd;
  END IF;
END $$;