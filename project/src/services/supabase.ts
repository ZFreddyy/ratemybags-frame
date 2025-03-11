import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Portfolio {
  id: string;
  wallet_address: string;
  created_at: string;
  updated_at: string;
}

export interface Rating {
  id: string;
  portfolio_id: string;
  rating: number;
  rater_address: string;
  rater_fid: string | null;
  created_at: string;
}

export interface Reaction {
  id: string;
  portfolio_id: string;
  emoji: string;
  count: number;
  reactor_address: string;
  reactor_fid: string | null;
  created_at: string;
}

export interface NFTMint {
  id: string;
  portfolio_id: string;
  token_id: number;
  transaction_hash: string;
  created_at: string;
}

export async function getPortfolio(walletAddress: string) {
  try {
    // First try to get existing portfolio
    const { data: existingPortfolio } = await supabase
      .from('portfolios')
      .select()
      .eq('wallet_address', walletAddress)
      .maybeSingle();

    if (existingPortfolio) {
      return existingPortfolio;
    }

    // Create new portfolio if none exists
    const { data: newPortfolio, error: createError } = await supabase
      .from('portfolios')
      .insert({ wallet_address: walletAddress })
      .select()
      .single();

    if (createError) throw createError;
    return newPortfolio;
  } catch (error) {
    console.error('Portfolio error:', error);
    throw error;
  }
}

export async function getRatings(portfolioId: string) {
  const { data, error } = await supabase
    .from('ratings')
    .select('*')
    .eq('portfolio_id', portfolioId);

  if (error) throw error;
  return data;
}

export async function addRating(portfolioId: string, rating: number, raterAddress: string, raterFid?: string) {
  const { data, error } = await supabase
    .from('ratings')
    .insert([{
      portfolio_id: portfolioId,
      rating,
      rater_address: raterAddress,
      rater_fid: raterFid
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getReactions(portfolioId: string) {
  const { data, error } = await supabase
    .from('reactions')
    .select('*')
    .eq('portfolio_id', portfolioId);

  if (error) throw error;
  return data;
}

export async function addReaction(
  portfolioId: string, 
  emoji: string, 
  reactorAddress: string,
  reactorFid?: string
) {
  const { data, error } = await supabase
    .from('reactions')
    .insert([{
      portfolio_id: portfolioId,
      emoji,
      reactor_address: reactorAddress,
      reactor_fid: reactorFid
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function recordNFTMint(portfolioId: string, tokenId: number, transactionHash: string) {
  const { data, error } = await supabase
    .from('nft_mints')
    .insert([{
      portfolio_id: portfolioId,
      token_id: tokenId,
      transaction_hash: transactionHash
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Set up real-time subscriptions
export function subscribeToPortfolio(portfolioId: string, callback: (payload: any) => void) {
  return supabase
    .channel(`portfolio:${portfolioId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'portfolios',
      filter: `id=eq.${portfolioId}`
    }, callback)
    .subscribe();
}

export function subscribeToRatings(portfolioId: string, callback: (payload: any) => void) {
  return supabase
    .channel(`ratings:${portfolioId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'ratings',
      filter: `portfolio_id=eq.${portfolioId}`
    }, callback)
    .subscribe();
}

export function subscribeToReactions(portfolioId: string, callback: (payload: any) => void) {
  return supabase
    .channel(`reactions:${portfolioId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'reactions',
      filter: `portfolio_id=eq.${portfolioId}`
    }, callback)
    .subscribe();
}