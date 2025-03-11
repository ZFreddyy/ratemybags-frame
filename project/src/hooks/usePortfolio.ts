import { useState, useCallback } from 'react';
import { getWalletBalances } from '../services/zapper';
import { getPortfolio } from '../services/supabase';
import { TokenBalance, AccountInfo } from '../types';
import { trackError } from '../services/analytics';

export function usePortfolio() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [holdings, setHoldings] = useState<TokenBalance[]>([]);
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [portfolioData, setPortfolioData] = useState<{
    id: string;
  } | null>(null);

  const fetchPortfolio = useCallback(async (address: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch portfolio data from Supabase
      const portfolio = await getPortfolio(address);
      setPortfolioData({
        id: portfolio.id
      });

      // Fetch token balances and account info
      const { tokens, accountInfo } = await getWalletBalances(address);
      setHoldings(tokens);
      setAccountInfo(accountInfo);
      return tokens;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch portfolio';
      setError(message);
      trackError(err as Error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    holdings,
    accountInfo,
    isPortfolioOwner: Boolean(portfolioData?.id),
    fetchPortfolio
  };
}