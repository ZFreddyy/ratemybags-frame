import { supabase } from './supabase';
import { generatePortfolioImage } from './metadata';
import { TokenBalance } from '../types';

interface FrameResponse {
  image: string;
  buttons: string[];
}

export async function handleFrameAction(
  buttonIndex: number,
  fid: string,
  messageBytes: string
): Promise<FrameResponse | null> {
  try {
    switch (buttonIndex) {
      case 1: // Connect Wallet
        return {
          image: await generatePortfolioImage([]),
          buttons: [
            'Connect Wallet',
            'Rate Portfolio 🔥',
            'Add Reaction 💎'
          ]
        };
      
      case 2: // Rate Portfolio
        const { data: portfolio } = await supabase
          .from('portfolios')
          .select()
          .eq('wallet_address', messageBytes)
          .single();

        if (!portfolio) {
          throw new Error('Portfolio not found');
        }

        // Add rating from this FID
        await supabase.from('ratings').insert({
          portfolio_id: portfolio.id,
          rating: 5, // Default rating
          rater_fid: fid
        });

        return {
          image: await generatePortfolioImage([]),
          buttons: [
            'Connect Wallet',
            'Rate Portfolio 🔥',
            'Add Reaction 💎'
          ]
        };

      case 3: // Add Reaction
        const { data: targetPortfolio } = await supabase
          .from('portfolios')
          .select()
          .eq('wallet_address', messageBytes)
          .single();

        if (!targetPortfolio) {
          throw new Error('Portfolio not found');
        }

        // Add reaction from this FID
        await supabase.from('reactions').insert({
          portfolio_id: targetPortfolio.id,
          emoji: '💎',
          reactor_fid: fid
        });

        return {
          image: await generatePortfolioImage([]),
          buttons: [
            'Connect Wallet',
            'Rate Portfolio 🔥',
            'Add Reaction 💎'
          ]
        };

      default:
        return null;
    }
  } catch (error) {
    console.error('Frame action error:', error);
    throw error;
  }
}

async function generatePortfolioImage(holdings: TokenBalance[]): Promise<string> {
  // For now, return a placeholder image
  // In production, use a proper image generation service
  return 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=1200&h=630&fit=crop';
}