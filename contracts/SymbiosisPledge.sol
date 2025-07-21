// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SymbiosisPledge {
    // Enum for different pledge types (10 types as requested)
    enum PledgeType {
        Reforestation,
        WaterConservation,
        SoilRestoration,
        BiodiversityProtection,
        CarbonSequestration,
        RenewableEnergy,
        WasteReduction,
        SustainableAgriculture,
        CommunityEducation,
        WildlifeHabitat
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

    // Mapping to store pledges with unique IDs
    mapping(uint256 => Pledge) public pledges;
    uint256 public pledgeCounter;

    // Events for tracking actions
    event PledgeCreated(uint256 pledgeId, uint256 bioregionId, PledgeType pledgeType, string description, uint256 amount, address creator);
    event PledgeFulfilled(uint256 pledgeId, string proofHash, address fulfiller);
    event PledgeVerified(uint256 pledgeId, bool isVerified, address verifier);

    // Modifier to restrict verification to contract owner (for simplicity, can be extended to a role-based system)
    address public owner;
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can verify pledges");
        _;
    }

    constructor() {
        owner = msg.sender;
        pledgeCounter = 0;
    }

    /**
     * @dev Create a new pledge for a bioregion
     * @param bioregionId Unique identifier for the bioregion
     * @param pledgeType Type of pledge from the PledgeType enum
     * @param description Description of the pledge
     * @param amount Amount associated with the pledge (in wei or token units)
     */
    function createPledge(
        uint256 bioregionId,
        uint8 pledgeType,
        string memory description,
        uint256 amount
    ) public payable returns (uint256) {
        require(pledgeType < uint8(type(PledgeType).max) + 1, "Invalid pledge type");
        require(amount > 0, "Amount must be greater than 0");
        if (msg.value > 0) {
            require(msg.value == amount, "Sent value must match pledge amount");
        }

        uint256 pledgeId = pledgeCounter;
        pledges[pledgeId] = Pledge({
            bioregionId: bioregionId,
            pledgeType: PledgeType(pledgeType),
            description: description,
            amount: amount,
            creator: msg.sender,
            isFulfilled: false,
            proofHash: "",
            isVerified: false
        });

        pledgeCounter++;
        emit PledgeCreated(pledgeId, bioregionId, PledgeType(pledgeType), description, amount, msg.sender);
        return pledgeId;
    }

    /**
     * @dev Fulfill a pledge by submitting proof of completion
     * @param pledgeId ID of the pledge to fulfill
     * @param proofHash IPFS hash or other proof identifier for fulfillment evidence
     */
    function fulfillPledge(uint256 pledgeId, string memory proofHash) public {
        Pledge storage pledge = pledges[pledgeId];
        require(pledge.creator != address(0), "Pledge does not exist");
        require(!pledge.isFulfilled, "Pledge already fulfilled");
        require(bytes(proofHash).length > 0, "Proof hash cannot be empty");

        pledge.isFulfilled = true;
        pledge.proofHash = proofHash;
        emit PledgeFulfilled(pledgeId, proofHash, msg.sender);
    }

    /**
     * @dev Verify a fulfilled pledge (restricted to owner)
     * @param pledgeId ID of the pledge to verify
     * @param isVerified Boolean indicating if the pledge is verified
     */
    function verifyPledge(uint256 pledgeId, bool isVerified) public onlyOwner {
        Pledge storage pledge = pledges[pledgeId];
        require(pledge.creator != address(0), "Pledge does not exist");
        require(pledge.isFulfilled, "Pledge not fulfilled yet");

        pledge.isVerified = isVerified;
        emit PledgeVerified(pledgeId, isVerified, msg.sender);
    }

    /**
     * @dev Get pledge details by ID
     * @param pledgeId ID of the pledge to retrieve
     */
    function getPledge(uint256 pledgeId) public view returns (
        uint256 bioregionId,
        PledgeType pledgeType,
        string memory description,
        uint256 amount,
        address creator,
        bool isFulfilled,
        string memory proofHash,
        bool isVerified
    ) {
        Pledge memory pledge = pledges[pledgeId];
        return (
            pledge.bioregionId,
            pledge.pledgeType,
            pledge.description,
            pledge.amount,
            pledge.creator,
            pledge.isFulfilled,
            pledge.proofHash,
            pledge.isVerified
        );
    }
}