// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract GRC_RitualSubmission {
    struct Ritual {
        uint256 bioregionId;
        string ipfsHash;
        uint256 esepScore;
        uint256 cedaScore;
        bool isApproved;
        bool exists;
    }

    mapping(uint256 => Ritual) public rituals;
    uint256 public ritualCount;

    event RitualSubmitted(uint256 indexed ritualId, uint256 bioregionId, string ipfsHash, uint256 esepScore, uint256 cedaScore);
    event RitualValidated(uint256 indexed ritualId, bool isApproved);

    modifier ritualExists(uint256 ritualId) {
        require(rituals[ritualId].exists, "Ritual does not exist");
        _;
    }

    constructor() {
        ritualCount = 0;
    }

    function submitRitual(
        uint256 bioregionId,
        string memory ipfsHash,
        uint256 esepScore,
        uint256 cedaScore
    ) public returns (uint256) {
        ritualCount++;
        rituals[ritualCount] = Ritual({
            bioregionId: bioregionId,
            ipfsHash: ipfsHash,
            esepScore: esepScore,
            cedaScore: cedaScore,
            isApproved: false,
            exists: true
        });

        emit RitualSubmitted(ritualCount, bioregionId, ipfsHash, esepScore, cedaScore);
        return ritualCount;
    }

    function getRitual(uint256 ritualId) public view ritualExists(ritualId) returns (
        uint256 bioregionId,
        string memory ipfsHash,
        uint256 esepScore,
        uint256 cedaScore,
        bool isApproved
    ) {
        Ritual memory ritual = rituals[ritualId];
        return (
            ritual.bioregionId,
            ritual.ipfsHash,
            ritual.esepScore,
            ritual.cedaScore,
            ritual.isApproved
        );
    }

    function validateRitual(uint256 ritualId, bool isApproved) public ritualExists(ritualId) {
        rituals[ritualId].isApproved = isApproved;
        emit RitualValidated(ritualId, isApproved);
    }
}