/*
  # Add USD visibility setting to portfolios

  1. Changes
    - Add `show_usd` column to portfolios table with default value of true
    - Add RLS policy to ensure only owners can update their visibility setting
    
  2. Security
    - Only portfolio owners can update their own visibility setting
    - Anyone can read the visibility setting
*/

-- Add show_usd column with default value of true
ALTER TABLE portfolios 
ADD COLUMN IF NOT EXISTS show_usd boolean DEFAULT true;

-- Create policy for updating show_usd
CREATE POLICY "Users can update their own portfolio visibility"
  ON portfolios
  FOR UPDATE
  TO authenticated
  USING (wallet_address = auth.uid()::text)
  WITH CHECK (wallet_address = auth.uid()::text);