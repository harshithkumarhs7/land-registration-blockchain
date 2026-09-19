# Blockchain & Smart Contract Architecture

## 1. Overview
The BhoomiChain smart contract layer is implemented in Solidity `^0.8.24` and tested using the Hardhat toolchain and OpenZeppelin contracts.

Contract Name: `LandRegistry.sol`

---

## 2. OpenZeppelin Integrations
1. **AccessControl**: Implements role-based access control with `DEFAULT_ADMIN_ROLE` for administrative oversight and `REGISTRAR_ROLE` for authorized government land registration officers.
2. **ReentrancyGuard**: Prevents reentrancy vectors on state-changing operations.
3. **Pausable**: Provides an emergency circuit breaker callable by the contract administrator to suspend registrations in case of dispute.

---

## 3. Core Contract Interface

```solidity
function registerLand(
    string calldata propertyId,
    string calldata surveyNumber,
    address owner,
    bytes32 documentHash,
    bytes32 metadataHash
) external onlyRole(REGISTRAR_ROLE) whenNotPaused nonReentrant;

function transferOwnership(
    string calldata propertyId,
    address newOwner,
    string calldata transferTxRef
) external onlyRole(REGISTRAR_ROLE) whenNotPaused nonReentrant;

function updateLandStatus(
    string calldata propertyId,
    LandStatus newStatus
) external onlyRole(REGISTRAR_ROLE) whenNotPaused;

function verifyDocumentHash(
    string calldata propertyId,
    bytes32 documentHash
) external returns (bool isMatch, uint256 registeredAt);

function getLand(string calldata propertyId) external view returns (LandRecord memory);
function getOwnershipHistory(string calldata propertyId) external view returns (OwnershipRecord[] memory);
function landExists(string calldata propertyId) external view returns (bool);
function getOwner(string calldata propertyId) external view returns (address);
function getTotalLands() external view returns (uint256);
```

---

## 4. Key Events Emitted
- `event LandRegistered(string indexed propertyId, string surveyNumber, address indexed owner, bytes32 documentHash, uint256 timestamp);`
- `event OwnershipTransferred(string indexed propertyId, address indexed previousOwner, address indexed newOwner, uint256 timestamp, string transferTxRef);`
- `event DocumentVerified(string indexed propertyId, bytes32 submittedHash, bool isMatch, uint256 timestamp);`
- `event LandStatusChanged(string indexed propertyId, LandStatus previousStatus, LandStatus newStatus, uint256 timestamp);`

---

## 5. Gas Consumption Profile
Measured via `hardhat-gas-reporter` (200 optimizer runs):
- Contract Deployment: ~1,981,767 gas
- `registerLand`: ~349,908 gas
- `transferOwnership`: ~142,320 gas
- `verifyDocumentHash`: ~31,727 gas
- `pause` / `unpause`: ~25,000 - 47,000 gas

---

## 6. Migration to Public Ethereum Testnet (Sepolia)
To deploy on Sepolia testnet:
1. Provide `SEPOLIA_RPC_URL` and `SEPOLIA_PRIVATE_KEY` in `.env`.
2. Run:
   ```bash
   cd blockchain
   npx hardhat run scripts/deploy.ts --network sepolia
   ```
3. Copy the resulting deployed contract address into `backend/.env` under `CONTRACT_ADDRESS`.
