// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract QuadraticVoting is Ownable {
    using SafeMath for uint256;

    // Structure for Proposals
    struct Proposal {
        uint256 id;
        address creator;
        string description;
        uint256 startTime;
        uint256 endTime;
        uint256 totalVotes;
        bool executed;
        mapping(address => uint256) votes;
        mapping(address => address) delegatedTo;
    }

    // Structure for Reputation
    struct Member {
        uint256 reputation;
        bool isCouncilMember;
        uint256 lastCouncilElection;
    }

    // State variables
    uint256 public proposalCount;
    uint256 public councilElectionInterval = 365 days;
    uint256 public votingDuration = 7 days;
    mapping(uint256 => Proposal) public proposals;
    mapping(address => Member) public members;
    address[] public councilMembers;

    // Events
    event ProposalCreated(uint256 indexed proposalId, address creator, string description);
    event Voted(uint256 indexed proposalId, address voter, uint256 votes);
    event Delegated(address indexed delegator, address indexed delegatee);
    event CouncilElected(address[] newCouncil);
    event ProposalExecuted(uint256 indexed proposalId);

    // Modifiers
    modifier onlyCouncil() {
        require(members[msg.sender].isCouncilMember, "Not a council member");
        _;
    }

    constructor() {
        members[msg.sender].reputation = 1000;
        members[msg.sender].isCouncilMember = true;
        councilMembers.push(msg.sender);
    }

    // Reputation management
    function updateReputation(address member, uint256 reputation) external onlyCouncil {
        members[member].reputation = reputation;
    }

    // Proposal creation
    function createProposal(string calldata description) external {
        require(members[msg.sender].reputation > 0, "No reputation");
        
        proposalCount++;
        Proposal storage newProposal = proposals[proposalCount];
        newProposal.id = proposalCount;
        newProposal.creator = msg.sender;
        newProposal.description = description;
        newProposal.startTime = block.timestamp;
        newProposal.endTime = block.timestamp + votingDuration;
        newProposal.totalVotes = 0;
        newProposal.executed = false;

        emit ProposalCreated(proposalCount, msg.sender, description);
    }

    // Quadratic voting implementation
    function vote(uint256 proposalId, uint256 credits) external {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp >= proposal.startTime && block.timestamp <= proposal.endTime, "Voting period invalid");
        require(members[msg.sender].reputation >= credits, "Insufficient reputation");
        require(proposal.votes[msg.sender] == 0, "Already voted");

        // Quadratic voting: votes = sqrt(credits)
        uint256 votes = sqrt(credits);
        proposal.votes[msg.sender] = votes;
        proposal.totalVotes = proposal.totalVotes.add(votes);
        members[msg.sender].reputation = members[msg.sender].reputation.sub(credits);

        emit Voted(proposalId, msg.sender, votes);
    }

    // Vote delegation
    function delegateVote(address delegatee) external {
        require(members[msg.sender].reputation > 0, "No reputation");
        require(delegatee != msg.sender, "Cannot delegate to self");
        require(members[delegatee].reputation > 0, "Delegatee has no reputation");

        for (uint256 i = 1; i <= proposalCount; i++) {
            proposals[i].delegatedTo[msg.sender] = delegatee;
        }

        emit Delegated(msg.sender, delegatee);
    }

    // Council election based on reputation
    function conductCouncilElection() external {
        require(block.timestamp >= members[msg.sender].lastCouncilElection + councilElectionInterval, "Election too soon");
        
        address[] memory topMembers = new address[](5);
        uint256[] memory topReputations = new uint256[](5);

        // Simple election mechanism (top 5 by reputation)
        for (uint256 i = 0; i < 5; i++) {
            topReputations[i] = 0;
        }

        // This is a simplified version - in production, use a proper sorting algorithm
        // Due to gas limits, consider off-chain computation or pagination
        // Here we assume a small number of members

        delete councilMembers;
        for (uint256 i = 0; i < 5; i++) {
            if (topMembers[i] != address(0)) {
                councilMembers.push(topMembers[i]);
                members[topMembers[i]].isCouncilMember = true;
                members[topMembers[i]].lastCouncilElection = block.timestamp;
            }
        }

        emit CouncilElected(councilMembers);
    }

    // Execute proposal if voting successful
    function executeProposal(uint256 proposalId) external onlyCouncil {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp > proposal.endTime, "Voting still active");
        require(!proposal.executed, "Already executed");
        require(proposal.totalVotes > 0, "No votes received");

        proposal.executed = true;
        // Add custom execution logic here (e.g., fund transfers, parameter updates)
        emit ProposalExecuted(proposalId);
    }

    // Helper function for square root (Babylonian method)
    function sqrt(uint256 x) internal pure returns (uint256 y) {
        uint256 z = (x + 1) / 2;
        y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
    }

    // Set voting duration
    function setVotingDuration(uint256 duration) external onlyCouncil {
        votingDuration = duration;
    }

    // Set election interval
    function setElectionInterval(uint256 interval) external onlyCouncil {
        councilElectionInterval = interval;
    }
}