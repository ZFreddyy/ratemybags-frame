/*
  # Add RLS policies for portfolios table

  1. Changes
    - Enable RLS on portfolios table
    - Add policies for portfolio creation and viewing

  2. Security
    - Enable RLS on portfolios table
    - Add policy for authenticated users to create their own portfolio
    - Add policy for public users to view any portfolio
*/

-- Enable RLS on portfolios table
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

-- Allow users to create their own portfolio
CREATE POLICY "Users can create their own portfolio"
ON portfolios
FOR INSERT
TO authenticated
WITH CHECK (
  wallet_address = auth.uid()::text
);

-- Allow anyone to view portfolios
CREATE POLICY "Anyone can view portfolios"
ON portfolios
FOR SELECT
TO public
USING (true);