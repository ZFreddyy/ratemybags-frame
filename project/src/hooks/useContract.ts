import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '../config/constants';
import { useNetwork } from './useNetwork';
import { trackError } from '../services/analytics';

const minimalAbi = [
  "function mint(string memory tokenURI) public payable returns (uint256)",
  "event PortfolioMinted(address indexed owner, uint256 indexed tokenId, string tokenURI)"
];

export function useContract() {
  const { chainId } = useNetwork();
  const [contract, setContract] = useState<ethers.Contract | null>(null);

  useEffect(() => {
    const initContract = async () => {
      if (!chainId || !window.ethereum) {
        setContract(null);
        return;
      }

      try {
        const contractAddress = CONTRACT_ADDRESSES[chainId];
        if (!contractAddress) {
          console.error(`No contract address for chain ${chainId}`);
          setContract(null);
          return;
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(contractAddress, minimalAbi, signer);
        setContract(contract);
      } catch (error) {
        console.error('Contract initialization error:', error);
        trackError(error);
        setContract(null);
      }
    };

    initContract();
  }, [chainId]);

  return contract;
}