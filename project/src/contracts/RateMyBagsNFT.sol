// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract RateMyBagsNFT is ERC721, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    
    mapping(address => bool) public hasMinted;
    mapping(uint256 => string) private _tokenURIs;
    
    uint256 public constant MINT_PRICE = 0.001 ether;
    
    event PortfolioMinted(address indexed owner, uint256 indexed tokenId, string tokenURI);
    
    constructor() ERC721("RateMyBags Portfolio", "RMB") Ownable(msg.sender) {}
    
    function mint(string memory tokenURI) public payable returns (uint256) {
        require(msg.value >= MINT_PRICE, "Insufficient payment");
        require(!hasMinted[msg.sender], "Already minted");
        require(bytes(tokenURI).length > 0, "URI cannot be empty");
        
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        
        _safeMint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        
        hasMinted[msg.sender] = true;
        
        emit PortfolioMinted(msg.sender, newTokenId, tokenURI);
        
        return newTokenId;
    }
    
    function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal {
        require(_ownerOf(tokenId) != address(0), "URI set for nonexistent token");
        _tokenURIs[tokenId] = _tokenURI;
    }
    
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "URI query for nonexistent token");
        return _tokenURIs[tokenId];
    }
    
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        payable(owner()).transfer(balance);
    }
    
    // Make tokens soulbound by preventing transfers
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);
        require(from == address(0), "Token transfer is disabled - Soulbound NFT");
        return super._update(to, tokenId, auth);
    }
    
    // Disable approval functions
    function approve(address, uint256) public virtual override {
        revert("Token transfer is disabled - Soulbound NFT");
    }
    
    function setApprovalForAll(address, bool) public virtual override {
        revert("Token transfer is disabled - Soulbound NFT");
    }
}