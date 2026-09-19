# Database Design & Relational Schema

## 1. Overview
The database architecture employs PostgreSQL managed through Prisma ORM, utilizing strict relational integrity, foreign key cascading constraints, unique indexes, and ACID transaction isolation.

---

## 2. Core Entities

### 1. `User`
- `id`: UUID Primary Key
- `name`: Full legal name
- `email`: Unique case-insensitive address
- `passwordHash`: Bcrypt hash (10 salt rounds)
- `role`: Enum (`ADMIN`, `REGISTRAR`, `LAND_OWNER`, `BUYER`)
- `walletAddress`: Unique Ethereum address (normalized lowercase)
- `phone`: Contact telephone
- `status`: Account status (`ACTIVE`, `SUSPENDED`)
- `nonce`: Cryptographic 32-byte hex challenge for wallet signature verification
- `nonceExpiresAt`: Nonce expiration timestamp (5-minute TTL)

### 2. `Land`
- `id`: UUID Primary Key
- `propertyId`: Unique canonical alphanumeric identifier (`PROP-SS-DDD-YYYY-HEX`)
- `surveyNumber`: Cadastral revenue parcel number
- `ownerId`: Foreign key to `User.id`
- `area`: Acreage / square footage (Float)
- `landType`: Enum (`RESIDENTIAL`, `COMMERCIAL`, `AGRICULTURAL`, `INDUSTRIAL`)
- `village`, `taluk`, `district`, `state`: Geographic revenue boundaries
- `latitude`, `longitude`: Spatial GPS coordinates
- `status`: State machine enum (`PENDING_VERIFICATION`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `BLOCKCHAIN_PENDING`, `REGISTERED`, `BLOCKCHAIN_FAILED`, `TRANSFER_PENDING`)
- `blockchainPropertyId`: Matching on-chain property ID string
- `blockchainTxHash`: Confirmed Ethereum transaction hash
- `blockchainBlockNumber`: Mined block index
- `contractAddress`: Smart contract deployment address

### 3. `LandDocument`
- `id`: UUID Primary Key
- `landId`: Foreign key to `Land.id` (Cascading delete)
- `uploadedById`: Foreign key to `User.id`
- `documentType`: Enum (`SALE_DEED`, `IDENTITY_PROOF`, `TAX_RECEIPT`, `SURVEY_SKETCH`, `ENCUMBRANCE_CERTIFICATE`)
- `originalFileName`: Sanitized original name
- `storagePath`: Path relative to document vault
- `fileHash`: Deterministic 64-character SHA-256 hexadecimal hash
- `mimeType`: Verified MIME classification (`application/pdf`, `image/jpeg`, etc.)
- `fileSize`: Byte length
- `verificationStatus`: Enum (`PENDING`, `VERIFIED`, `REJECTED`)

### 4. `OwnershipHistory`
- `id`: UUID Primary Key
- `landId`: Foreign key to `Land.id`
- `previousOwnerId`: Foreign key to `User.id`
- `newOwnerId`: Foreign key to `User.id`
- `transferRequestId`: Foreign key to `TransferRequest.id`
- `blockchainTxHash`: On-chain transaction hash proving title transfer
- `transferredAt`: Timestamp

### 5. `RegistrationApplication`
- `id`: UUID Primary Key
- `applicantId`: Foreign key to `User.id`
- `landId`: Foreign key to `Land.id`
- `status`: Enum (`PENDING_VERIFICATION`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`)
- `remarks`: Government sub-registrar examination comments
- `reviewedById`: Foreign key to `User.id` (Sub-registrar)
- `reviewedAt`: Timestamp

### 6. `TransferRequest`
- `id`: UUID Primary Key
- `landId`: Foreign key to `Land.id`
- `sellerId`: Foreign key to `User.id`
- `buyerId`: Foreign key to `User.id`
- `status`: Enum (`PENDING`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `BLOCKCHAIN_PENDING`, `COMPLETED`, `CANCELLED`)
- `reason`: Conveyance narrative / legal agreement reference
- `reviewedById`: Foreign key to `User.id`
- `blockchainTxHash`: Confirmed Ethereum transaction hash

### 7. `AuditLog`
- `id`: UUID Primary Key
- `userId`: Nullable foreign key to `User.id`
- `action`: Audit token string (`USER_REGISTERED`, `WALLET_LINKED`, `DOCUMENT_VERIFIED`, `LAND_REGISTERED_BLOCKCHAIN`, etc.)
- `entityType`: Target entity (`USER`, `LAND`, `DOCUMENT`, `TRANSFER`, `BLOCKCHAIN`)
- `entityId`: Identifier of modified entity
- `ipAddress`: Client IPv4/IPv6
- `userAgent`: Client User-Agent string
- `metadata`: JSON payload of operation details

### 8. `Notification`
- `id`: UUID Primary Key
- `userId`: Foreign key to `User.id`
- `title`: Short message header
- `message`: Notification body
- `type`: Enum (`INFO`, `SUCCESS`, `WARNING`, `ERROR`)
- `isRead`: Boolean flag

### 9. `BlockchainTransaction`
- `id`: UUID Primary Key
- `landId`: Nullable foreign key to `Land.id`
- `transactionHash`: Unique 0x-prefixed 66-character Ethereum transaction hash
- `blockNumber`: Mined block height
- `transactionType`: Enum (`LAND_REGISTRATION`, `OWNERSHIP_TRANSFER`, `DOCUMENT_VERIFICATION`)
- `fromAddress`: Originating signer address
- `toAddress`: Recipient / contract address
- `status`: Enum (`PENDING`, `CONFIRMED`, `FAILED`)
- `gasUsed`: Gas units consumed
