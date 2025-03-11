import { useState, useEffect, useCallback } from 'react';
import { SUPPORTED_CHAINS, DEFAULT_CHAIN_ID } from '../config/constants';
import { switchNetwork as switchWeb3Network } from '../services/web3';
import { trackEvent, trackError } from '../services/analytics';

export function useNetwork() {
  const [chainId, setChainId] = useState<number | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const checkNetwork = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
          const currentChainId = parseInt(chainIdHex, 16);
          setChainId(currentChainId);
          setIsSupported(SUPPORTED_CHAINS.includes(currentChainId));
        } catch (error) {
          trackError(error as Error);
        }
      }
    };

    checkNetwork();

    if (window.ethereum) {
      window.ethereum.on('chainChanged', (chainIdHex: string) => {
        const newChainId = parseInt(chainIdHex, 16);
        setChainId(newChainId);
        setIsSupported(SUPPORTED_CHAINS.includes(newChainId));
        trackEvent('network_changed', { chainId: newChainId });
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('chainChanged', () => {});
      }
    };
  }, []);

  const switchNetwork = useCallback(async () => {
    try {
      await switchWeb3Network(DEFAULT_CHAIN_ID);
      trackEvent('switch_network_success', { chainId: DEFAULT_CHAIN_ID });
    } catch (error) {
      trackError(error as Error);
      throw error;
    }
  }, []);

  return {
    chainId,
    isSupported,
    switchNetwork
  };
}