// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title SymbiosisPledge
 * @dev Smart contract for coordinating ritual development and execution across AI agents
 * @author Symbiotic Syntheconomy AI Coordination System
 */
contract SymbiosisPledge is ERC721, Ownable {
    using Counters for Counters.Counter;
    using Strings for uint256;

    Counters.Counter private _tokenIds;

    struct Ritual {
        uint256 id;
        string name;
        string description;
        string bioregion;
        string culturalTradition;
        string ipfsHash;
        address creator;
        uint256 createdAt;
        RitualStatus status;
        uint256[] agentContributions;
        mapping(address => bool) hasContributed;
    }

    struct AgentContribution {
        uint256 ritualId;
        address agent;
        string contributionType; // "development", "execution", "validation"
        string ipfsHash;
        uint256 timestamp;
        bool approved;
    }

    enum RitualStatus {
        Proposed,
        InDevelopment,
        ReadyForExecution,
        Executed,
        Validated,
        Failed
    }

    mapping(uint256 => Ritual) public rituals;
    mapping(uint256 => AgentContribution) public contributions;
    mapping(address => bool) public authorizedAgents;
    mapping(address => string) public agentNames;

    uint256 public totalRituals;
    uint256 public totalContributions;

    event RitualProposed(uint256 indexed ritualId, string name, address indexed creator);
    event AgentContributionAdded(uint256 indexed ritualId, address indexed agent, string contributionType);
    event RitualStatusUpdated(uint256 indexed ritualId, RitualStatus status);
    event AgentAuthorized(address indexed agent, string name);
    event RitualExecuted(uint256 indexed ritualId, string ipfsHash);

    modifier onlyAuthorizedAgent() {
        require(authorizedAgents[msg.sender], "SymbiosisPledge: Not an authorized agent");
        _;
    }

    modifier ritualExists(uint256 ritualId) {
        require(ritualId < totalRituals, "SymbiosisPledge: Ritual does not exist");
        _;
    }

    constructor() ERC721("SymbiosisPledge", "SYMB") Ownable() {
        // Initialize with system agents
        _authorizeAgent(0x1234567890123456789012345678901234567890, "Cursor AI");
        _authorizeAgent(0x2345678901234567890123456789012345678901, "Grok AI");
        _authorizeAgent(0x3456789012345678901234567890123456789012, "ChatGPT");
    }

    /**
     * @dev Propose a new ritual for development
     */
    function proposeRitual(
        string memory name,
        string memory description,
        string memory bioregion,
        string memory culturalTradition,
        string memory ipfsHash
    ) external onlyAuthorizedAgent returns (uint256) {
        uint256 ritualId = totalRituals;

        Ritual storage ritual = rituals[ritualId];
        ritual.id = ritualId;
        ritual.name = name;
        ritual.description = description;
        ritual.bioregion = bioregion;
        ritual.culturalTradition = culturalTradition;
        ritual.ipfsHash = ipfsHash;
        ritual.creator = msg.sender;
        ritual.createdAt = block.timestamp;
        ritual.status = RitualStatus.Proposed;

        totalRituals++;

        emit RitualProposed(ritualId, name, msg.sender);
        return ritualId;
    }

    /**
     * @dev Add a contribution to a ritual
     */
    function addContribution(
        uint256 ritualId,
        string memory contributionType,
        string memory ipfsHash
    ) external onlyAuthorizedAgent ritualExists(ritualId) {
        require(rituals[ritualId].status != RitualStatus.Executed, "SymbiosisPledge: Ritual already executed");

        uint256 contributionId = totalContributions;

        AgentContribution storage contribution = contributions[contributionId];
        contribution.ritualId = ritualId;
        contribution.agent = msg.sender;
        contribution.contributionType = contributionType;
        contribution.ipfsHash = ipfsHash;
        contribution.timestamp = block.timestamp;
        contribution.approved = false;

        rituals[ritualId].agentContributions.push(contributionId);
        rituals[ritualId].hasContributed[msg.sender] = true;

        totalContributions++;

        emit AgentContributionAdded(ritualId, msg.sender, contributionType);
    }

    /**
     * @dev Update ritual status (only authorized agents can update)
     */
    function updateRitualStatus(uint256 ritualId, RitualStatus status)
        external onlyAuthorizedAgent ritualExists(ritualId) {
        require(rituals[ritualId].hasContributed[msg.sender], "SymbiosisPledge: Must contribute before updating status");

        rituals[ritualId].status = status;
        emit RitualStatusUpdated(ritualId, status);
    }

    /**
     * @dev Mark ritual as executed with IPFS hash
     */
    function executeRitual(uint256 ritualId, string memory executionIpfsHash)
        external onlyAuthorizedAgent ritualExists(ritualId) {
        require(rituals[ritualId].status == RitualStatus.ReadyForExecution, "SymbiosisPledge: Ritual not ready for execution");

        rituals[ritualId].status = RitualStatus.Executed;
        rituals[ritualId].ipfsHash = executionIpfsHash;

        emit RitualExecuted(ritualId, executionIpfsHash);
    }

    /**
     * @dev Authorize a new AI agent
     */
    function authorizeAgent(address agent, string memory name) external onlyOwner {
        _authorizeAgent(agent, name);
    }

    function _authorizeAgent(address agent, string memory name) internal {
        authorizedAgents[agent] = true;
        agentNames[agent] = name;
        emit AgentAuthorized(agent, name);
    }

    /**
     * @dev Get ritual details
     */
    function getRitual(uint256 ritualId) external view ritualExists(ritualId) returns (
        uint256 id,
        string memory name,
        string memory description,
        string memory bioregion,
        string memory culturalTradition,
        string memory ipfsHash,
        address creator,
        uint256 createdAt,
        RitualStatus status,
        uint256 contributionCount
    ) {
        Ritual storage ritual = rituals[ritualId];
        return (
            ritual.id,
            ritual.name,
            ritual.description,
            ritual.bioregion,
            ritual.culturalTradition,
            ritual.ipfsHash,
            ritual.creator,
            ritual.createdAt,
            ritual.status,
            ritual.agentContributions.length
        );
    }

    /**
     * @dev Get contribution details
     */
    function getContribution(uint256 contributionId) external view returns (
        uint256 ritualId,
        address agent,
        string memory contributionType,
        string memory ipfsHash,
        uint256 timestamp,
        bool approved
    ) {
        require(contributionId < totalContributions, "SymbiosisPledge: Contribution does not exist");

        AgentContribution storage contribution = contributions[contributionId];
        return (
            contribution.ritualId,
            contribution.agent,
            contribution.contributionType,
            contribution.ipfsHash,
            contribution.timestamp,
            contribution.approved
        );
    }

    /**
     * @dev Get agent contributions for a ritual
     */
    function getRitualContributions(uint256 ritualId) external view ritualExists(ritualId) returns (uint256[] memory) {
        return rituals[ritualId].agentContributions;
    }

    /**
     * @dev Check if agent has contributed to ritual
     */
    function hasAgentContributed(uint256 ritualId, address agent) external view ritualExists(ritualId) returns (bool) {
        return rituals[ritualId].hasContributed[agent];
    }

    /**
     * @dev Get agent name
     */
    function getAgentName(address agent) external view returns (string memory) {
        return agentNames[agent];
    }

    /**
     * @dev Override tokenURI for NFT metadata
     */
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "SymbiosisPledge: Token does not exist");

        return string(abi.encodePacked(
            "ipfs://",
            rituals[tokenId].ipfsHash
        ));
    }

    /**
     * @dev Mint NFT for completed ritual
     */
    function mintRitualNFT(uint256 ritualId) external onlyAuthorizedAgent ritualExists(ritualId) {
        require(rituals[ritualId].status == RitualStatus.Executed, "SymbiosisPledge: Ritual must be executed first");
        require(!_exists(ritualId), "SymbiosisPledge: NFT already minted");

        _mint(msg.sender, ritualId);
    }
}
