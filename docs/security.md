# Security Architecture & Cryptographic Threat Analysis

## 1. Cryptographic Principles
BhoomiChain incorporates four cryptographic pillars:
1. **Deterministic Hashing (SHA-256)**: Eliminates document manipulation.
2. **Elliptic Curve Cryptography (ECDSA secp256k1)**: Guarantees non-repudiation of transactions and wallet linking.
3. **Key Derivation (Bcrypt)**: 10 salt rounds with constant-time comparison.
4. **Asymmetric Smart Contract Access Control**: OpenZeppelin role-based enforcement ensuring only verified sub-registrars can execute ledger state mutations.

---

## 2. Adversarial Security Controls

### 1. Replay Attacks on Wallet Authentication
- **Risk**: An attacker intercepts a signed statement and replays it to impersonate the wallet owner.
- **Defense**: The backend generates a cryptographically random 32-byte hex nonce with a strict 5-minute TTL. The challenge message incorporates the nonce and current ISO timestamp. When verified, the nonce is immediately cleared from the database, preventing reuse.

### 2. Unauthorized Ownership Reassignment
- **Risk**: A rogue user calls `transferOwnership` directly on the smart contract.
- **Defense**: The smart contract function is protected by `onlyRole(REGISTRAR_ROLE)`. Direct calls from unauthorized addresses revert immediately with custom error `AccessControlUnauthorizedAccount`.

### 3. File Upload Exploitation & Path Traversal
- **Risk**: An attacker uploads executable scripts or uses path traversal strings (`../../etc/passwd`).
- **Defense**: Multer enforces strict MIME whitelisting (`application/pdf`, `image/jpeg`, `image/png`) and limits file size to 10 MB. Disk filenames are regenerated using UUIDv4 (`crypto.randomUUID()`), and file paths are strictly sanitized to prevent traversal outside the designated storage directory.

### 4. Database / Blockchain Desynchronization
- **Risk**: The backend updates the database to REGISTERED before confirming the blockchain transaction, leading to phantom records if the EVM reverts.
- **Defense**: The system strictly enforces the `BLOCKCHAIN_PENDING` transition. The database is updated to `REGISTERED` only **after** the transaction receipt is confirmed and the status equals `1`. If the transaction reverts or times out, the land moves to `BLOCKCHAIN_FAILED`, preserving complete auditability and enabling official retry.
