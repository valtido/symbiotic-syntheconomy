// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title RitualAMM
 * @dev Automated Market Maker for cultural assets with ritual-based bonding curves
 */
contract RitualAMM is Ownable {
    using SafeMath for uint256;

    // Cultural asset token
    IERC20 public culturalToken;
    // Payment token (e.g., stablecoin or native token)
    IERC20 public paymentToken;

    // Bonding curve parameters
    uint256 public constant PRECISION = 10**18;
    uint256 public slope; // Controls price increase rate
    uint256 public basePrice; // Initial price point
    uint256 public totalSupply; // Total cultural tokens in AMM pool
    uint256 public reserve; // Payment token reserve

    // Ritual parameters
    uint256 public ritualThreshold; // Minimum tokens to trigger ritual effect
    uint256 public ritualMultiplier; // Price multiplier during ritual events
    uint256 public ritualDuration; // Duration of ritual effect in blocks
    uint256 public lastRitualBlock; // Last block when ritual was triggered
    bool public ritualActive; // Current ritual status

    event TokensBought(address indexed buyer, uint256 amount, uint256 cost);
    event TokensSold(address indexed seller, uint256 amount, uint256 refund);
    event RitualTriggered(uint256 blockNumber, uint256 multiplier);

    constructor(
        address _culturalToken,
        address _paymentToken,
        uint256 _slope,
        uint256 _basePrice,
        uint256 _ritualThreshold,
        uint256 _ritualMultiplier,
        uint256 _ritualDuration
    ) {
        culturalToken = IERC20(_culturalToken);
        paymentToken = IERC20(_paymentToken);
        slope = _slope;
        basePrice = _basePrice;
        ritualThreshold = _ritualThreshold;
        ritualMultiplier = _ritualMultiplier;
        ritualDuration = _ritualDuration;
        ritualActive = false;
    }

    /**
     * @dev Calculate price for a given supply point using bonding curve
     */
    function getPrice(uint256 supply) public view returns (uint256) {
        uint256 curvePrice = basePrice.add(supply.mul(slope).div(PRECISION));
        if (ritualActive && block.number <= lastRitualBlock + ritualDuration) {
            return curvePrice.mul(ritualMultiplier).div(PRECISION);
        }
        return curvePrice;
    }

    /**
     * @dev Calculate cost to buy a specific amount of tokens
     */
    function calculateBuyCost(uint256 amount) public view returns (uint256) {
        uint256 currentSupply = totalSupply;
        uint256 totalCost = 0;
        for (uint256 i = 0; i < amount; i++) {
            totalCost = totalCost.add(getPrice(currentSupply + i));
        }
        return totalCost;
    }

    /**
     * @dev Calculate refund for selling a specific amount of tokens
     */
    function calculateSellRefund(uint256 amount) public view returns (uint256) {
        require(amount <= totalSupply, "Insufficient supply");
        uint256 currentSupply = totalSupply;
        uint256 totalRefund = 0;
        for (uint256 i = 0; i < amount; i++) {
            totalRefund = totalRefund.add(getPrice(currentSupply - i - 1));
        }
        return totalRefund.mul(95).div(100); // 5% sell fee
    }

    /**
     * @dev Buy cultural tokens from AMM
     */
    function buyTokens(uint256 amount) external {
        uint256 cost = calculateBuyCost(amount);
        require(paymentToken.transferFrom(msg.sender, address(this), cost), "Payment failed");
        reserve = reserve.add(cost);
        totalSupply = totalSupply.add(amount);
        culturalToken.transfer(msg.sender, amount);
        checkRitualTrigger(amount);
        emit TokensBought(msg.sender, amount, cost);
    }

    /**
     * @dev Sell cultural tokens to AMM
     */
    function sellTokens(uint256 amount) external {
        require(culturalToken.transferFrom(msg.sender, address(this), amount), "Token transfer failed");
        uint256 refund = calculateSellRefund(amount);
        require(reserve >= refund, "Insufficient reserve");
        reserve = reserve.sub(refund);
        totalSupply = totalSupply.sub(amount);
        paymentToken.transfer(msg.sender, refund);
        emit TokensSold(msg.sender, amount, refund);
    }

    /**
     * @dev Check if ritual should be triggered based on transaction volume
     */
    function checkRitualTrigger(uint256 amount) internal {
        if (amount >= ritualThreshold && !ritualActive) {
            ritualActive = true;
            lastRitualBlock = block.number;
            emit RitualTriggered(block.number, ritualMultiplier);
        }
        if (ritualActive && block.number > lastRitualBlock + ritualDuration) {
            ritualActive = false;
        }
    }

    /**
     * @dev Update ritual parameters (only owner)
     */
    function updateRitualParameters(
        uint256 _threshold,
        uint256 _multiplier,
        uint256 _duration
    ) external onlyOwner {
        ritualThreshold = _threshold;
        ritualMultiplier = _multiplier;
        ritualDuration = _duration;
    }

    /**
     * @dev Withdraw excess reserves (only owner)
     */
    function withdrawReserves(uint256 amount) external onlyOwner {
        require(amount <= reserve, "Insufficient reserve");
        reserve = reserve.sub(amount);
        paymentToken.transfer(owner(), amount);
    }
}