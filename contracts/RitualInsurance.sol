// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title RitualInsurance
 * @dev A smart contract for managing ritual insurance and risk assessment for cultural protection.
 */
contract RitualInsurance is Ownable {
    using SafeMath for uint256;

    // Structure to store insurance policy details
    struct Policy {
        uint256 policyId;
        address insured;
        uint256 premium;
        uint256 coverageAmount;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        uint256 riskScore;
        string ritualDetails;
    }

    // Structure to store claim details
    struct Claim {
        uint256 claimId;
        uint256 policyId;
        address claimant;
        uint256 amount;
        string reason;
        bool isApproved;
        bool isProcessed;
    }

    // Mappings to store policies and claims
    mapping(uint256 => Policy) public policies;
    mapping(uint256 => Claim) public claims;
    mapping(address => uint256[]) public userPolicies;
    mapping(address => uint256[]) public userClaims;

    // Counters for policy and claim IDs
    uint256 public policyCounter;
    uint256 public claimCounter;

    // Risk assessment parameters
    uint256 public constant MAX_RISK_SCORE = 100;
    uint256 public constant MIN_PREMIUM = 0.01 ether;
    uint256 public constant MIN_COVERAGE = 0.1 ether;

    // Events
    event PolicyCreated(uint256 policyId, address insured, uint256 premium, uint256 coverageAmount, uint256 riskScore);
    event ClaimSubmitted(uint256 claimId, uint256 policyId, address claimant, uint256 amount, string reason);
    event ClaimApproved(uint256 claimId, uint256 policyId, uint256 amount);
    event ClaimRejected(uint256 claimId, uint256 policyId);
    event FundsWithdrawn(address owner, uint256 amount);

    constructor() {
        policyCounter = 0;
        claimCounter = 0;
    }

    /**
     * @dev Create a new insurance policy for a ritual
     * @param coverageAmount The amount to be covered by the policy
     * @param duration The duration of the policy in seconds
     * @param ritualDetails Details about the ritual for risk assessment
     */
    function createPolicy(uint256 coverageAmount, uint256 duration, string memory ritualDetails) external payable returns (uint256) {
        require(coverageAmount >= MIN_COVERAGE, "Coverage amount too low");
        require(msg.value >= MIN_PREMIUM, "Premium too low");
        require(duration > 0, "Duration must be greater than 0");

        uint256 riskScore = calculateRiskScore(ritualDetails);
        uint256 premium = msg.value;

        policyCounter++;
        uint256 policyId = policyCounter;

        policies[policyId] = Policy({
            policyId: policyId,
            insured: msg.sender,
            premium: premium,
            coverageAmount: coverageAmount,
            startTime: block.timestamp,
            endTime: block.timestamp + duration,
            isActive: true,
            riskScore: riskScore,
            ritualDetails: ritualDetails
        });

        userPolicies[msg.sender].push(policyId);
        emit PolicyCreated(policyId, msg.sender, premium, coverageAmount, riskScore);
        return policyId;
    }

    /**
     * @dev Submit a claim for a policy
     * @param policyId The ID of the policy under which the claim is made
     * @param amount The amount claimed
     * @param reason The reason for the claim
     */
    function submitClaim(uint256 policyId, uint256 amount, string memory reason) external {
        Policy memory policy = policies[policyId];
        require(policy.insured == msg.sender, "Not the policy owner");
        require(policy.isActive, "Policy is not active");
        require(block.timestamp <= policy.endTime, "Policy expired");
        require(amount <= policy.coverageAmount, "Claim amount exceeds coverage");

        claimCounter++;
        uint256 claimId = claimCounter;

        claims[claimId] = Claim({
            claimId: claimId,
            policyId: policyId,
            claimant: msg.sender,
            amount: amount,
            reason: reason,
            isApproved: false,
            isProcessed: false
        });

        userClaims[msg.sender].push(claimId);
        emit ClaimSubmitted(claimId, policyId, msg.sender, amount, reason);
    }

    /**
     * @dev Approve or reject a claim (only owner)
     * @param claimId The ID of the claim to process
     * @param approve Whether to approve or reject the claim
     */
    function processClaim(uint256 claimId, bool approve) external onlyOwner {
        Claim storage claim = claims[claimId];
        require(!claim.isProcessed, "Claim already processed");

        claim.isApproved = approve;
        claim.isProcessed = true;

        if (approve) {
            payable(claim.claimant).transfer(claim.amount);
            emit ClaimApproved(claimId, claim.policyId, claim.amount);
        } else {
            emit ClaimRejected(claimId, claim.policyId);
        }
    }

    /**
     * @dev Calculate risk score based on ritual details (simplified for demo)
     * @param ritualDetails Details about the ritual
     */
    function calculateRiskScore(string memory ritualDetails) internal pure returns (uint256) {
        // Simplified risk calculation (in a real scenario, this could involve external oracles or complex logic)
        bytes memory detailsBytes = bytes(ritualDetails);
        return detailsBytes.length % MAX_RISK_SCORE;
    }

    /**
     * @dev Withdraw funds from the contract (only owner)
     * @param amount The amount to withdraw
     */
    function withdrawFunds(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Insufficient balance");
        payable(owner()).transfer(amount);
        emit FundsWithdrawn(owner(), amount);
    }

    /**
     * @dev Get policy details for a user
     * @param user The address of the user
     * @return Array of policy IDs
     */
    function getUserPolicies(address user) external view returns (uint256[] memory) {
        return userPolicies[user];
    }

    /**
     * @dev Get claim details for a user
     * @param user The address of the user
     * @return Array of claim IDs
     */
    function getUserClaims(address user) external view returns (uint256[] memory) {
        return userClaims[user];
    }

    // Fallback function to receive Ether
    receive() external payable {}
}