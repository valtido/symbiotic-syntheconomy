// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

// Ritual Token (RIT) for marketplace transactions and governance
contract RitualToken is ERC20, Ownable {
    using SafeMath for uint256;

    uint256 public constant MAX_SUPPLY = 100_000_000 * 10**18; // 100M tokens
    uint256 public stakingRewardRate = 5; // 5% annual reward for staking

    mapping(address => uint256) public stakedBalance;
    mapping(address => uint256) public stakingTimestamp;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 reward);

    constructor() ERC20("RitualToken", "RIT") {
        _mint(msg.sender, MAX_SUPPLY);
    }

    // Stake tokens to earn rewards
    function stake(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");

        _transfer(msg.sender, address(this), amount);
        stakedBalance[msg.sender] = stakedBalance[msg.sender].add(amount);
        stakingTimestamp[msg.sender] = block.timestamp;

        emit Staked(msg.sender, amount);
    }

    // Unstake tokens
    function unstake(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(stakedBalance[msg.sender] >= amount, "Insufficient staked balance");

        uint256 reward = calculateReward(msg.sender);
        stakedBalance[msg.sender] = stakedBalance[msg.sender].sub(amount);
        _transfer(address(this), msg.sender, amount);

        if (reward > 0) {
            _mint(msg.sender, reward);
            emit RewardClaimed(msg.sender, reward);
        }

        emit Unstaked(msg.sender, amount);
    }

    // Calculate staking rewards based on duration
    function calculateReward(address user) public view returns (uint256) {
        uint256 stakingDuration = block.timestamp.sub(stakingTimestamp[user]);
        uint256 reward = stakedBalance[user].mul(stakingRewardRate).mul(stakingDuration).div(365 days).div(100);
        return reward;
    }
}

// Ritual NFT for unique ritual ownership
contract RitualNFT is ERC721, Ownable {
    uint256 public tokenCounter;
    mapping(uint256 => string) public ritualMetadata;

    event RitualMinted(address indexed owner, uint256 tokenId, string metadata);

    constructor() ERC721("RitualNFT", "RNFT") {
        tokenCounter = 0;
    }

    // Mint a new ritual NFT
    function mintRitual(address recipient, string memory metadata) external onlyOwner returns (uint256) {
        uint256 newTokenId = tokenCounter;
        _safeMint(recipient, newTokenId);
        ritualMetadata[newTokenId] = metadata;
        tokenCounter++;

        emit RitualMinted(recipient, newTokenId, metadata);
        return newTokenId;
    }
}

// Main Ritual Marketplace with AMM and DeFi features
contract RitualMarketplace is Ownable {
    using SafeMath for uint256;

    RitualToken public ritualToken;
    RitualNFT public ritualNFT;

    // Liquidity pool for AMM (Automated Market Maker)
    uint256 public liquidityPoolBalance;
    uint256 public ritualTokenReserve;
    uint256 public constant K = 1_000_000 * 10**18; // Constant for AMM formula (x * y = k)

    struct Listing {
        uint256 tokenId;
        address seller;
        uint256 price;
        bool isActive;
    }

    mapping(uint256 => Listing) public listings;
    mapping(address => uint256) public userBalances;

    event RitualListed(uint256 indexed tokenId, address seller, uint256 price);
    event RitualPurchased(uint256 indexed tokenId, address buyer, uint256 price);
    event LiquidityAdded(address indexed provider, uint256 tokenAmount, uint256 ethAmount);
    event Swap(address indexed user, uint256 tokenIn, uint256 tokenOut);

    constructor(address _ritualToken, address _ritualNFT) {
        ritualToken = RitualToken(_ritualToken);
        ritualNFT = RitualNFT(_ritualNFT);
    }

    // List a ritual NFT for sale
    function listRitual(uint256 tokenId, uint256 price) external {
        require(ritualNFT.ownerOf(tokenId) == msg.sender, "Not the owner");
        require(price > 0, "Price must be greater than 0");

        ritualNFT.transferFrom(msg.sender, address(this), tokenId);
        listings[tokenId] = Listing(tokenId, msg.sender, price, true);

        emit RitualListed(tokenId, msg.sender, price);
    }

    // Purchase a listed ritual NFT
    function purchaseRitual(uint256 tokenId) external {
        Listing memory listing = listings[tokenId];
        require(listing.isActive, "Ritual not listed");
        require(ritualToken.balanceOf(msg.sender) >= listing.price, "Insufficient balance");

        ritualToken.transferFrom(msg.sender, listing.seller, listing.price);
        ritualNFT.transferFrom(address(this), msg.sender, tokenId);
        listings[tokenId].isActive = false;

        emit RitualPurchased(tokenId, msg.sender, listing.price);
    }

    // Add liquidity to AMM pool
    function addLiquidity(uint256 tokenAmount) external payable {
        require(tokenAmount > 0 && msg.value > 0, "Invalid amounts");

        ritualToken.transferFrom(msg.sender, address(this), tokenAmount);
        liquidityPoolBalance = liquidityPoolBalance.add(msg.value);
        ritualTokenReserve = ritualTokenReserve.add(tokenAmount);

        emit LiquidityAdded(msg.sender, tokenAmount, msg.value);
    }

    // Swap tokens using AMM (Constant Product Formula)
    function swapTokensForEth(uint256 tokenAmount) external {
        require(tokenAmount > 0, "Invalid amount");
        require(ritualTokenReserve >= tokenAmount, "Insufficient liquidity");

        uint256 ethOut = getEthAmountOut(tokenAmount);
        require(liquidityPoolBalance >= ethOut, "Insufficient ETH in pool");

        ritualToken.transferFrom(msg.sender, address(this), tokenAmount);
        ritualTokenReserve = ritualTokenReserve.add(tokenAmount);
        liquidityPoolBalance = liquidityPoolBalance.sub(ethOut);
        payable(msg.sender).transfer(ethOut);

        emit Swap(msg.sender, tokenAmount, ethOut);
    }

    // Calculate ETH output for token input using AMM formula
    function getEthAmountOut(uint256 tokenIn) public view returns (uint256) {
        uint256 newTokenReserve = ritualTokenReserve.add(tokenIn);
        uint256 newEthReserve = K.div(newTokenReserve);
        return liquidityPoolBalance.sub(newEthReserve);
    }

    // Enable cross-chain token transfers (placeholder for bridge integration)
    function crossChainTransfer(address recipient, uint256 amount, uint256 chainId) external {
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");

        ritualToken.transferFrom(msg.sender, address(this), amount);
        // Logic for cross-chain bridge integration would go here
        // Emit event or interact with bridge contract
    }

    // Fallback to receive ETH
    receive() external payable {}

    // Withdraw ETH for owner (for testing)
    function withdrawEth() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}