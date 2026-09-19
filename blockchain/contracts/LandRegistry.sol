// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title LandRegistry
 * @notice Production-grade, tamper-resistant smart contract for decentralized land registration
 *         and ownership provenance tracking.
 * @dev Employs OpenZeppelin AccessControl, Pausable, and ReentrancyGuard.
 */
contract LandRegistry is AccessControl, ReentrancyGuard, Pausable {
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");

    enum LandStatus {
        PENDING,
        REGISTERED,
        TRANSFER_PENDING,
        TRANSFERRED,
        REJECTED,
        SUSPENDED
    }

    struct LandRecord {
        string propertyId;
        string surveyNumber;
        address owner;
        bytes32 documentHash;
        bytes32 metadataHash;
        LandStatus status;
        uint256 registrationTimestamp;
        bool exists;
        bool isActive;
    }

    struct OwnershipRecord {
        address previousOwner;
        address newOwner;
        uint256 transferredAt;
        string transferTxRef;
    }

    // Property ID => Land Record
    mapping(string => LandRecord) private _lands;

    // Property ID => Historical Provenance Records
    mapping(string => OwnershipRecord[]) private _ownershipHistories;

    // List of all registered property IDs for enumeration
    string[] private _allPropertyIds;

    // Events
    event LandRegistered(
        string indexed propertyId,
        string surveyNumber,
        address indexed owner,
        bytes32 documentHash,
        uint256 timestamp
    );

    event OwnershipTransferred(
        string indexed propertyId,
        address indexed previousOwner,
        address indexed newOwner,
        uint256 timestamp,
        string transferTxRef
    );

    event LandStatusChanged(
        string indexed propertyId,
        LandStatus previousStatus,
        LandStatus newStatus,
        uint256 timestamp
    );

    event DocumentVerified(
        string indexed propertyId,
        bytes32 submittedHash,
        bool isMatch,
        uint256 timestamp
    );

    constructor(address defaultAdmin, address defaultRegistrar) {
        require(defaultAdmin != address(0), "LandRegistry: Admin cannot be zero address");
        require(defaultRegistrar != address(0), "LandRegistry: Registrar cannot be zero address");

        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(REGISTRAR_ROLE, defaultRegistrar);
    }

    /**
     * @notice Registers a new land record on-chain.
     * @dev Only authorized registrar or admin can invoke.
     */
    function registerLand(
        string calldata propertyId,
        string calldata surveyNumber,
        address owner,
        bytes32 documentHash,
        bytes32 metadataHash
    ) external onlyRole(REGISTRAR_ROLE) whenNotPaused nonReentrant {
        require(bytes(propertyId).length > 0, "LandRegistry: Property ID cannot be empty");
        require(bytes(surveyNumber).length > 0, "LandRegistry: Survey number cannot be empty");
        require(owner != address(0), "LandRegistry: Owner cannot be zero address");
        require(documentHash != bytes32(0), "LandRegistry: Document hash cannot be zero");
        require(!_lands[propertyId].exists, "LandRegistry: Property ID already registered");

        _lands[propertyId] = LandRecord({
            propertyId: propertyId,
            surveyNumber: surveyNumber,
            owner: owner,
            documentHash: documentHash,
            metadataHash: metadataHash,
            status: LandStatus.REGISTERED,
            registrationTimestamp: block.timestamp,
            exists: true,
            isActive: true
        });

        _allPropertyIds.push(propertyId);

        // Record genesis ownership
        _ownershipHistories[propertyId].push(
            OwnershipRecord({
                previousOwner: address(0),
                newOwner: owner,
                transferredAt: block.timestamp,
                transferTxRef: "GENESIS_REGISTRATION"
            })
        );

        emit LandRegistered(propertyId, surveyNumber, owner, documentHash, block.timestamp);
    }

    /**
     * @notice Transfers ownership of an existing property to a new owner.
     * @dev Authorized government registrar executes transfer following off-chain legal verification.
     */
    function transferOwnership(
        string calldata propertyId,
        address newOwner,
        string calldata transferTxRef
    ) external onlyRole(REGISTRAR_ROLE) whenNotPaused nonReentrant {
        require(_lands[propertyId].exists, "LandRegistry: Property does not exist");
        require(_lands[propertyId].isActive, "LandRegistry: Property is suspended or inactive");
        require(newOwner != address(0), "LandRegistry: New owner cannot be zero address");
        require(newOwner != _lands[propertyId].owner, "LandRegistry: New owner must be different from current owner");

        address previousOwner = _lands[propertyId].owner;
        _lands[propertyId].owner = newOwner;
        _lands[propertyId].status = LandStatus.TRANSFERRED;

        _ownershipHistories[propertyId].push(
            OwnershipRecord({
                previousOwner: previousOwner,
                newOwner: newOwner,
                transferredAt: block.timestamp,
                transferTxRef: transferTxRef
            })
        );

        emit OwnershipTransferred(
            propertyId,
            previousOwner,
            newOwner,
            block.timestamp,
            transferTxRef
        );
    }

    /**
     * @notice Updates the administrative status of a land parcel (e.g. SUSPENDED, REJECTED).
     */
    function updateLandStatus(
        string calldata propertyId,
        LandStatus newStatus
    ) external onlyRole(REGISTRAR_ROLE) whenNotPaused {
        require(_lands[propertyId].exists, "LandRegistry: Property does not exist");

        LandStatus oldStatus = _lands[propertyId].status;
        _lands[propertyId].status = newStatus;

        if (newStatus == LandStatus.SUSPENDED || newStatus == LandStatus.REJECTED) {
            _lands[propertyId].isActive = false;
        } else if (newStatus == LandStatus.REGISTERED || newStatus == LandStatus.TRANSFERRED) {
            _lands[propertyId].isActive = true;
        }

        emit LandStatusChanged(propertyId, oldStatus, newStatus, block.timestamp);
    }

    /**
     * @notice Verifies whether a submitted document SHA-256 hash matches the on-chain immutable hash.
     */
    function verifyDocumentHash(
        string calldata propertyId,
        bytes32 documentHash
    ) external returns (bool isMatch, uint256 registeredAt) {
        require(_lands[propertyId].exists, "LandRegistry: Property does not exist");

        isMatch = (_lands[propertyId].documentHash == documentHash);
        registeredAt = _lands[propertyId].registrationTimestamp;

        emit DocumentVerified(propertyId, documentHash, isMatch, block.timestamp);
        return (isMatch, registeredAt);
    }

    /**
     * @notice Returns comprehensive details for a given property ID.
     */
    function getLand(string calldata propertyId) external view returns (LandRecord memory) {
        require(_lands[propertyId].exists, "LandRegistry: Property does not exist");
        return _lands[propertyId];
    }

    /**
     * @notice Checks if a property ID is registered on-chain.
     */
    function landExists(string calldata propertyId) external view returns (bool) {
        return _lands[propertyId].exists;
    }

    /**
     * @notice Returns the current owner address for a property ID.
     */
    function getOwner(string calldata propertyId) external view returns (address) {
        require(_lands[propertyId].exists, "LandRegistry: Property does not exist");
        return _lands[propertyId].owner;
    }

    /**
     * @notice Returns complete historical ownership chain for a property.
     */
    function getOwnershipHistory(
        string calldata propertyId
    ) external view returns (OwnershipRecord[] memory) {
        require(_lands[propertyId].exists, "LandRegistry: Property does not exist");
        return _ownershipHistories[propertyId];
    }

    /**
     * @notice Total number of registered properties.
     */
    function getTotalLands() external view returns (uint256) {
        return _allPropertyIds.length;
    }

    /**
     * @notice Returns all property IDs registered on-chain.
     */
    function getAllPropertyIds() external view returns (string[] memory) {
        return _allPropertyIds;
    }

    // Circuit breakers
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}
