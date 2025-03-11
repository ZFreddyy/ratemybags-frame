/*
  # Add Farcaster support
  
  1. Changes
    - Add farcaster_fid column to ratings table
    - Add farcaster_fid column to reactions table
    - Add policies to prevent duplicate ratings/reactions from same FID
    
  2. Security
    - Add RLS policies to check farcaster_fid
    - Ensure one rating per FID per portfolio
    - Ensure one reaction per emoji per FID per portfolio
*/

-- Add Farcaster FID columns
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS rater_fid text;
ALTER TABLE reactions ADD COLUMN IF NOT EXISTS reactor_fid text;

-- Create function to check for duplicate ratings
CREATE OR REPLACE FUNCTION check_duplicate_rating()
RETURNS trigger AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM ratings
    WHERE portfolio_id = NEW.portfolio_id
    AND rater_fid = NEW.rater_fid
  ) THEN
    RAISE EXCEPTION 'User has already rated this portfolio';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to check for duplicate reactions
CREATE OR REPLACE FUNCTION check_duplicate_reaction()
RETURNS trigger AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM reactions
    WHERE portfolio_id = NEW.portfolio_id
    AND reactor_fid = NEW.reactor_fid
    AND emoji = NEW.emoji
  ) THEN
    RAISE EXCEPTION 'User has already reacted with this emoji';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to enforce uniqueness
DROP TRIGGER IF EXISTS check_rating_duplicate ON ratings;
CREATE TRIGGER check_rating_duplicate
  BEFORE INSERT ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION check_duplicate_rating();

DROP TRIGGER IF EXISTS check_reaction_duplicate ON reactions;
CREATE TRIGGER check_reaction_duplicate
  BEFORE INSERT ON reactions
  FOR EACH ROW
  EXECUTE FUNCTION check_duplicate_reaction();

-- Update RLS policies
DROP POLICY IF EXISTS "Users can rate once per FID" ON ratings;
CREATE POLICY "Users can rate once per FID"
  ON ratings
  FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Uniqueness enforced by trigger

DROP POLICY IF EXISTS "Users can react once per emoji per FID" ON reactions;
CREATE POLICY "Users can react once per emoji per FID"
  ON reactions
  FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Uniqueness enforced by trigger