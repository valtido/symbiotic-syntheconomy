// contracts/GRC_RitualSubmission.sol

// Add this to your existing Ritual struct
struct Ritual {
    string name;
    string description;
    address[] participants;
    uint256 timestamp;
    bool isInvalidated; // ✅ New field
    // ... other fields
}

// Event declaration
event RitualInvalidated(uint256 indexed ritualId, address indexed triggeredBy, uint256 timestamp);

// Function to invalidate a ritual
function invalidateRitual(uint256 ritualId) external onlyOwner {
    require(ritualId < rituals.length, "Invalid ritualId");
    Ritual storage ritual = rituals[ritualId];
    require(!ritual.isInvalidated, "Ritual already invalidated");

    ritual.isInvalidated = true;
    emit RitualInvalidated(ritualId, msg.sender, block.timestamp);
}