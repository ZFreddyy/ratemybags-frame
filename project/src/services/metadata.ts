import { TokenBalance } from '../types';

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: {
    trait_type: string;
    value: string | number;
  }[];
}

// Browser-compatible base64 encoding
function toBase64(str: string): string {
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch (error) {
    throw new Error('Failed to encode metadata to base64');
  }
}

export async function generateNFTMetadata(
  address: string,
  holdings: TokenBalance[],
  ratings: number[],
  reactions: Record<string, number>
): Promise<string> {
  try {
    const averageRating = ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : 0;

    const totalValue = holdings.reduce((sum, token) => sum + token.value, 0);
    
    const metadata: NFTMetadata = {
      name: `RateMyBags Portfolio - ${address.slice(0, 6)}...${address.slice(-4)}`,
      description: `A snapshot of this wallet's portfolio performance and community ratings on RateMyBags.`,
      image: generatePortfolioImage(holdings),
      attributes: [
        {
          trait_type: "Total Value",
          value: `$${totalValue.toLocaleString()}`
        },
        {
          trait_type: "Community Rating",
          value: averageRating.toFixed(1)
        },
        {
          trait_type: "Number of Ratings",
          value: ratings.length
        },
        {
          trait_type: "Top Token",
          value: holdings[0]?.token || "None"
        },
        ...Object.entries(reactions).map(([emoji, count]) => ({
          trait_type: `${emoji} Reactions`,
          value: count
        }))
      ]
    };

    // Convert metadata to a data URI using browser-compatible base64 encoding
    const jsonString = JSON.stringify(metadata);
    const base64 = toBase64(jsonString);
    return `data:application/json;base64,${base64}`;
  } catch (error) {
    console.error('Metadata generation error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to generate NFT metadata');
  }
}

export function generatePortfolioImage(holdings: TokenBalance[]): string {
  return 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=1200&h=630&fit=crop';
}