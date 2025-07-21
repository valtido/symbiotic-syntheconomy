// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title RitualOracles
 * @dev Smart contract for managing advanced ritual oracles and cultural data feeds
 */
contract RitualOracles is Ownable {
    using SafeMath for uint256;

    // Structure to store cultural data
    struct CulturalData {
        string dataHash; // IPFS hash or other storage reference for cultural data
        uint256 timestamp; // When the data was recorded
        address verifier; // Address of the oracle or verifier
        bool isVerified; // Verification status
        uint256 credibilityScore; // Score representing data credibility (0-100)
    }

    // Structure to store oracle information
    struct Oracle {
        address oracleAddress; // Address of the oracle
        string name; // Name or identifier of the oracle
        uint256 reputation; // Reputation score of the oracle (0-100)
        bool isActive; // Status of the oracle
    }

    // Mapping to store cultural data entries by a unique ID
    mapping(uint256 => CulturalData) public culturalDataEntries;
    // Mapping to store registered oracles by address
    mapping(address => Oracle) public oracles;
    // Counter for cultural data entries
    uint256 public dataEntryCounter;
    // Array to store oracle addresses for enumeration
    address[] public oracleAddresses;

    // Events
    event CulturalDataSubmitted(uint256 indexed dataId, string dataHash, address verifier);
    event CulturalDataVerified(uint256 indexed dataId, address verifier, uint256 credibilityScore);
    event OracleRegistered(address indexed oracleAddress, string name);
    event OracleUpdated(address indexed oracleAddress, uint256 reputation, bool isActive);

    // Modifiers
    modifier onlyOracle() {
        require(oracles[msg.sender].isActive, "Caller is not an active oracle");
        _;
    }

    /**
     * @dev Constructor to initialize the contract
     */
    constructor() {
        dataEntryCounter = 0;
    }

    /**
     * @dev Register a new oracle
     * @param _oracleAddress Address of the oracle
     * @param _name Name or identifier of the oracle
     */
    function registerOracle(address _oracleAddress, string memory _name) external onlyOwner {
        require(_oracleAddress != address(0), "Invalid oracle address");
        require(!oracles[_oracleAddress].isActive, "Oracle already registered");

        oracles[_oracleAddress] = Oracle({
            oracleAddress: _oracleAddress,
            name: _name,
            reputation: 50, // Start with a neutral reputation
            isActive: true
        });
        oracleAddresses.push(_oracleAddress);

        emit OracleRegistered(_oracleAddress, _name);
    }

    /**
     * @dev Update oracle reputation and status
     * @param _oracleAddress Address of the oracle
     * @param _reputation New reputation score (0-100)
     * @param _isActive New status of the oracle
     */
    function updateOracle(address _oracleAddress, uint256 _reputation, bool _isActive) external onlyOwner {
        require(oracles[_oracleAddress].oracleAddress != address(0), "Oracle not found");
        require(_reputation <= 100, "Reputation score must be between 0 and 100");

        oracles[_oracleAddress].reputation = _reputation;
        oracles[_oracleAddress].isActive = _isActive;

        emit OracleUpdated(_oracleAddress, _reputation, _isActive);
    }

    /**
     * @dev Submit cultural data for verification
     * @param _dataHash IPFS hash or reference to cultural data
     */
    function submitCulturalData(string memory _dataHash) external onlyOracle {
        culturalDataEntries[dataEntryCounter] = CulturalData({
            dataHash: _dataHash,
            timestamp: block.timestamp,
            verifier: msg.sender,
            isVerified: false,
            credibilityScore: 0
        });

        emit CulturalDataSubmitted(dataEntryCounter, _dataHash, msg.sender);
        dataEntryCounter = dataEntryCounter.add(1);
    }

    /**
     * @dev Verify cultural data and assign credibility score
     * @param _dataId ID of the cultural data entry
     * @param _credibilityScore Score representing data credibility (0-100)
     */
    function verifyCulturalData(uint256 _dataId, uint256 _credibilityScore) external onlyOracle {
        require(_dataId < dataEntryCounter, "Invalid data ID");
        require(_credibilityScore <= 100, "Credibility score must be between 0 and 100");
        require(!culturalDataEntries[_dataId].isVerified, "Data already verified");

        culturalDataEntries[_dataId].isVerified = true;
        culturalDataEntries[_dataId].credibilityScore = _credibilityScore;
        culturalDataEntries[_dataId].verifier = msg.sender;

        emit CulturalDataVerified(_dataId, msg.sender, _credibilityScore);
    }

    /**
     * @dev Get cultural data by ID
     * @param _dataId ID of the cultural data entry
     * @return CulturalData structure
     */
    function getCulturalData(uint256 _dataId) external view returns (CulturalData memory) {
        require(_dataId < dataEntryCounter, "Invalid data ID");
        return culturalDataEntries[_dataId];
    }

    /**
     * @dev Get oracle information by address
     * @param _oracleAddress Address of the oracle
     * @return Oracle structure
     */
    function getOracle(address _oracleAddress) external view returns (Oracle memory) {
        require(oracles[_oracleAddress].oracleAddress != address(0), "Oracle not found");
        return oracles[_oracleAddress];
    }

    /**
     * @dev Get list of all oracle addresses
     * @return Array of oracle addresses
     */
    function getAllOracles() external view returns (address[] memory) {
        return oracleAddresses;
    }
}