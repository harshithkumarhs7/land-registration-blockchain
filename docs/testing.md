# Verification & Testing Strategy

## 1. Test Architecture
BhoomiChain includes multi-tiered automated and manual verification:
1. **Smart Contract Unit Tests (Hardhat / Chai / Mocha)**: 15 comprehensive unit tests evaluating access control, duplicate prevention, zero-address rejection, transfer authorizations, pause triggers, and document hash verification.
2. **Backend API Integration Tests (Vitest / Supertest)**: 12 end-to-end API tests covering authentication, RBAC, wallet nonce generation, public verification, and administrative metrics.
3. **Frontend Compilation & Type Safety (TypeScript / Vite)**: Strict TypeScript compiler validation across all components, hooks, and context providers.

---

## 2. Test Execution Commands

### Smart Contract Test Suite
```bash
cd blockchain
npx hardhat test
```
*Expected Result*: 15 passing tests with gas profiling report.

### Backend API Integration Suite
```bash
cd backend
npm test
```
*Expected Result*: 12 passing tests across Auth, Wallet, Public, and Admin endpoints.

### Frontend Compilation
```bash
cd frontend
npm run build
```
*Expected Result*: `✓ built in XXs` with zero TypeScript errors.

---

## 3. The 23-Step End-to-End Demonstration Checklist
- [x] Step 1: Login as Land Owner (`owner@gmail.com` / `Owner@123456`)
- [x] Step 2: Connect MetaMask wallet
- [x] Step 3: Create land registration application (Survey #, Area, Coordinates)
- [x] Step 4: Upload deed document and view computed SHA-256 hash
- [x] Step 5: Submit application
- [x] Step 6: Login as Sub-Registrar (`registrar@landregistry.gov` / `Registrar@123456`)
- [x] Step 7: Review application inbox
- [x] Step 8: Verify attached documents & test hash matching
- [x] Step 9: Approve registration
- [x] Step 10: Smart contract transaction executed on Hardhat EVM
- [x] Step 11: Transaction hash and block number returned & stored
- [x] Step 12: Return to Owner dashboard
- [x] Step 13: Newly registered parcel appears with `REGISTERED` badge
- [x] Step 14: Login as Buyer (`buyer@gmail.com` / `Buyer@123456`)
- [x] Step 15: Search property catalog
- [x] Step 16: Owner initiates ownership transfer to Buyer
- [x] Step 17: Buyer sees incoming transfer notification
- [x] Step 18: Registrar approves transfer request
- [x] Step 19: Blockchain `transferOwnership` executes
- [x] Step 20: Updated owner recorded on-chain
- [x] Step 21: Previous owner recorded in provenance history
- [x] Step 22: Open Public Verification page (`/public/verify`)
- [x] Step 23: Verify on-chain record and test physical deed match
