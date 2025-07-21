// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title RitualAudit
 * @dev A smart contract for auditing and securing cultural rituals as digital assets.
 * Provides mechanisms for ritual verification, access control, and integrity checks.
 */
contract RitualAudit is Ownable {
    using SafeMath for uint256;

    // Structure to store ritual metadata
    struct Ritual {
        uint256 id;
        string name;
        string description;
        address creator;
        uint256 creationTimestamp;
        uint256 lastAuditTimestamp;
        bool isVerified;
        mapping(address => bool) authorizedParticipants;
        uint256 participantCount;
    }

    // Mapping to store rituals by ID
    mapping(uint256 => Ritual) public rituals;
    uint256 public ritualCount;

    // Mapping to track auditors
    mapping(address => bool) public auditors;

    // Events for logging important actions
    event RitualCreated(uint256 indexed ritualId, string name, address creator);
    event RitualAudited(uint256 indexed ritualId, address auditor, bool verified);
    event AuditorAdded(address indexed auditor);
    event AuditorRemoved(address indexed auditor);
    event ParticipantAuthorized(uint256 indexed ritualId, address participant);
    event ParticipantRevoked(uint256 indexed ritualId, address participant);

    // Modifiers for access control
    modifier onlyAuditor() {
        require(auditors[msg.sender], "RitualAudit: Caller is not an auditor");
        _;
    }

    constructor() {
        ritualCount = 0;
    }

    /**
     * @dev Add a new auditor to the system
     * @param _auditor Address of the new auditor
     */
    function addAuditor(address _auditor) external onlyOwner {
        require(_auditor != address(0), "RitualAudit: Invalid auditor address");
        require(!auditors[_auditor], "RitualAudit: Auditor already exists");
        auditors[_auditor] = true;
        emit AuditorAdded(_auditor);
    }

    /**
     * @dev Remove an existing auditor from the system
     * @param _auditor Address of the auditor to remove
     */
    function removeAuditor(address _auditor) external onlyOwner {
        require(auditors[_auditor], "RitualAudit: Auditor does not exist");
        auditors[_auditor] = false;
        emit AuditorRemoved(_auditor);
    }

    /**
     * @dev Create a new ritual asset
     * @param _name Name of the ritual
     * @param _description Description of the ritual
     */
    function createRitual(string memory _name, string memory _description) external {
        uint256 ritualId = ritualCount;
        Ritual storage newRitual = rituals[ritualId];
        newRitual.id = ritualId;
        newRitual.name = _name;
        newRitual.description = _description;
        newRitual.creator = msg.sender;
        newRitual.creationTimestamp = block.timestamp;
        newRitual.lastAuditTimestamp = 0;
        newRitual.isVerified = false;
        newRitual.participantCount = 0;

        ritualCount = ritualCount.add(1);
        emit RitualCreated(ritualId, _name, msg.sender);
    }

    /**
     * @dev Audit a ritual for verification
     * @param _ritualId ID of the ritual to audit
     * @param _verified Verification status after audit
     */
    function auditRitual(uint256 _ritualId, bool _verified) external onlyAuditor {
        require(_ritualId < ritualCount, "RitualAudit: Invalid ritual ID");
        Ritual storage ritual = rituals[_ritualId];
        ritual.isVerified = _verified;
        ritual.lastAuditTimestamp = block.timestamp;
        emit RitualAudited(_ritualId, msg.sender, _verified);
    }

    /**
     * @dev Authorize a participant for a specific ritual
     * @param _ritualId ID of the ritual
     * @param _participant Address of the participant to authorize
     */
    function authorizeParticipant(uint256 _ritualId, address _participant) external {
        require(_ritualId < ritualCount, "RitualAudit: Invalid ritual ID");
        require(msg.sender == rituals[_ritualId].creator, "RitualAudit: Caller is not the creator");
        require(!rituals[_ritualId].authorizedParticipants[_participant], "RitualAudit: Participant already authorized");

        rituals[_ritualId].authorizedParticipants[_participant] = true;
        rituals[_ritualId].participantCount = rituals[_ritualId].participantCount.add(1);
        emit ParticipantAuthorized(_ritualId, _participant);
    }

    /**
     * @dev Revoke a participant's access to a specific ritual
     * @param _ritualId ID of the ritual
     * @param _participant Address of the participant to revoke
     */
    function revokeParticipant(uint256 _ritualId, address _participant) external {
        require(_ritualId < ritualCount, "RitualAudit: Invalid ritual ID");
        require(msg.sender == rituals[_ritualId].creator, "RitualAudit: Caller is not the creator");
        require(rituals[_ritualId].authorizedParticipants[_participant], "RitualAudit: Participant not authorized");

        rituals[_ritualId].authorizedParticipants[_participant] = false;
        rituals[_ritualId].participantCount = rituals[_ritualId].participantCount.sub(1);
        emit ParticipantRevoked(_ritualId, _participant);
    }

    /**
     * @dev Check if a participant is authorized for a ritual
     * @param _ritualId ID of the ritual
     * @param _participant Address of the participant
     * @return bool Whether the participant is authorized
     */
    function isParticipantAuthorized(uint256 _ritualId, address _participant) external view returns (bool) {
        require(_ritualId < ritualCount, "RitualAudit: Invalid ritual ID");
        return rituals[_ritualId].authorizedParticipants[_participant];
    }

    /**
     * @dev Get ritual details by ID
     * @param _ritualId ID of the ritual
     * @return Ritual details
     */
    function getRitualDetails(uint256 _ritualId) external view returns (
        uint256 id,
        string memory name,
        string memory description,
        address creator,
        uint256 creationTimestamp,
        uint256 lastAuditTimestamp,
        bool isVerified,
        uint256 participantCount
    ) {
        require(_ritualId < ritualCount, "RitualAudit: Invalid ritual ID");
        Ritual storage ritual = rituals[_ritualId];
        return (
            ritual.id,
            ritual.name,
            ritual.description,
            ritual.creator,
            ritual.creationTimestamp,
            ritual.lastAuditTimestamp,
            ritual.isVerified,
            ritual.participantCount
        );
    }
}