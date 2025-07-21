// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

interface ICrossChainBridge {
    function transmitRitualData(
        address recipient,
        bytes calldata data,
        uint256 targetChainId
    ) external returns (bool);
    function receiveRitualData() external returns (bytes memory);
}

contract CrossChainRitual is Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _ritualIds;

    // Mapping of ritual ID to ritual data
    mapping(uint256 => Ritual) public rituals;
    // Mapping of chain ID to bridge contract address
    mapping(uint256 => address) public bridgeContracts;
    // Mapping of ritual ID to participating chains
    mapping(uint256 => uint256[]) public ritualChains;

    struct Ritual {
        uint256 id;
        address creator;
        string name;
        bytes data;
        bool isActive;
        uint256 timestamp;
    }

    event RitualCreated(
        uint256 indexed ritualId,
        address indexed creator,
        string name,
        uint256 timestamp
    );
    event RitualTransmitted(
        uint256 indexed ritualId,
        uint256 targetChainId,
        address bridge,
        bool success
    );
    event RitualReceived(
        uint256 indexed ritualId,
        uint256 sourceChainId,
        bytes data
    );

    constructor() {
        _ritualIds.increment(); // Start from 1
    }

    /**
     * @dev Register a bridge contract for a specific chain
     * @param chainId The target blockchain ID
     * @param bridgeAddress The address of the bridge contract on this chain
     */
    function registerBridge(uint256 chainId, address bridgeAddress) external onlyOwner {
        require(bridgeAddress != address(0), "Invalid bridge address");
        bridgeContracts[chainId] = bridgeAddress;
    }

    /**
     * @dev Create a new ritual for cross-chain cultural exchange
     * @param name The name of the ritual
     * @param data Encoded data representing ritual details
     * @param targetChainIds Array of target chain IDs for the ritual
     */
    function createRitual(
        string memory name,
        bytes memory data,
        uint256[] memory targetChainIds
    ) external returns (uint256) {
        uint256 ritualId = _ritualIds.current();
        _ritualIds.increment();

        rituals[ritualId] = Ritual({
            id: ritualId,
            creator: msg.sender,
            name: name,
            data: data,
            isActive: true,
            timestamp: block.timestamp
        });

        ritualChains[ritualId] = targetChainIds;

        emit RitualCreated(ritualId, msg.sender, name, block.timestamp);

        // Transmit ritual to target chains
        for (uint256 i = 0; i < targetChainIds.length; i++) {
            uint256 chainId = targetChainIds[i];
            address bridge = bridgeContracts[chainId];
            if (bridge != address(0)) {
                bool success = ICrossChainBridge(bridge).transmitRitualData(
                    address(this),
                    abi.encode(ritualId, name, data),
                    chainId
                );
                emit RitualTransmitted(ritualId, chainId, bridge, success);
            }
        }

        return ritualId;
    }

    /**
     * @dev Receive ritual data from another chain via bridge
     * @param sourceChainId The ID of the source chain
     */
    function receiveRitualFromBridge(uint256 sourceChainId) external {
        address bridge = bridgeContracts[sourceChainId];
        require(bridge != address(0), "Bridge not registered for chain");
        require(msg.sender == bridge, "Unauthorized bridge");

        bytes memory receivedData = ICrossChainBridge(bridge).receiveRitualData();
        (uint256 ritualId, string memory name, bytes memory data) = 
            abi.decode(receivedData, (uint256, string, bytes));

        if (rituals[ritualId].id == 0) {
            rituals[ritualId] = Ritual({
                id: ritualId,
                creator: address(0),
                name: name,
                data: data,
                isActive: true,
                timestamp: block.timestamp
            });
        }

        emit RitualReceived(ritualId, sourceChainId, data);
    }

    /**
     * @dev Get ritual details by ID
     * @param ritualId The ID of the ritual
     * @return Ritual struct containing details
     */
    function getRitual(uint256 ritualId) external view returns (Ritual memory) {
        return rituals[ritualId];
    }

    /**
     * @dev Deactivate a ritual
     * @param ritualId The ID of the ritual to deactivate
     */
    function deactivateRitual(uint256 ritualId) external {
        require(rituals[ritualId].creator == msg.sender, "Unauthorized");
        rituals[ritualId].isActive = false;
    }
}