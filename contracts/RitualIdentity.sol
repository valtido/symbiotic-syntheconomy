// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title RitualIdentity
 * @dev A contract for managing ritual identities and reputation systems for cultural credibility.
 */
contract RitualIdentity is Ownable {
    using SafeMath for uint256;

    // Structure to hold identity information
    struct Identity {
        address user;
        string culturalHandle; // Unique cultural identifier
        uint256 reputationScore; // Reputation based on ritual participation
        uint256 ritualCount; // Number of rituals participated in
        bool isVerified; // Verification status of identity
        mapping(address => bool) endorsedBy; // Track endorsements from other users
        uint256 endorsementCount; // Number of endorsements received
    }

    // Structure to represent a ritual
    struct Ritual {
        uint256 id;
        string name;
        string description;
        address creator;
        uint256 credibilityWeight; // Weight of ritual for reputation calculation
        bool isActive; // Status of the ritual
        mapping(address => bool) participants; // Track participants
        uint256 participantCount; // Number of participants
    }

    // Mapping to store identities by address
    mapping(address => Identity) public identities;
    // Mapping to store rituals by ID
    mapping(uint256 => Ritual) public rituals;
    // Mapping to track which rituals a user has participated in
    mapping(address => mapping(uint256 => bool)) public userRituals;
    // Counter for ritual IDs
    uint256 public ritualCounter;

    // Events
    event IdentityCreated(address indexed user, string culturalHandle);
    event IdentityVerified(address indexed user);
    event RitualCreated(uint256 indexed ritualId, string name, address indexed creator);
    event RitualJoined(address indexed user, uint256 indexed ritualId);
    event EndorsementAdded(address indexed endorser, address indexed endorsee);
    event ReputationUpdated(address indexed user, uint256 newScore);

    // Modifiers
    modifier onlyVerified(address _user) {
        require(identities[_user].isVerified, "Identity not verified");
        _;
    }

    modifier onlyExistingIdentity(address _user) {
        require(bytes(identities[_user].culturalHandle).length != 0, "Identity does not exist");
        _;
    }

    /**
     * @dev Create a new ritual identity for the caller.
     * @param _culturalHandle A unique cultural identifier for the user.
     */
    function createIdentity(string memory _culturalHandle) public {
        require(bytes(_culturalHandle).length > 0, "Cultural handle cannot be empty");
        require(bytes(identities[msg.sender].culturalHandle).length == 0, "Identity already exists");

        Identity storage newIdentity = identities[msg.sender];
        newIdentity.user = msg.sender;
        newIdentity.culturalHandle = _culturalHandle;
        newIdentity.reputationScore = 0;
        newIdentity.ritualCount = 0;
        newIdentity.isVerified = false;
        newIdentity.endorsementCount = 0;

        emit IdentityCreated(msg.sender, _culturalHandle);
    }

    /**
     * @dev Verify an identity (only by contract owner).
     * @param _user Address of the user to verify.
     */
    function verifyIdentity(address _user) public onlyOwner onlyExistingIdentity(_user) {
        require(!identities[_user].isVerified, "Identity already verified");
        identities[_user].isVerified = true;
        emit IdentityVerified(_user);
    }

    /**
     * @dev Create a new ritual.
     * @param _name Name of the ritual.
     * @param _description Description of the ritual.
     * @param _credibilityWeight Weight of the ritual for reputation scoring.
     */
    function createRitual(string memory _name, string memory _description, uint256 _credibilityWeight) public onlyVerified(msg.sender) {
        require(bytes(_name).length > 0, "Ritual name cannot be empty");
        require(_credibilityWeight > 0, "Credibility weight must be greater than 0");

        Ritual storage newRitual = rituals[ritualCounter];
        newRitual.id = ritualCounter;
        newRitual.name = _name;
        newRitual.description = _description;
        newRitual.creator = msg.sender;
        newRitual.credibilityWeight = _credibilityWeight;
        newRitual.isActive = true;
        newRitual.participantCount = 0;

        emit RitualCreated(ritualCounter, _name, msg.sender);
        ritualCounter = ritualCounter.add(1);
    }

    /**
     * @dev Join an active ritual.
     * @param _ritualId ID of the ritual to join.
     */
    function joinRitual(uint256 _ritualId) public onlyVerified(msg.sender) {
        require(_ritualId < ritualCounter, "Ritual does not exist");
        require(rituals[_ritualId].isActive, "Ritual is not active");
        require(!userRituals[msg.sender][_ritualId], "Already participated in this ritual");

        rituals[_ritualId].participants[msg.sender] = true;
        rituals[_ritualId].participantCount = rituals[_ritualId].participantCount.add(1);
        userRituals[msg.sender][_ritualId] = true;
        identities[msg.sender].ritualCount = identities[msg.sender].ritualCount.add(1);

        // Update reputation score
        uint256 reputationIncrease = rituals[_ritualId].credibilityWeight;
        identities[msg.sender].reputationScore = identities[msg.sender].reputationScore.add(reputationIncrease);

        emit RitualJoined(msg.sender, _ritualId);
        emit ReputationUpdated(msg.sender, identities[msg.sender].reputationScore);
    }

    /**
     * @dev Endorse another user's identity.
     * @param _user Address of the user to endorse.
     */
    function endorseIdentity(address _user) public onlyVerified(msg.sender) onlyExistingIdentity(_user) {
        require(_user != msg.sender, "Cannot endorse yourself");
        require(!identities[_user].endorsedBy[msg.sender], "Already endorsed this user");

        identities[_user].endorsedBy[msg.sender] = true;
        identities[_user].endorsementCount = identities[_user].endorsementCount.add(1);
        identities[_user].reputationScore = identities[_user].reputationScore.add(10); // Fixed reputation boost for endorsement

        emit EndorsementAdded(msg.sender, _user);
        emit ReputationUpdated(_user, identities[_user].reputationScore);
    }

    /**
     * @dev Get identity details for a user.
     * @param _user Address of the user.
     * @return culturalHandle, reputationScore, ritualCount, isVerified, endorsementCount
     */
    function getIdentity(address _user) public view returns (string memory, uint256, uint256, bool, uint256) {
        Identity storage identity = identities[_user];
        return (
            identity.culturalHandle,
            identity.reputationScore,
            identity.ritualCount,
            identity.isVerified,
            identity.endorsementCount
        );
    }

    /**
     * @dev Get ritual details by ID.
     * @param _ritualId ID of the ritual.
     * @return id, name, description, creator, credibilityWeight, isActive, participantCount
     */
    function getRitual(uint256 _ritualId) public view returns (uint256, string memory, string memory, address, uint256, bool, uint256) {
        Ritual storage ritual = rituals[_ritualId];
        return (
            ritual.id,
            ritual.name,
            ritual.description,
            ritual.creator,
            ritual.credibilityWeight,
            ritual.isActive,
            ritual.participantCount
        );
    }
}
