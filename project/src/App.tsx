import React, { useState, useCallback } from 'react';
import { Wallet, Flame, Gift, AlertCircle, Loader, Star, StarOff, Check } from 'lucide-react';
import { ethers } from 'ethers';
import { useNetwork } from './hooks/useNetwork';
import { usePortfolio } from './hooks/usePortfolio';
import { useContract } from './hooks/useContract';
import { trackEvent, trackError } from './services/analytics';
import { TokenBalance } from './types';
import { PortfolioChart } from './components/PortfolioChart';
import { generateNFTMetadata } from './services/metadata';
import { MINT_PRICE } from './config/constants';

interface Portfolio {
  connected: boolean;
  holdings: TokenBalance[];
  ratings: number[];
  reactions: {
    '💩': number;
    '🔥': number;
    '💎': number;
    '👍': number;
    '🤡': number;
  };
  nftMinted: boolean;
}

interface MintStatus {
  success: boolean;
  error?: string;
  txHash?: string;
}

function App() {
  const { chainId, isSupported, switchNetwork } = useNetwork();
  const { isLoading, error, holdings, accountInfo, fetchPortfolio } = usePortfolio();
  const contract = useContract();
  
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [portfolio, setPortfolio] = useState<Portfolio>({
    connected: false,
    holdings: [],
    ratings: [],
    reactions: {
      '💩': 0,
      '🔥': 0,
      '💎': 0,
      '👍': 0,
      '🤡': 0
    },
    nftMinted: false
  });

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedRating, setSelectedRating] = useState(5);
  const [showNFTPreview, setShowNFTPreview] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [mintStatus, setMintStatus] = useState<MintStatus | null>(null);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        throw new Error('Please install MetaMask to connect your wallet');
      }

      if (!isSupported) {
        await switchNetwork();
      }

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const address = accounts[0];
      setWalletAddress(address);
      
      const balances = await fetchPortfolio(address);
      
      setPortfolio(prev => ({
        ...prev,
        connected: true,
        holdings: balances
      }));

      trackEvent('wallet_connected', { address });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to connect wallet';
      trackError(error as Error);
      throw error;
    }
  };

  const submitRating = () => {
    setPortfolio(prev => ({
      ...prev,
      ratings: [...prev.ratings, selectedRating]
    }));
    setShowRatingModal(false);
  };

  const addReaction = (emoji: keyof Portfolio['reactions']) => {
    setPortfolio(prev => ({
      ...prev,
      reactions: {
        ...prev.reactions,
        [emoji]: prev.reactions[emoji] + 1
      }
    }));
  };

  const mintNFT = async () => {
    if (!contract || !walletAddress) return;

    setIsMinting(true);
    setMintStatus(null);

    try {
      const metadata = await generateNFTMetadata(
        walletAddress,
        portfolio.holdings,
        portfolio.ratings,
        portfolio.reactions
      );

      const mintPriceWei = ethers.parseEther(MINT_PRICE);
      const tx = await contract.mint(metadata, { value: mintPriceWei });
      const receipt = await tx.wait();

      const mintEvent = receipt.logs.find(
        (log: any) => log.topics[0] === ethers.id('PortfolioMinted(address,uint256,string)')
      );

      if (!mintEvent) {
        throw new Error('Mint event not found in transaction receipt');
      }

      const tokenId = parseInt(mintEvent.topics[2], 16);

      setMintStatus({
        success: true,
        txHash: tx.hash
      });

      setPortfolio(prev => ({ ...prev, nftMinted: true }));
      trackEvent('nft_minted', { tokenId, txHash: tx.hash });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to mint NFT';
      setMintStatus({
        success: false,
        error: message
      });
      trackError(error as Error);
    } finally {
      setIsMinting(false);
      setShowConfirmation(false);
    }
  };

  const topHoldings = [...portfolio.holdings]
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const totalValue = topHoldings.reduce((sum, holding) => sum + holding.value, 0);

  const holdingsWithPercentage = topHoldings.map(holding => ({
    ...holding,
    percentage: (holding.value / totalValue) * 100,
    network: holding.network.charAt(0).toUpperCase() + holding.network.slice(1)
  }));

  const averageRating = portfolio.ratings.length > 0
    ? (portfolio.ratings.reduce((a, b) => a + b, 0) / portfolio.ratings.length).toFixed(1)
    : '0.0';

  const totalReactions = Object.values(portfolio.reactions).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center p-4">
      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-xl font-bold text-gray-900">Rate This Portfolio</h3>
            <div className="flex flex-col items-center space-y-4">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setSelectedRating(rating)}
                    className={`p-0.5 rounded-full transition-colors ${
                      rating <= selectedRating
                        ? 'text-yellow-400 hover:text-yellow-500'
                        : 'text-gray-300 hover:text-gray-400'
                    }`}
                  >
                    {rating <= selectedRating ? (
                      <Star className="w-6 h-6 fill-current" />
                    ) : (
                      <StarOff className="w-6 h-6" />
                    )}
                  </button>
                ))}
              </div>
              <p className="text-2xl font-bold text-gray-900">{selectedRating}/10</p>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowRatingModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitRating}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Submit Rating
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NFT Minting Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-xl font-bold text-gray-900">Mint Portfolio NFT</h3>
            <p className="text-gray-600">
              This will create a unique NFT of your portfolio on Base network. The minting cost is {MINT_PRICE} ETH.
            </p>
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                disabled={isMinting}
              >
                Cancel
              </button>
              <button
                onClick={mintNFT}
                disabled={isMinting}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {isMinting ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Minting...</span>
                  </div>
                ) : (
                  'Confirm Mint'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">RateMyBags 💼</h1>
          <p className="opacity-90">Get Portfolio feedback from your community!</p>
          {portfolio.connected && accountInfo && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2">
                {accountInfo.avatar && (
                  <img 
                    src={accountInfo.avatar} 
                    alt="Profile" 
                    className="w-6 h-6 rounded-full"
                  />
                )}
                <p className="text-sm opacity-90">
                  {accountInfo.ensName || accountInfo.farcasterDisplayName || `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
                </p>
              </div>
              {accountInfo.ensName && accountInfo.farcasterName && (
                <p className="text-sm opacity-75">
                  {accountInfo.farcasterName && `@${accountInfo.farcasterName}`}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {!portfolio.connected ? (
            <div className="text-center py-8">
              <Wallet className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">Connect your wallet to display your portfolio</p>
              <p className="text-sm text-gray-500">NFT minting requires Base network</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Top Holdings */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Top Holdings</h3>
                <div className="space-y-1.5">
                  {holdingsWithPercentage.map((holding, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 py-2 px-3 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={holding.logo}
                          alt={holding.token}
                          className="w-6 h-6 rounded-full"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{holding.token}</p>
                          <p className="text-xs text-gray-600">{holding.network}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{holding.percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Portfolio Stats with Chart */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg flex flex-col items-center justify-center">
                  <p className="text-sm text-gray-600">Average Rating</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{averageRating}/10</p>
                  <button
                    onClick={() => setShowRatingModal(true)}
                    className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    <Star className="w-4 h-4" />
                    Add Rating
                  </button>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Distribution</p>
                  <div className="h-[120px]">
                    <PortfolioChart 
                      holdings={portfolio.holdings} 
                      totalValue={totalValue} 
                    />
                  </div>
                </div>
              </div>

              {/* Reactions */}
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Reactions</h3>
                <div className="flex justify-center gap-2">
                  {Object.entries(portfolio.reactions).map(([emoji, count]) => (
                    <button
                      key={emoji}
                      onClick={() => addReaction(emoji as keyof Portfolio['reactions'])}
                      className="flex flex-col items-center bg-gray-50 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <span className="text-2xl">{emoji}</span>
                      <span className="text-sm font-medium text-gray-600">{count}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="border-t p-6 bg-gray-50 space-y-3">
          {!portfolio.connected ? (
            <button
              onClick={connectWallet}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Wallet className="w-5 h-5" />
              )}
              <span>
                {isLoading ? 'Connecting...' : isSupported ? 'Connect Wallet' : 'Switch to Base'}
              </span>
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => setShowRatingModal(true)}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Star className="w-5 h-5" />
                <span>Rate Portfolio</span>
              </button>
              {!portfolio.nftMinted && (
                <button
                  onClick={() => setShowConfirmation(true)}
                  className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Gift className="w-5 h-5" />
                  <span>Mint NFT</span>
                </button>
              )}
            </div>
          )}
          
          {/* Mint Status */}
          {mintStatus && (
            <div className={`p-4 rounded-lg ${
              mintStatus.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {mintStatus.success ? (
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  <span>NFT minted successfully!</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  <span>{mintStatus.error}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;