// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract AdvancedGovernance is Ownable {
    using SafeMath for uint256;

    // Structures
    struct Proposal {
        uint256 id;
        string description;
        address proposer;
        uint256 startTime;
        uint256 endTime;
        uint256 yesVotes;
        uint256 noVotes;
        bool executed;
        mapping(address => uint256) votes; // Quadratic voting power
        mapping(address => address) delegations; // Liquid democracy delegations
    }

    struct Voter {
        uint256 reputation; // Reputation score for weighted voting
        uint256 delegatedVotes; // Track delegated voting power
        mapping(uint256 => bool) votedProposals; // Track voted proposals
    }

    // State variables
    uint256 public proposalCount;
    uint256 public votingDuration = 7 days;
    uint256 public constant REPUTATION_THRESHOLD = 100; // Minimum reputation for voting
    mapping(uint256 => Proposal) public proposals;
    mapping(address => Voter) public voters;
    mapping(address => uint256) public culturalHeritageCouncil; // Council membership score

    // Events
    event ProposalCreated(uint256 indexed proposalId, string description, address proposer);
    event Voted(uint256 indexed proposalId, address voter, bool inSupport, uint256 weight);
    event Delegated(address indexed from, address indexed to, uint256 proposalId);
    event ProposalExecuted(uint256 indexed proposalId, bool passed);
    event ReputationUpdated(address indexed voter, uint256 newReputation);
    event CouncilMemberElected(address indexed member, uint256 score);

    // Modifiers
    modifier onlyEligibleVoter() {
        require(voters[msg.sender].reputation >= REPUTATION_THRESHOLD, "Insufficient reputation");
        _;
    }

    // Constructor
    constructor() {
        proposalCount = 0;
    }

    // Proposal Creation
    function createProposal(string memory description, uint256 duration) external onlyEligibleVoter {
        require(duration >= 1 days && duration <= 14 days, "Invalid duration");
        
        proposalCount++;
        Proposal storage newProposal = proposals[proposalCount];
        newProposal.id = proposalCount;
        newProposal.description = description;
        newProposal.proposer = msg.sender;
        newProposal.startTime = block.timestamp;
        newProposal.endTime = block.timestamp + duration;
        newProposal.executed = false;

        emit ProposalCreated(proposalCount, description, msg.sender);
    }

    // Quadratic Voting Mechanism
    function vote(uint256 proposalId, bool inSupport, uint256 voteCredits) 
        external onlyEligibleVoter {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp >= proposal.startTime && block.timestamp <= proposal.endTime, "Voting not active");
        require(!voters[msg.sender].votedProposals[proposalId], "Already voted");
        
        // Calculate quadratic voting power (square root of credits)
        uint256 votingPower = sqrt(voteCredits);
        require(votingPower > 0, "Invalid voting power");

        // Record vote
        voters[msg.sender].votedProposals[proposalId] = true;
        proposal.votes[msg.sender] = votingPower;
        if (inSupport) {
            proposal.yesVotes = proposal.yesVotes.add(votingPower);
        } else {
            proposal.noVotes = proposal.noVotes.add(votingPower);
        }

        emit Voted(proposalId, msg.sender, inSupport, votingPower);
    }

    // Liquid Democracy Delegation
    function delegateVote(uint256 proposalId, address delegatee) external onlyEligibleVoter {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp >= proposal.startTime && block.timestamp <= proposal.endTime, "Voting not active");
        require(delegatee != msg.sender, "Cannot delegate to self");
        require(proposal.delegations[msg.sender] == address(0), "Already delegated");

        proposal.delegations[msg.sender] = delegatee;
        voters[delegatee].delegatedVotes = voters[delegatee].delegatedVotes.add(voters[msg.sender].reputation);
        emit Delegated(msg.sender, delegatee, proposalId);
    }

    // Reputation Management
    function updateReputation(address voter, uint256 newReputation) external onlyOwner {
        voters[voter].reputation = newReputation;
        emit ReputationUpdated(voter, newReputation);
    }

    // Cultural Heritage Council Election
    function electCouncilMember(address candidate, uint256 score) external onlyOwner {
        culturalHeritageCouncil[candidate] = score;
        emit CouncilMemberElected(candidate, score);
    }

    // Proposal Execution
    function executeProposal(uint256 proposalId) external onlyOwner {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp > proposal.endTime, "Voting still active");
        require(!proposal.executed, "Already executed");

        proposal.executed = true;
        bool passed = proposal.yesVotes > proposal.noVotes;
        emit ProposalExecuted(proposalId, passed);
    }

    // Helper function for quadratic voting (approximate square root)
    function sqrt(uint256 x) internal pure returns (uint256 y) {
        uint256 z = (x + 1) / 2;
        y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
    }

    // Get proposal details
    function getProposal(uint256 proposalId) 
        external view 
        returns (uint256 id, string memory description, uint256 yesVotes, uint256 noVotes, bool executed) {
        Proposal storage proposal = proposals[proposalId];
        return (proposal.id, proposal.description, proposal.yesVotes, proposal.noVotes, proposal.executed);
    }

    // Get voter reputation
    function getVoterReputation(address voter) external view returns (uint256) {
        return voters[voter].reputation;
    }
}