# Security Policy & Threat Model

## 1. Overview
The **Land Registration Using Blockchain** system implements defense-in-depth security across the presentation, application, database, and smart contract layers. This document outlines the security architecture, threat model, mitigation strategies, and system boundaries.

---

## 2. Threat Modeling & Mitigations

| Threat | Attack Vector | Mitigation Strategy |
| :--- | :--- | :--- |
| **Unauthorized Ownership Transfer** | Malicious actor attempts to reassign property ownership without owner/registrar consent. | **Smart Contract Level Access Control**: `transferOwnership` checks caller roles; dual authorization requires seller initiation, buyer acceptance, and government registrar verification on-chain. |
| **Document Forgery / Tampering** | Manipulating land deeds, survey maps, or tax clearances post-issuance. | **Deterministic SHA-256 Hashing**: Hash calculated upon upload and recorded immutably on the blockchain. Any altered bit produces a hash mismatch during verification. |
| **Wallet Impersonation & Replay Attacks** | Claiming ownership of an Ethereum address or reusing intercepted signatures. | **Cryptographic Nonce Challenge**: Server generates a 32-byte cryptographically secure random nonce with a 5-minute TTL. The user signs an EIP-4361 / `personal_sign` statement. Address is recovered via ECDSA (`ecrecover`). Nonce is invalidated immediately upon single use. |
| **Privilege Escalation** | Regular user registering as `ADMIN` or invoking registrar endpoints. | **Role-Based Access Control (RBAC)**: Public registration is restricted to `LAND_OWNER` or `BUYER`. `ADMIN` and `REGISTRAR` can only be provisioned by existing administrators. JWT middleware enforces role checks on every protected route. |
| **SQL / Injection Attacks** | Malicious input crafted to manipulate database queries. | **Prisma ORM Parameterization**: All queries use parameterized statements. Input fields are strictly validated and sanitized via Zod schemas. |
| **Malicious File Uploads** | Uploading executables or oversized payloads disguised as documents. | **Multer Validation**: Whitelist allowed MIME types (`application/pdf`, `image/png`, `image/jpeg`). Hard file size ceiling (10 MB). Files saved with UUID filenames to prevent path traversal. |
| **Blockchain Transaction Tampering** | Faking transaction hashes or block numbers in API responses. | **On-Chain Event Verification**: Backend queries the EVM node for transaction receipts and parses emitted logs (`LandRegistered`, `OwnershipTransferred`) before committing state changes. |
| **Denial of Service (DoS)** | Automated brute-force or spam submissions. | **Rate Limiting**: IP-based rate limiting on sensitive routes (auth, registration, verification) using `express-rate-limit`. |

---

## 3. Cryptographic Standards
- **Document Hashing**: SHA-256 (`crypto.createHash('sha256')` server-side, Web Crypto API client-side).
- **Password Hashing**: `bcrypt` with 12 salt rounds.
- **Session Tokens**: JWT signed with HMAC-SHA256, 7-day expiration.
- **Blockchain Signatures**: ECDSA over secp256k1 (Ethereum standard).

---

## 4. Privacy & Data Minimization
Sensitive personal identifiable information (PII) such as national identification numbers, phone numbers, and full unredacted deed files are **never** committed to the public blockchain ledger. The blockchain maintains only:
1. Canonical Property Identifier (`propertyId`)
2. Survey Number
3. Public Ethereum Address of Owner
4. SHA-256 Document Hash
5. Metadata State Hash
6. Block Timestamps & Transaction References

---

## 5. Academic Scope & Real-World Notice
*Notice*: This prototype demonstrates cryptographic tamper-evidence and decentralized state verification. In actual administrative practice, legal ownership remains subject to national statutory real-property registration laws and certified land revenue authorities.
