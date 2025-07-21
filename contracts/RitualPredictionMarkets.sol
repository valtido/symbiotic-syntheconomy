// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract RitualPredictionMarkets is Ownable {
    using SafeMath for uint256;

    // Struct to represent a prediction market for cultural trends
    struct Market {
        uint256 id;
        string description;
        uint256 endTime;
        bool resolved;
        uint256 yesShares;
        uint256 noShares;
        uint256 totalPool;
        mapping(address => uint256) yesBets;
        mapping(address => uint256) noBets;
        bool outcome;
    }

    // Struct to represent a ritual event influencing trends
    struct Ritual {
        uint256 id;
        string name;
        uint256 timestamp;
        uint256 influenceScore;
        mapping(uint256 => uint256) marketImpacts; // Market ID to impact weight
    }

    // State variables
    uint256 public marketCount;
    uint256 public ritualCount;
    mapping(uint256 => Market) public markets;
    mapping(uint256 => Ritual) public rituals;
    mapping(address => uint256) public userBalances;

    // Events
    event MarketCreated(uint256 indexed marketId, string description, uint256 endTime);
    event RitualRecorded(uint256 indexed ritualId, string name, uint256 timestamp, uint256 influenceScore);
    event BetPlaced(uint256 indexed marketId, address indexed user, bool yes, uint256 amount);
    event MarketResolved(uint256 indexed marketId, bool outcome, uint256 totalPool);
    event Withdrawal(address indexed user, uint256 amount);

    // Modifiers
    modifier marketExists(uint256 marketId) {
        require(marketId > 0 && marketId <= marketCount, "Market does not exist");
        _;
    }

    modifier ritualExists(uint256 ritualId) {
        require(ritualId > 0 && ritualId <= ritualCount, "Ritual does not exist");
        _;
    }

    modifier notResolved(uint256 marketId) {
        require(!markets[marketId].resolved, "Market already resolved");
        _;
    }

    // Constructor
    constructor() {
        marketCount = 0;
        ritualCount = 0;
    }

    // Create a new prediction market for cultural trend forecasting
    function createMarket(string memory description, uint256 duration) external onlyOwner {
        marketCount++;
        Market storage newMarket = markets[marketCount];
        newMarket.id = marketCount;
        newMarket.description = description;
        newMarket.endTime = block.timestamp.add(duration);
        newMarket.resolved = false;
        newMarket.yesShares = 0;
        newMarket.noShares = 0;
        newMarket.totalPool = 0;

        emit MarketCreated(marketCount, description, newMarket.endTime);
    }

    // Record a cultural ritual event
    function recordRitual(string memory name, uint256 influenceScore, uint256[] memory impactedMarketIds, uint256[] memory impactWeights) external onlyOwner {
        require(impactedMarketIds.length == impactWeights.length, "Arrays length mismatch");

        ritualCount++;
        Ritual storage newRitual = rituals[ritualCount];
        newRitual.id = ritualCount;
        newRitual.name = name;
        newRitual.timestamp = block.timestamp;
        newRitual.influenceScore = influenceScore;

        for (uint256 i = 0; i < impactedMarketIds.length; i++) {
            require(impactedMarketIds[i] <= marketCount, "Invalid market ID");
            newRitual.marketImpacts[impactedMarketIds[i]] = impactWeights[i];
        }

        emit RitualRecorded(ritualCount, name, block.timestamp, influenceScore);
    }

    // Place a bet on a market (Yes or No outcome)
    function placeBet(uint256 marketId, bool yes) external payable marketExists(marketId) notResolved(marketId) {
        require(msg.value > 0, "Bet amount must be greater than 0");
        require(block.timestamp < markets[marketId].endTime, "Market has ended");

        Market storage market = markets[marketId];
        if (yes) {
            market.yesShares = market.yesShares.add(msg.value);
            market.yesBets[msg.sender] = market.yesBets[msg.sender].add(msg.value);
        } else {
            market.noShares = market.noShares.add(msg.value);
            market.noBets[msg.sender] = market.noBets[msg.sender].add(msg.value);
        }
        market.totalPool = market.totalPool.add(msg.value);

        emit BetPlaced(marketId, msg.sender, yes, msg.value);
    }

    // Resolve a market based on the outcome
    function resolveMarket(uint256 marketId, bool outcome) external onlyOwner marketExists(marketId) notResolved(marketId) {
        require(block.timestamp >= markets[marketId].endTime, "Market has not ended yet");

        Market storage market = markets[marketId];
        market.resolved = true;
        market.outcome = outcome;

        emit MarketResolved(marketId, outcome, market.totalPool);
    }

    // Claim winnings after market resolution
    function claimWinnings(uint256 marketId) external marketExists(marketId) {
        Market storage market = markets[marketId];
        require(market.resolved, "Market not resolved yet");

        uint256 userShare;
        uint256 winningPool = market.outcome ? market.yesShares : market.noShares;
        uint256 userBet = market.outcome ? market.yesBets[msg.sender] : market.noBets[msg.sender];

        if (winningPool > 0 && userBet > 0) {
            userShare = userBet.mul(market.totalPool).div(winningPool);
            userBalances[msg.sender] = userBalances[msg.sender].add(userShare);
            if (market.outcome) {
                market.yesBets[msg.sender] = 0;
            } else {
                market.noBets[msg.sender] = 0;
            }
        }
    }

    // Withdraw winnings from user balance
    function withdraw() external {
        uint256 balance = userBalances[msg.sender];
        require(balance > 0, "No balance to withdraw");

        userBalances[msg.sender] = 0;
        payable(msg.sender).transfer(balance);

        emit Withdrawal(msg.sender, balance);
    }

    // Get market details
    function getMarketDetails(uint256 marketId) external view marketExists(marketId) returns (string memory description, uint256 endTime, bool resolved, uint256 yesShares, uint256 noShares, uint256 totalPool, bool outcome) {
        Market storage market = markets[marketId];
        return (market.description, market.endTime, market.resolved, market.yesShares, market.noShares, market.totalPool, market.outcome);
    }

    // Get ritual influence on a specific market
    function getRitualImpact(uint256 ritualId, uint256 marketId) external view ritualExists(ritualId) marketExists(marketId) returns (uint256 impactWeight) {
        return rituals[ritualId].marketImpacts[marketId];
    }
}