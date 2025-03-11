import { Chain } from '../types';

export const SUPPORTED_CHAINS: Chain[] = [
  {
    id: 8453,
    name: 'Base',
    rpcUrl: 'https://mainnet.base.org',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    blockExplorer: 'https://basescan.org'
  }
];