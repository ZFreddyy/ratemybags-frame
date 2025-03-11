/*
  # Initial Schema Setup for RateMyBags

  1. New Tables
    - `portfolios`
      - `id` (uuid, primary key)
      - `wallet_address` (text, unique)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `ratings`
      - `id` (uuid, primary key)
      - `portfolio_id` (uuid, foreign key)
      - `rating` (integer)
      - `created_at` (timestamp)
      - `rater_address` (text)
    
    - `reactions`
      - `id` (uuid, primary key)
      - `portfolio_id` (uuid, foreign key)
      - `emoji` (text)
      - `count` (integer)
      - `reactor_address` (text)
      - `created_at` (timestamp)
    
    - `nft_mints`
      - `id` (uuid, primary key)
      - `portfolio_id` (uuid, foreign key)
      - `token_id` (integer)
      - `transaction_hash` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create portfolios table
CREATE TABLE IF NOT EXISTS portfolios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ratings table
CREATE TABLE IF NOT EXISTS ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id uuid REFERENCES portfolios(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 10),
  rater_address text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create reactions table
CREATE TABLE IF NOT EXISTS reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id uuid REFERENCES portfolios(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  count integer DEFAULT 1,
  reactor_address text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create nft_mints table
CREATE TABLE IF NOT EXISTS nft_mints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id uuid REFERENCES portfolios(id) ON DELETE CASCADE,
  token_id integer NOT NULL,
  transaction_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_mints ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view portfolios"
  ON portfolios
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can create their own portfolio"
  ON portfolios
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = wallet_address);

CREATE POLICY "Anyone can rate portfolios"
  ON ratings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can view ratings"
  ON ratings
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can add reactions"
  ON reactions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can view reactions"
  ON reactions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can view NFT mints"
  ON nft_mints
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can create their own NFT mints"
  ON nft_mints
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM portfolios
    WHERE id = portfolio_id
    AND wallet_address = auth.uid()::text
  ));