# BhoomiChain REST API Specification

## Base URL
Local Development: `http://localhost:5000/api`

---

## 1. Authentication & Wallet Linking

### `POST /auth/register`
Creates a new account (roles permitted: `LAND_OWNER`, `BUYER`).
- **Body**: `{ name, email, password, phone?, role?, walletAddress? }`
- **Response**: `{ success: true, data: { token, user } }`

### `POST /auth/login`
Authenticates user with email and password.
- **Body**: `{ email, password }`
- **Response**: `{ success: true, data: { token, user } }`

### `GET /auth/me`
Fetches authenticated user profile.
- **Header**: `Authorization: Bearer <token>`
- **Response**: `{ success: true, data: { user } }`

### `POST /wallet/nonce`
Generates a 32-byte cryptographic challenge nonce for MetaMask signing.
- **Body**: `{ walletAddress: "0x..." }`
- **Response**: `{ success: true, data: { nonce, message } }`

### `POST /wallet/link`
Verifies signature and permanently binds the Ethereum address to the authenticated user.
- **Header**: `Authorization: Bearer <token>`
- **Body**: `{ walletAddress, signature, message }`
- **Response**: `{ success: true, data: { user } }`

---

## 2. Land Parcels

### `POST /lands`
Submits a new land parcel for government registration.
- **Header**: `Authorization: Bearer <token>` (Roles: `LAND_OWNER`, `ADMIN`)
- **Body**: `{ surveyNumber, area, landType, village, taluk, district, state, latitude, longitude, description? }`
- **Response**: `{ success: true, data: { land } }`

### `GET /lands`
Queries registered lands with search parameters and pagination.
- **Query**: `query`, `district`, `landType`, `status`, `page`, `limit`
- **Response**: `{ success: true, data: { lands, pagination } }`

### `GET /lands/my-properties`
Retrieves properties belonging to the calling authenticated owner.
- **Header**: `Authorization: Bearer <token>`
- **Response**: `{ success: true, data: { lands } }`

### `GET /lands/:id`
Retrieves a land parcel with full relational documents and ownership history.
- **Response**: `{ success: true, data: { land } }`

---

## 3. Documents & Cryptographic Hashing

### `POST /documents/upload`
Uploads deed file and calculates deterministic SHA-256 fingerprint.
- **Header**: `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
- **Form Data**: `file` (Binary), `landId` (UUID), `documentType` (String)
- **Response**: `{ success: true, data: { document } }`

### `GET /documents/:id/download`
Downloads the original document binary file.
- **Response**: File stream with Content-Disposition attachment

### `POST /documents/:id/verify-file`
Compares an uploaded test document with the stored SHA-256 hash and on-chain record.
- **Form Data**: `file` (Binary)
- **Response**: `{ success: true, data: { isMatch, computedHash, storedHash, onChainVerified } }`

---

## 4. Government Registration & Smart Contract Commitment

### `GET /registrations`
Lists pending and approved applications for registrars.
- **Header**: `Authorization: Bearer <token>` (Roles: `REGISTRAR`, `ADMIN`)
- **Response**: `{ success: true, data: { applications, pagination } }`

### `POST /registrations/:id/approve`
Approves land application and broadcasts `registerLand` to Ethereum smart contract.
- **Header**: `Authorization: Bearer <token>` (Roles: `REGISTRAR`, `ADMIN`)
- **Body**: `{ remarks? }`
- **Response**: `{ success: true, data: { transactionHash, blockNumber } }`

### `POST /registrations/:id/reject`
Rejects land application with official government remarks.
- **Header**: `Authorization: Bearer <token>` (Roles: `REGISTRAR`, `ADMIN`)
- **Body**: `{ remarks: string }`

---

## 5. Ownership Transfers

### `POST /transfers`
Initiates a title conveyance request to a prospective buyer.
- **Header**: `Authorization: Bearer <token>` (Role: `LAND_OWNER`)
- **Body**: `{ landId, buyerId, reason }`
- **Response**: `{ success: true, data: { transfer } }`

### `POST /transfers/:id/approve`
Government registrar approves transfer and executes on-chain `transferOwnership`.
- **Header**: `Authorization: Bearer <token>` (Roles: `REGISTRAR`, `ADMIN`)
- **Response**: `{ success: true, data: { transactionHash, blockNumber } }`

---

## 6. Public Verification & Telemetry

### `GET /public/lands`
Public open-access land search without authentication.
- **Query**: `query`, `district`, `landType`, `status`, `page`, `limit`

### `GET /public/verify/:propertyId`
Retrieves tamper-evident proof certificate with on-chain verification for any Property ID.
- **Response**: `{ success: true, data: { propertyId, databaseRecord, blockchainRecord, onChainHistory, isChainVerified, contractAddress } }`

### `GET /admin/dashboard`
Returns real-time analytics, user counts, transaction statistics, and category distribution.
- **Header**: `Authorization: Bearer <token>` (Role: `ADMIN`)
