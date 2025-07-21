// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title RitualDerivatives
 * @dev A contract for creating and managing ritual derivatives and synthetic assets tied to cultural value.
 */
contract RitualDerivatives is ERC721, Ownable {
    using SafeMath for uint256;

    // Structure to represent a ritual derivative
    struct RitualDerivative {
        uint256 culturalValue; // Quantified cultural significance
        uint256 creationTimestamp; // When the derivative was created
        address creator; // Creator of the ritual derivative
        string metadataURI; // Link to metadata describing the ritual
        bool isSynthetic; // Whether this is a synthetic asset
    }

    // Mapping from token ID to RitualDerivative details
    mapping(uint256 => RitualDerivative) public derivatives;

    // Counter for token IDs
    uint256 private _tokenIdCounter;

    // Base value for synthetic asset calculation
    uint256 public constant BASE_SYNTHETIC_VALUE = 1000;

    // Events
    event DerivativeCreated(
        uint256 indexed tokenId,
        address creator,
        uint256 culturalValue,
        bool isSynthetic,
        string metadataURI
    );
    event CulturalValueUpdated(uint256 indexed tokenId, uint256 newValue);

    constructor() ERC721("RitualDerivative", "RITUAL") {
        _tokenIdCounter = 1;
    }

    /**
     * @dev Creates a new ritual derivative or synthetic asset.
     * @param culturalValue The quantified cultural value.
     * @param metadataURI URI pointing to metadata of the ritual.
     * @param isSynthetic Boolean to indicate if this is a synthetic asset.
     */
    function createDerivative(
        uint256 culturalValue,
        string memory metadataURI,
        bool isSynthetic
    ) external onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter = _tokenIdCounter.add(1);

        uint256 finalValue = isSynthetic
            ? culturalValue.mul(BASE_SYNTHETIC_VALUE)
            : culturalValue;

        derivatives[tokenId] = RitualDerivative({
            culturalValue: finalValue,
            creationTimestamp: block.timestamp,
            creator: msg.sender,
            metadataURI: metadataURI,
            isSynthetic: isSynthetic
        });

        _safeMint(msg.sender, tokenId);

        emit DerivativeCreated(
            tokenId,
            msg.sender,
            finalValue,
            isSynthetic,
            metadataURI
        );

        return tokenId;
    }

    /**
     * @dev Updates the cultural value of an existing derivative.
     * @param tokenId The ID of the token to update.
     * @param newValue The new cultural value.
     */
    function updateCulturalValue(uint256 tokenId, uint256 newValue)
        external
        onlyOwner
    {
        require(_exists(tokenId), "Token does not exist");
        RitualDerivative storage derivative = derivatives[tokenId];
        derivative.culturalValue = derivative.isSynthetic
            ? newValue.mul(BASE_SYNTHETIC_VALUE)
            : newValue;

        emit CulturalValueUpdated(tokenId, derivative.culturalValue);
    }

    /**
     * @dev Retrieves the details of a specific derivative.
     * @param tokenId The ID of the token.
     * @return culturalValue, creationTimestamp, creator, metadataURI, isSynthetic
     */
    function getDerivative(uint256 tokenId)
        external
        view
        returns (
            uint256 culturalValue,
            uint256 creationTimestamp,
            address creator,
            string memory metadataURI,
            bool isSynthetic
        )
    {
        require(_exists(tokenId), "Token does not exist");
        RitualDerivative memory derivative = derivatives[tokenId];
        return (
            derivative.culturalValue,
            derivative.creationTimestamp,
            derivative.creator,
            derivative.metadataURI,
            derivative.isSynthetic
        );
    }

    /**
     * @dev Burns a specific derivative token.
     * @param tokenId The ID of the token to burn.
     */
    function burnDerivative(uint256 tokenId) external onlyOwner {
        require(_exists(tokenId), "Token does not exist");
        delete derivatives[tokenId];
        _burn(tokenId);
    }

    /**
     * @dev Returns the current token ID counter.
     * @return Current token ID counter.
     */
    function getCurrentTokenId() external view returns (uint256) {
        return _tokenIdCounter;
    }
}