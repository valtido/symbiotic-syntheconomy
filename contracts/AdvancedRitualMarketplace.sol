// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";

contract AdvancedRitualMarketplace is ERC721, Ownable {
    using SafeMath for uint256;

    // Ritual Token (ERC20) for staking and rewards
    IERC20 public ritualToken;
    // Uniswap Router for liquidity pool interactions
    IUniswapV2Router02 public uniswapRouter;
    // Liquidity Pool address for RITUAL/ETH pair
    address public liquidityPool;

    // Ritual structure
    struct Ritual {
        uint256 id;
        string name;
        uint256 powerLevel;
        uint256 price;
        address creator;
        bool isListed;
        uint256 stakedAmount;
        uint256 yieldRate; // Yield rate per block (in wei)
    }

    // Mapping for rituals
    mapping(uint256 => Ritual) public rituals;
    uint256 public ritualCount;

    // Staking and yield farming data
    mapping(address => uint256) public stakedBalances;
    mapping(address => uint256) public lastRewardBlock;
    uint256 public constant REWARD_RATE = 1e16; // Reward rate per block

    // Cross-chain support (placeholder for bridge integration)
    mapping(address => mapping(uint256 => uint256)) public crossChainBalances;

    // Events
    event RitualCreated(uint256 indexed id, string name, uint256 powerLevel, address creator);
    event RitualListed(uint256 indexed id, uint256 price);
    event RitualPurchased(uint256 indexed id, address buyer, uint256 price);
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event YieldClaimed(address indexed user, uint256 amount);
    event LiquidityAdded(address indexed user, uint256 ethAmount, uint256 tokenAmount);

    constructor(
        address _ritualToken,
        address _uniswapRouter,
        address _liquidityPool
    ) ERC721("RitualNFT", "RITUAL") {
        ritualToken = IERC20(_ritualToken);
        uniswapRouter = IUniswapV2Router02(_uniswapRouter);
        liquidityPool = _liquidityPool;
    }

    // Create a new ritual NFT
    function createRitual(string memory _name, uint256 _powerLevel, uint256 _yieldRate) external {
        ritualCount++;
        rituals[ritualCount] = Ritual({
            id: ritualCount,
            name: _name,
            powerLevel: _powerLevel,
            price: 0,
            creator: msg.sender,
            isListed: false,
            stakedAmount: 0,
            yieldRate: _yieldRate
        });
        _safeMint(msg.sender, ritualCount);
        emit RitualCreated(ritualCount, _name, _powerLevel, msg.sender);
    }

    // List ritual for sale
    function listRitual(uint256 _ritualId, uint256 _price) external {
        require(ownerOf(_ritualId) == msg.sender, "Not the owner");
        rituals[_ritualId].price = _price;
        rituals[_ritualId].isListed = true;
        emit RitualListed(_ritualId, _price);
    }

    // Purchase a listed ritual
    function purchaseRitual(uint256 _ritualId) external payable {
        Ritual memory ritual = rituals[_ritualId];
        require(ritual.isListed, "Ritual not listed");
        require(msg.value >= ritual.price, "Insufficient payment");

        address seller = ownerOf(_ritualId);
        payable(seller).transfer(ritual.price);
        if (msg.value > ritual.price) {
            payable(msg.sender).transfer(msg.value - ritual.price);
        }

        _transfer(seller, msg.sender, _ritualId);
        rituals[_ritualId].isListed = false;
        emit RitualPurchased(_ritualId, msg.sender, ritual.price);
    }

    // Stake RITUAL tokens for yield farming
    function stake(uint256 _amount) external {
        require(_amount > 0, "Amount must be greater than 0");
        ritualToken.transferFrom(msg.sender, address(this), _amount);
        stakedBalances[msg.sender] = stakedBalances[msg.sender].add(_amount);
        lastRewardBlock[msg.sender] = block.number;
        emit Staked(msg.sender, _amount);
    }

    // Unstake RITUAL tokens
    function unstake(uint256 _amount) external {
        require(stakedBalances[msg.sender] >= _amount, "Insufficient staked balance");
        claimYield();
        stakedBalances[msg.sender] = stakedBalances[msg.sender].sub(_amount);
        ritualToken.transfer(msg.sender, _amount);
        emit Unstaked(msg.sender, _amount);
    }

    // Claim yield rewards
    function claimYield() public {
        uint256 blocksElapsed = block.number.sub(lastRewardBlock[msg.sender]);
        uint256 reward = stakedBalances[msg.sender].mul(REWARD_RATE).mul(blocksElapsed).div(1e18);
        if (reward > 0) {
            ritualToken.transfer(msg.sender, reward);
            lastRewardBlock[msg.sender] = block.number;
            emit YieldClaimed(msg.sender, reward);
        }
    }

    // Add liquidity to Uniswap pool (RITUAL/ETH)
    function addLiquidity(uint256 _tokenAmount, uint256 _ethAmount) external payable {
        require(msg.value >= _ethAmount, "Insufficient ETH");
        ritualToken.transferFrom(msg.sender, address(this), _tokenAmount);
        ritualToken.approve(address(uniswapRouter), _tokenAmount);

        uniswapRouter.addLiquidityETH{value: _ethAmount}(
            address(ritualToken),
            _tokenAmount,
            0,
            0,
            msg.sender,
            block.timestamp + 300
        );
        emit LiquidityAdded(msg.sender, _ethAmount, _tokenAmount);
    }

    // Cross-chain transfer placeholder (to be integrated with bridge)
    function crossChainTransfer(address _to, uint256 _amount, uint256 _chainId) external {
        require(ritualToken.balanceOf(msg.sender) >= _amount, "Insufficient balance");
        ritualToken.transferFrom(msg.sender, address(this), _amount);
        crossChainBalances[_to][_chainId] = crossChainBalances[_to][_chainId].add(_amount);
    }

    // Get pending yield for a user
    function getPendingYield(address _user) public view returns (uint256) {
        uint256 blocksElapsed = block.number.sub(lastRewardBlock[_user]);
        return stakedBalances[_user].mul(REWARD_RATE).mul(blocksElapsed).div(1e18);
    }
}