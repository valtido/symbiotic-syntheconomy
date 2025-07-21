// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract RitualVerification is Ownable {
    using SafeMath for uint256;

    // Structs
    struct Ritual {
        uint256 id;
        string name;
        string description;
        address proposer;
        bool isVerified;
        uint256 stakeAmount;
        uint256 totalVotes;
        uint256 yesVotes;
        uint256 startTime;
        uint256 endTime;
        mapping(address => bool) voters;
        mapping(address => uint256) stakedAmounts;
    }

    struct CouncilMember {
        address memberAddress;
        uint256 reputation;
        bool isActive;
    }

    // State Variables
    uint256 public ritualCount;
    mapping(uint256 => Ritual) public rituals;
    mapping(address => CouncilMember) public councilMembers;
    mapping(address => uint256) public stakedBalance;
    address[] public councilMemberList;

    // Constants
    uint256 public constant VOTING_DURATION = 7 days;
    uint256 public constant MIN_STAKE = 0.1 ether;
    uint256 public constant MIN_REPUTATION = 100;
    uint256 public constant MULTI_SIG_THRESHOLD = 3; // Minimum signatures required for council decisions

    // Events
    event RitualProposed(uint256 indexed ritualId, address proposer, string name);
    event RitualVoted(uint256 indexed ritualId, address voter, bool vote, uint256 stake);
    event RitualVerified(uint256 indexed ritualId, bool isVerified);
    event StakeDeposited(address indexed staker, uint256 amount);
    event StakeWithdrawn(address indexed staker, uint256 amount);
    event CouncilDecision(uint256 indexed ritualId, bool approved);
    event CouncilMemberAdded(address indexed member, uint256 reputation);
    event CouncilMemberRemoved(address indexed member);

    // Modifiers
    modifier onlyCouncilMember() {
        require(councilMembers[msg.sender].isActive, "Not a council member");
        require(councilMembers[msg.sender].reputation >= MIN_REPUTATION, "Insufficient reputation");
        _;
    }

    modifier validRitual(uint256 ritualId) {
        require(ritualId < ritualCount, "Invalid ritual ID");
        _;
    }

    // Constructor
    constructor() {
        ritualCount = 0;
    }

    // Ritual Proposal Function
    function proposeRitual(string memory name, string memory description) external payable {
        require(msg.value >= MIN_STAKE, "Insufficient stake");

        Ritual storage newRitual = rituals[ritualCount];
        newRitual.id = ritualCount;
        newRitual.name = name;
        newRitual.description = description;
        newRitual.proposer = msg.sender;
        newRitual.isVerified = false;
        newRitual.stakeAmount = msg.value;
        newRitual.totalVotes = 0;
        newRitual.yesVotes = 0;
        newRitual.startTime = block.timestamp;
        newRitual.endTime = block.timestamp + VOTING_DURATION;

        stakedBalance[msg.sender] = stakedBalance[msg.sender].add(msg.value);
        newRitual.stakedAmounts[msg.sender] = msg.value;

        emit RitualProposed(ritualCount, msg.sender, name);
        ritualCount++;
    }

    // Voting Function
    function voteOnRitual(uint256 ritualId, bool vote) external payable validRitual(ritualId) {
        Ritual storage ritual = rituals[ritualId];
        require(block.timestamp < ritual.endTime, "Voting period ended");
        require(!ritual.voters[msg.sender], "Already voted");
        require(msg.value >= MIN_STAKE, "Insufficient stake");

        ritual.voters[msg.sender] = true;
        ritual.totalVotes = ritual.totalVotes.add(1);
        if (vote) {
            ritual.yesVotes = ritual.yesVotes.add(1);
        }

        stakedBalance[msg.sender] = stakedBalance[msg.sender].add(msg.value);
        ritual.stakedAmounts[msg.sender] = msg.value;

        emit RitualVoted(ritualId, msg.sender, vote, msg.value);
    }

    // Finalize Ritual Verification
    function finalizeRitual(uint256 ritualId) external validRitual(ritualId) {
        Ritual storage ritual = rituals[ritualId];
        require(block.timestamp >= ritual.endTime, "Voting period not ended");
        require(!ritual.isVerified, "Ritual already verified");

        uint256 approvalRate = ritual.yesVotes.mul(100).div(ritual.totalVotes);
        ritual.isVerified = approvalRate >= 60; // 60% approval threshold

        emit RitualVerified(ritualId, ritual.isVerified);
    }

    // Council Management Functions
    function addCouncilMember(address member, uint256 reputation) external onlyOwner {
        require(!councilMembers[member].isActive, "Already a council member");

        councilMembers[member] = CouncilMember({
            memberAddress: member,
            reputation: reputation,
            isActive: true
        });
        councilMemberList.push(member);

        emit CouncilMemberAdded(member, reputation);
    }

    function removeCouncilMember(address member) external onlyOwner {
        require(councilMembers[member].isActive, "Not a council member");

        councilMembers[member].isActive = false;
        emit CouncilMemberRemoved(member);
    }

    // Multi-Signature Council Decision
    mapping(uint256 => mapping(address => bool)) public councilApprovals;
    mapping(uint256 => uint256) public approvalCount;

    function councilVote(uint256 ritualId, bool approve) external onlyCouncilMember validRitual(ritualId) {
        require(!councilApprovals[ritualId][msg.sender], "Already voted");

        councilApprovals[ritualId][msg.sender] = approve;
        if (approve) {
            approvalCount[ritualId] = approvalCount[ritualId].add(1);
        }

        if (approvalCount[ritualId] >= MULTI_SIG_THRESHOLD) {
            rituals[ritualId].isVerified = true;
            emit CouncilDecision(ritualId, true);
        }
    }

    // Staking Functions
    function depositStake() external payable {
        require(msg.value >= MIN_STAKE, "Insufficient stake");
        stakedBalance[msg.sender] = stakedBalance[msg.sender].add(msg.value);
        emit StakeDeposited(msg.sender, msg.value);
    }

    function withdrawStake(uint256 amount) external {
        require(stakedBalance[msg.sender] >= amount, "Insufficient balance");
        stakedBalance[msg.sender] = stakedBalance[msg.sender].sub(amount);
        payable(msg.sender).transfer(amount);
        emit StakeWithdrawn(msg.sender, amount);
    }

    // Reputation Update for Council Members
    function updateReputation(address member, uint256 reputation) external onlyOwner {
        require(councilMembers[member].isActive, "Not a council member");
        councilMembers[member].reputation = reputation;
    }

    // Get Ritual Details
    function getRitualDetails(uint256 ritualId) external view returns (
        string memory name,
        string memory description,
        address proposer,
        bool isVerified,
        uint256 stakeAmount,
        uint256 totalVotes,
        uint256 yesVotes
    ) {
        Ritual storage ritual = rituals[ritualId];
        return (
            ritual.name,
            ritual.description,
            ritual.proposer,
            ritual.isVerified,
            ritual.stakeAmount,
            ritual.totalVotes,
            ritual.yesVotes
        );
    }
}