// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract AdvancedRitualNFT is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    // Structure to store cultural authenticity data
    struct CulturalAuthenticity {
        string origin;
        string culturalSignificance;
        address verifiedBy;
        bool isVerified;
        uint256 verificationTimestamp;
    }

    // Mapping from token ID to cultural authenticity data
    mapping(uint256 => CulturalAuthenticity) public authenticityData;

    // Mapping for marketplace: tokenId => price
    mapping(uint256 => uint256) public tokenPrice;
    mapping(uint256 => bool) public isListedForSale;

    // Events
    event RitualNFTMinted(uint256 indexed tokenId, address indexed owner, string tokenURI);
    event CulturalAuthenticityVerified(uint256 indexed tokenId, address indexed verifier, string origin);
    event TokenListedForSale(uint256 indexed tokenId, uint256 price);
    event TokenSold(uint256 indexed tokenId, address indexed buyer, uint256 price);

    constructor() ERC721("RitualNFT", "RNFT") {}

    // Mint a new Ritual NFT with cultural data
    function mintRitualNFT(
        address recipient,
        string memory tokenURI,
        string memory origin,
        string memory culturalSignificance
    ) public onlyOwner returns (uint256) {
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        
        _mint(recipient, newItemId);
        _setTokenURI(newItemId, tokenURI);

        authenticityData[newItemId] = CulturalAuthenticity({
            origin: origin,
            culturalSignificance: culturalSignificance,
            verifiedBy: address(0),
            isVerified: false,
            verificationTimestamp: 0
        });

        emit RitualNFTMinted(newItemId, recipient, tokenURI);
        return newItemId;
    }

    // Verify cultural authenticity of an NFT
    function verifyCulturalAuthenticity(uint256 tokenId, address verifier) public onlyOwner {
        require(_exists(tokenId), "Token does not exist");
        require(!authenticityData[tokenId].isVerified, "Token already verified");

        authenticityData[tokenId].verifiedBy = verifier;
        authenticityData[tokenId].isVerified = true;
        authenticityData[tokenId].verificationTimestamp = block.timestamp;

        emit CulturalAuthenticityVerified(tokenId, verifier, authenticityData[tokenId].origin);
    }

    // List token for sale in the marketplace
    function listTokenForSale(uint256 tokenId, uint256 price) public {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not owner or approved");
        require(price > 0, "Price must be greater than 0");

        tokenPrice[tokenId] = price;
        isListedForSale[tokenId] = true;

        emit TokenListedForSale(tokenId, price);
    }

    // Buy a listed token
    function buyToken(uint256 tokenId) public payable {
        require(isListedForSale[tokenId], "Token not listed for sale");
        require(msg.value >= tokenPrice[tokenId], "Insufficient funds");

        address seller = ownerOf(tokenId);
        isListedForSale[tokenId] = false;
        tokenPrice[tokenId] = 0;

        _transfer(seller, msg.sender, tokenId);
        payable(seller).transfer(msg.value);

        emit TokenSold(tokenId, msg.sender, msg.value);
    }

    // Get cultural authenticity data for a token
    function getCulturalAuthenticity(uint256 tokenId) public view returns (CulturalAuthenticity memory) {
        require(_exists(tokenId), "Token does not exist");
        return authenticityData[tokenId];
    }

    // Withdraw funds (for contract owner)
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        payable(owner()).transfer(balance);
    }
}