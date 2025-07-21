// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title SymbiosisPledge
 * @dev A smart contract for managing bioregional pledges on Base testnet
 */
contract SymbiosisPledge {
    // Enum for pledge types (10 types as requested)
    enum PledgeType {
        WaterConservation,
        Reforestation,
        WildlifeProtection,
        SoilRestoration,
        CarbonSequestration,
        RenewableEnergy,
        WasteReduction,
        CommunityEducation,
        BiodiversityEnhancement,
        SustainableAgriculture
    }

    // Struct to store pledge details
    struct Pledge {
        uint256 bioregionId;
        PledgeType pledgeType;
        string description;
        uint256 amount;
        address creator;
        bool isFulfilled;
        string proofHash;
        bool isVerified;
    }

    // Mapping to store pledges
    mapping(uint256 => Pledge) public pledges;
    uint256 public pledgeCount;

    // Events
    event PledgeCreated(uint256 pledgeId, uint256 bioregionId, PledgeType pledgeType, string description, uint256 amount, address creator);
    event PledgeFulfilled(uint256 pledgeId, string proofHash);
    event PledgeVerified(uint256 pledgeId, bool isVerified);

    /**
     * @dev Create a new pledge for a bioregion
     * @param bioregionId Unique identifier for the bioregion
     * @param pledgeType Type of pledge (from enum)
     * @param description Description of the pledge
     * @param amount Amount associated with the pledge (in wei)
     */
    function createPledge(
        uint256 bioregionId,
        uint8 pledgeType,
        string memory description,
        uint256 amount
    ) external payable returns (uint256) {
        require(pledgeType < uint8(type(PledgeType).max) + 1, "Invalid pledge type");
        require(msg.value == amount, "Amount mismatch with sent value");

        pledgeCount++;
        pledges[pledgeCount] = Pledge({
            bioregionId: bioregionId,
            pledgeType: PledgeType(pledgeType),
            description: description,
            amount: amount,
            creator: msg.sender,
            isFulfilled: false,
            proofHash: "",
            isVerified: false
        });

        emit PledgeCreated(pledgeCount, bioregionId, PledgeType(pledgeType), description, amount, msg.sender);
        return pledgeCount;
    }

    /**
     * @dev Fulfill a pledge by providing proof of completion
     * @param pledgeId Unique identifier of the pledge
     * @param proofHash Hash of the proof of fulfillment (e.g., IPFS hash)
     */
    function fulfillPledge(uint256 pledgeId, string memory proofHash) external {
        require(pledgeId <= pledgeCount && pledgeId > 0, "Invalid pledge ID");
        require(pledges[pledgeId].creator == msg.sender, "Only creator can fulfill pledge");
        require(!pledges[pledgeId].isFulfilled, "Pledge already fulfilled");

        pledges[pledgeId].isFulfilled = true;
        pledges[pledgeId].proofHash = proofHash;

        emit PledgeFulfilled(pledgeId, proofHash);
    }

    /**
     * @dev Verify a fulfilled pledge (restricted to contract owner or future governance)
     * @param pledgeId Unique identifier of the pledge
     * @param isVerified Verification status to set
     */
    function verifyPledge(uint256 pledgeId, bool isVerified) external {
        require(pledgeId <= pledgeCount && pledgeId > 0, "Invalid pledge ID");
        require(pledges[pledgeId].isFulfilled, "Pledge not fulfilled yet");
        // For simplicity, anyone can verify for now; in production, add access control
        pledges[pledgeId].isVerified = isVerified;

        emit PledgeVerified(pledgeId, isVerified);
    }

    /**
     * @dev Get pledge details
     * @param pledgeId Unique identifier of the pledge
     * @return Pledge details
     */
    function getPledge(uint256 pledgeId) external view returns (Pledge memory) {
        require(pledgeId <= pledgeCount && pledgeId > 0, "Invalid pledge ID");
        return pledges[pledgeId];
    }
}