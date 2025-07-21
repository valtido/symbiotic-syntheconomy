// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title RitualStandards
 * @dev Contract for defining and managing advanced ritual interoperability standards
 * for cross-platform cultural exchange in the Symbiotic Syntheconomy.
 */
contract RitualStandards {
    // Structure to define a ritual standard
    struct RitualStandard {
        string name; // Name of the ritual standard
        string description; // Description of the ritual
        address creator; // Creator of the standard
        uint256 creationTimestamp; // Timestamp of creation
        mapping(address => bool) authorizedPlatforms; // Platforms authorized to use this standard
        uint256 platformCount; // Count of authorized platforms
    }

    // Mapping to store ritual standards by ID
    mapping(uint256 => RitualStandard) public ritualStandards;
    uint256 public standardCount;

    // Events for tracking changes
    event StandardCreated(uint256 indexed standardId, string name, address creator);
    event PlatformAuthorized(uint256 indexed standardId, address platform);
    event PlatformRevoked(uint256 indexed standardId, address platform);

    // Modifiers
    modifier onlyCreator(uint256 standardId) {
        require(msg.sender == ritualStandards[standardId].creator, "Unauthorized: Not the creator");
        _;
    }

    /**
     * @dev Creates a new ritual standard for cultural exchange.
     * @param name The name of the ritual standard.
     * @param description The description of the ritual standard.
     */
    function createStandard(string memory name, string memory description) external {
        uint256 standardId = standardCount;
        RitualStandard storage newStandard = ritualStandards[standardId];
        newStandard.name = name;
        newStandard.description = description;
        newStandard.creator = msg.sender;
        newStandard.creationTimestamp = block.timestamp;
        newStandard.platformCount = 0;

        emit StandardCreated(standardId, name, msg.sender);
        standardCount++;
    }

    /**
     * @dev Authorizes a platform to use a specific ritual standard.
     * @param standardId The ID of the ritual standard.
     * @param platform The address of the platform to authorize.
     */
    function authorizePlatform(uint256 standardId, address platform) external onlyCreator(standardId) {
        require(standardId < standardCount, "Invalid standard ID");
        require(platform != address(0), "Invalid platform address");
        require(!ritualStandards[standardId].authorizedPlatforms[platform], "Platform already authorized");

        ritualStandards[standardId].authorizedPlatforms[platform] = true;
        ritualStandards[standardId].platformCount++;
        emit PlatformAuthorized(standardId, platform);
    }

    /**
     * @dev Revokes a platform's authorization to use a specific ritual standard.
     * @param standardId The ID of the ritual standard.
     * @param platform The address of the platform to revoke.
     */
    function revokePlatform(uint256 standardId, address platform) external onlyCreator(standardId) {
        require(standardId < standardCount, "Invalid standard ID");
        require(platform != address(0), "Invalid platform address");
        require(ritualStandards[standardId].authorizedPlatforms[platform], "Platform not authorized");

        ritualStandards[standardId].authorizedPlatforms[platform] = false;
        ritualStandards[standardId].platformCount--;
        emit PlatformRevoked(standardId, platform);
    }

    /**
     * @dev Checks if a platform is authorized to use a specific ritual standard.
     * @param standardId The ID of the ritual standard.
     * @param platform The address of the platform to check.
     * @return bool Whether the platform is authorized.
     */
    function isPlatformAuthorized(uint256 standardId, address platform) external view returns (bool) {
        require(standardId < standardCount, "Invalid standard ID");
        return ritualStandards[standardId].authorizedPlatforms[platform];
    }

    /**
     * @dev Retrieves details of a specific ritual standard.
     * @param standardId The ID of the ritual standard.
     * @return name The name of the standard.
     * @return description The description of the standard.
     * @return creator The creator of the standard.
     * @return creationTimestamp The timestamp of creation.
     * @return platformCount The number of authorized platforms.
     */
    function getStandardDetails(uint256 standardId) 
        external view 
        returns (string memory name, string memory description, address creator, uint256 creationTimestamp, uint256 platformCount) 
    {
        require(standardId < standardCount, "Invalid standard ID");
        RitualStandard storage standard = ritualStandards[standardId];
        return (standard.name, standard.description, standard.creator, standard.creationTimestamp, standard.platformCount);
    }
}