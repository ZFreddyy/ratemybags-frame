# RateMyBags

A decentralized app for rating and showcasing crypto portfolios.

## Contract Deployment

Since this is a WebContainer environment that doesn't support native Solidity compilation, please deploy the contract using one of these methods:

1. Use [Remix IDE](https://remix.ethereum.org):
   - Create a new file and paste the contract code from `contracts/RateMyBagsNFT.sol`
   - Install OpenZeppelin contracts from the Remix plugin manager
   - Compile and deploy to Base network
   - Copy the deployed contract address to your `.env` file

2. Use [Thirdweb](https://thirdweb.com/deploy):
   - Create a new contract
   - Paste the contract code
   - Deploy to Base network
   - Copy the deployed contract address

After deployment, add the contract address to your `.env` file:
```env
VITE_CONTRACT_ADDRESS=your_deployed_contract_address
```