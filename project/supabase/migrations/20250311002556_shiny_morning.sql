/*
  # Add Farcaster support

  1. Changes
    - Remove show_usd column from portfolios (no longer needed)
    - Add rater_fid to ratings table
    - Add reactor_fid to reactions table
    - Update RLS policies for Farcaster authentication

  2. Security
    - Enable RLS on all tables
    - Add policies for Farcaster-based access
*/

-- Remove show_usd column from portfolios
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'portfolios' AND column_name = 'show_usd'
  ) THEN
    ALTER TABLE portfolios DROP COLUMN show_usd;
  END IF;
END $$;

-- Add Farcaster FID to ratings
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ratings' AND column_name = 'rater_fid'
  ) THEN
    ALTER TABLE ratings ADD COLUMN rater_fid text;
  END IF;
END $$;

-- Add Farcaster FID to reactions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reactions' AND column_name = 'reactor_fid'
  ) THEN
    ALTER TABLE reactions ADD COLUMN reactor_fid text;
  END IF;
END $$;

-- Update RLS policies
DO $$ 
BEGIN
  -- Enable RLS on all tables if not already enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'portfolios' AND rowsecurity = true
  ) THEN
    ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'ratings' AND rowsecurity = true
  ) THEN
    ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'reactions' AND rowsecurity = true
  ) THEN
    ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop existing policies to avoid conflicts
DO $$ 
BEGIN
  -- Portfolio policies
  DROP POLICY IF EXISTS "Anyone can view portfolios" ON portfolios;
  DROP POLICY IF EXISTS "Users can create their own portfolio" ON portfolios;
  
  -- Rating policies
  DROP POLICY IF EXISTS "Anyone can view ratings" ON ratings;
  DROP POLICY IF EXISTS "Users can rate once per FID" ON ratings;
  
  -- Reaction policies
  DROP POLICY IF EXISTS "Anyone can view reactions" ON reactions;
  DROP POLICY IF EXISTS "Users can react once per emoji per FID" ON reactions;
END $$;

-- Create new policies
-- Portfolio policies
CREATE POLICY "Anyone can view portfolios"
  ON portfolios
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can create their own portfolio"
  ON portfolios
  FOR INSERT
  TO authenticated
  WITH CHECK (wallet_address = auth.uid()::text);

-- Rating policies
CREATE POLICY "Anyone can view ratings"
  ON ratings
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can rate once per FID"
  ON ratings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM ratings
      WHERE portfolio_id = NEW.portfolio_id
        AND rater_fid = NEW.rater_fid
    )
  );

-- Reaction policies
CREATE POLICY "Anyone can view reactions"
  ON reactions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can react once per emoji per FID"
  ON reactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM reactions
      WHERE portfolio_id = NEW.portfolio_id
        AND reactor_fid = NEW.reactor_fid
        AND emoji = NEW.emoji
    )
  );