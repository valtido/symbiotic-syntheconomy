// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RitualDeFiProtocols
 * @dev A DeFi protocol for ritual economy and cultural value exchange.
 * This contract enables the creation, exchange, and staking of ritual tokens tied to cultural or symbolic value.
 */
contract RitualDeFiProtocols is ERC20, Ownable {
    // Mapping to store ritual metadata
    mapping(uint256 => Ritual) public rituals;
    mapping(address => uint256[]) public userRituals;

    // Staking and reward tracking
    mapping(address => uint256) public stakedBalance;
    mapping(address => uint256) public lastStakeTimestamp;
    uint256 public constant REWARD_RATE = 1; // 1 token per day per staked token (simplified)

    // Ritual structure to store cultural metadata
    struct Ritual {
        uint256 ritualId;
        string name;
        string description;
        uint256 culturalValue; // Arbitrary value representing cultural significance
        address creator;
        uint256 creationTimestamp;
        bool isActive;
    }

    // Events for tracking ritual and staking activities
    event RitualCreated(uint256 indexed ritualId, string name, address creator);
    event RitualTokenMinted(address indexed user, uint256 amount, uint256 ritualId);
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 reward);

    constructor() ERC20("RitualToken", "RIT") Ownable(msg.sender) {
        // Initial supply can be minted to the deployer or distributed later
        _mint(msg.sender, 1000000 * 10**18); // 1M tokens with 18 decimals
    }

    /**
     * @dev Create a new ritual with cultural metadata
     * @param ritualId Unique identifier for the ritual
     * @param name Name of the ritual
     * @param description Description of the ritual
     * @param culturalValue Cultural significance value
     */
    function createRitual(
        uint256 ritualId,
        string memory name,
        string memory description,
        uint256 culturalValue
    ) external {
        require(rituals[ritualId].ritualId == 0, "Ritual ID already exists");

        rituals[ritualId] = Ritual({
            ritualId: ritualId,
            name: name,
            description: description,
            culturalValue: culturalValue,
            creator: msg.sender,
            creationTimestamp: block.timestamp,
            isActive: true
        });

        userRituals[msg.sender].push(ritualId);
        emit RitualCreated(ritualId, name, msg.sender);
    }

    /**
     * @dev Mint ritual tokens tied to a specific ritual
     * @param to Address to receive the tokens
     * @param amount Amount of tokens to mint
     * @param ritualId ID of the associated ritual
     */
    function mintRitualTokens(address to, uint256 amount, uint256 ritualId) external onlyOwner {
        require(rituals[ritualId].isActive, "Ritual is not active");
        _mint(to, amount);
        emit RitualTokenMinted(to, amount, ritualId);
    }

    /**
     * @dev Stake tokens to participate in the ritual economy
     * @param amount Amount of tokens to stake
     */
    function stake(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");

        _transfer(msg.sender, address(this), amount);
        stakedBalance[msg.sender] += amount;
        lastStakeTimestamp[msg.sender] = block.timestamp;

        emit Staked(msg.sender, amount);
    }

    /**
     * @dev Unstake tokens from the ritual economy
     * @param amount Amount of tokens to unstake
     */
    function unstake(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(stakedBalance[msg.sender] >= amount, "Insufficient staked balance");

        stakedBalance[msg.sender] -= amount;
        _transfer(address(this), msg.sender, amount);

        emit Unstaked(msg.sender, amount);
    }

    /**
     * @dev Claim rewards based on staked tokens and time
     */
    function claimRewards() external {
        uint256 timeElapsed = block.timestamp - lastStakeTimestamp[msg.sender];
        uint256 reward = (stakedBalance[msg.sender] * REWARD_RATE * timeElapsed) / 1 days;
        require(reward > 0, "No rewards to claim");

        lastStakeTimestamp[msg.sender] = block.timestamp;
        _mint(msg.sender, reward);

        emit RewardClaimed(msg.sender, reward);
    }

    /**
     * @dev Get list of rituals created by a user
     * @param user Address of the user
     * @return Array of ritual IDs
     */
    function getUserRituals(address user) external view returns (uint256[] memory) {
        return userRituals[user];
    }

    /**
     * @dev Deactivate a ritual (only owner or creator)
     * @param ritualId ID of the ritual to deactivate
     */
    function deactivateRitual(uint256 ritualId) external {
        require(rituals[ritualId].ritualId != 0, "Ritual does not exist");
        require(
            msg.sender == rituals[ritualId].creator || msg.sender == owner(),
            "Unauthorized"
        );
        rituals[ritualId].isActive = false;
    }
}
