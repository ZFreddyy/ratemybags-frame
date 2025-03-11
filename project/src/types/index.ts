export interface NativeCurrency {
  name: string;
  symbol: string;
  decimals: number;
}

export interface Chain {
  id: number;
  name: string;
  rpcUrl: string;
  nativeCurrency: NativeCurrency;
  blockExplorer: string;
}

export interface TokenBalance {
  token: string;
  amount: number;
  value: number;
  logo: string;
  network: string;
}

export interface NetworkBalances {
  chainName: string;
  balances: TokenBalance[];
  totalValue: number;
}

export interface AccountInfo {
  address: string;
  ensName: string | null;
  farcasterName: string | null;
  farcasterDisplayName: string | null;
  avatar: string | null;
}