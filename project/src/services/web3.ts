import { ethers } from 'ethers';
import { Chain } from '../types';
import { SUPPORTED_CHAINS } from './chains';
import { CONTRACT_ADDRESSES } from '../config/constants';

export async function mintPortfolioNFT(
  chain: Chain,
  tokenURI: string,
  onSuccess: (txHash: string, tokenId: number) => void,
  onError: (error: Error) => void
) {
  try {
    if (!window.ethereum) {
      throw new Error('Please install MetaMask to mint NFTs');
    }

    const contractAddress = CONTRACT_ADDRESSES[chain.id];
    if (!contractAddress) {
      throw new Error('Contract not deployed on this network');
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    // Create a minimal ABI for minting
    const minimalAbi = [
      "function mint(string memory tokenURI) public payable returns (uint256)",
      "event PortfolioMinted(address indexed owner, uint256 indexed tokenId, string tokenURI)"
    ];

    const contract = new ethers.Contract(contractAddress, minimalAbi, signer);

    const mintPrice = ethers.parseEther('0.001');
    const tx = await contract.mint(tokenURI, { value: mintPrice });
    const receipt = await tx.wait();

    // Get the token ID from the event
    const event = receipt.logs.find(
      (log: any) => log.topics[0] === ethers.id('PortfolioMinted(address,uint256,string)')
    );
    const tokenId = parseInt(event.topics[2], 16);

    onSuccess(tx.hash, tokenId);
  } catch (error) {
    onError(error instanceof Error ? error : new Error('Failed to mint NFT'));
  }
}

export async function getChainId(): Promise<number> {
  if (!window.ethereum) {
    throw new Error('Please install MetaMask');
  }

  const chainId = await window.ethereum.request({ method: 'eth_chainId' });
  return parseInt(chainId, 16);
}

export async function switchNetwork(chainId: number): Promise<void> {
  if (!window.ethereum) {
    throw new Error('Please install MetaMask to switch networks');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${chainId.toString(16)}` }],
    });
  } catch (switchError: any) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      const chain = SUPPORTED_CHAINS.find(c => c.id === chainId);
      if (!chain) {
        throw new Error('Unsupported network');
      }

      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: `0x${chainId.toString(16)}`,
              chainName: chain.name,
              nativeCurrency: chain.nativeCurrency,
              rpcUrls: [chain.rpcUrl],
              blockExplorerUrls: [chain.blockExplorer]
            },
          ],
        });
      } catch (addError) {
        throw new Error('Failed to add network to MetaMask');
      }
    } else {
      throw new Error('Failed to switch network');
    }
  }
}