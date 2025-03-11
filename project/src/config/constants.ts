export const CONTRACT_ADDRESSES: { [chainId: number]: string } = {
  8453: import.meta.env.VITE_CONTRACT_ADDRESS || '', // Base Mainnet
};

// Support all networks for portfolio viewing via Zapper
export const SUPPORTED_CHAINS = [1, 8453, 137, 42161, 10]; // Ethereum, Base, Polygon, Arbitrum, Optimism

export const DEFAULT_CHAIN_ID = 8453; // Base Mainnet

export const APP_NAME = 'RateMyBags';
export const APP_DESCRIPTION = 'Rate and showcase your crypto portfolio';
export const APP_URL = 'https://ratemybags.xyz';

export const MINT_PRICE = '0.001';