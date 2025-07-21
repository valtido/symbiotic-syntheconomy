// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract RitualStaking is Ownable {
    using SafeMath for uint256;

    // Staking token (e.g., community token)
    IERC20 public stakingToken;
    // Reward token (e.g., yield farming rewards)
    IERC20 public rewardToken;

    // Ritual structure for staking
    struct Ritual {
        uint256 totalStaked;
        uint256 rewardRate; // Rewards per block per staked token
        uint256 startBlock;
        uint256 endBlock;
        bool isActive;
    }

    // Staker info
    struct Staker {
        uint256 amountStaked;
        uint256 rewardDebt;
        uint256 lastUpdateBlock;
    }

    // Mapping of ritual ID to Ritual details
    mapping(uint256 => Ritual) public rituals;
    // Mapping of user address to ritual ID to staker info
    mapping(address => mapping(uint256 => Staker)) public stakers;
    // Total rituals created
    uint256 public ritualCount;

    // Events
    event RitualCreated(uint256 ritualId, uint256 startBlock, uint256 endBlock, uint256 rewardRate);
    event Staked(address indexed user, uint256 ritualId, uint256 amount);
    event Unstaked(address indexed user, uint256 ritualId, uint256 amount);
    event RewardClaimed(address indexed user, uint256 ritualId, uint256 reward);

    constructor(IERC20 _stakingToken, IERC20 _rewardToken) {
        stakingToken = _stakingToken;
        rewardToken = _rewardToken;
    }

    // Create a new staking ritual
    function createRitual(uint256 _startBlock, uint256 _endBlock, uint256 _rewardRate) external onlyOwner {
        require(_startBlock < _endBlock, "Invalid block range");
        require(_startBlock >= block.number, "Start block must be in future");

        rituals[ritualCount] = Ritual({
            totalStaked: 0,
            rewardRate: _rewardRate,
            startBlock: _startBlock,
            endBlock: _endBlock,
            isActive: true
        });

        emit RitualCreated(ritualCount, _startBlock, _endBlock, _rewardRate);
        ritualCount++;
    }

    // Stake tokens in a ritual
    function stake(uint256 _ritualId, uint256 _amount) external {
        Ritual storage ritual = rituals[_ritualId];
        require(ritual.isActive, "Ritual is not active");
        require(block.number >= ritual.startBlock, "Ritual not started");
        require(block.number <= ritual.endBlock, "Ritual ended");
        require(_amount > 0, "Amount must be greater than 0");

        Staker storage staker = stakers[msg.sender][_ritualId];
        updateReward(msg.sender, _ritualId);

        stakingToken.transferFrom(msg.sender, address(this), _amount);
        staker.amountStaked = staker.amountStaked.add(_amount);
        ritual.totalStaked = ritual.totalStaked.add(_amount);

        emit Staked(msg.sender, _ritualId, _amount);
    }

    // Unstake tokens from a ritual
    function unstake(uint256 _ritualId, uint256 _amount) external {
        Ritual storage ritual = rituals[_ritualId];
        Staker storage staker = stakers[msg.sender][_ritualId];
        require(staker.amountStaked >= _amount, "Insufficient staked amount");
        require(_amount > 0, "Amount must be greater than 0");

        updateReward(msg.sender, _ritualId);

        staker.amountStaked = staker.amountStaked.sub(_amount);
        ritual.totalStaked = ritual.totalStaked.sub(_amount);
        stakingToken.transfer(msg.sender, _amount);

        emit Unstaked(msg.sender, _ritualId, _amount);
    }

    // Claim rewards for a ritual
    function claimReward(uint256 _ritualId) external {
        updateReward(msg.sender, _ritualId);
        Staker storage staker = stakers[msg.sender][_ritualId];
        uint256 reward = staker.rewardDebt;
        require(reward > 0, "No rewards to claim");

        staker.rewardDebt = 0;
        rewardToken.transfer(msg.sender, reward);

        emit RewardClaimed(msg.sender, _ritualId, reward);
    }

    // Update reward calculation for a user
    function updateReward(address _user, uint256 _ritualId) internal {
        Ritual storage ritual = rituals[_ritualId];
        Staker storage staker = stakers[_user][_ritualId];
        if (block.number <= ritual.startBlock) return;

        uint256 applicableBlocks = block.number > ritual.endBlock ? ritual.endBlock : block.number;
        applicableBlocks = applicableBlocks.sub(staker.lastUpdateBlock);
        if (applicableBlocks > 0 && ritual.totalStaked > 0) {
            uint256 reward = staker.amountStaked.mul(ritual.rewardRate).mul(applicableBlocks).div(1e18);
            staker.rewardDebt = staker.rewardDebt.add(reward);
        }
        staker.lastUpdateBlock = block.number > ritual.endBlock ? ritual.endBlock : block.number;
    }

    // Get pending rewards for a user in a ritual
    function getPendingReward(address _user, uint256 _ritualId) external view returns (uint256) {
        Ritual storage ritual = rituals[_ritualId];
        Staker storage staker = stakers[_user][_ritualId];
        if (block.number <= ritual.startBlock) return 0;

        uint256 applicableBlocks = block.number > ritual.endBlock ? ritual.endBlock : block.number;
        applicableBlocks = applicableBlocks.sub(staker.lastUpdateBlock);
        if (applicableBlocks > 0 && ritual.totalStaked > 0) {
            uint256 reward = staker.amountStaked.mul(ritual.rewardRate).mul(applicableBlocks).div(1e18);
            return staker.rewardDebt.add(reward);
        }
        return staker.rewardDebt;
    }

    // End a ritual (emergency stop)
    function endRitual(uint256 _ritualId) external onlyOwner {
        Ritual storage ritual = rituals[_ritualId];
        require(ritual.isActive, "Ritual already ended");
        ritual.isActive = false;
        ritual.endBlock = block.number;
    }
}