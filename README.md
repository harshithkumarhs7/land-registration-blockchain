# BHOOMICHAIN — Production-Style Blockchain Land Registration Platform

A production-grade, tamper-resistant digital cadastre and real estate title conveyance system leveraging Ethereum-compatible smart contracts, PostgreSQL relational models, and deterministic SHA-256 cryptographic document integrity.

---

## 1. System Overview & Problem Solved
Traditional land titling registries suffer from centralized records vulnerable to unauthorized modification, physical deed forgery, and opaque ownership provenance. 

BhoomiChain provides:
1. **Mathematical Tamper-Resistance**: Every registered land parcel holds an immutable cryptographic record on the Ethereum blockchain.
2. **Deterministic Document Fingerprinting**: Deed documents, cadastral sketches, and revenue receipts are hashed using SHA-256. Altering even a single pixel or bit produces an immediate cryptographic mismatch.
3. **Multi-Party Consensus Conveyance**: Property transfer requires mutual consensus between seller, prospective buyer, and authorized government sub-registrar on-chain.
4. **Complete Chain-of-Custody**: Unbroken chronological ownership provenance accessible to any citizen, financial institution, or court without bureaucratic friction.

---

## 2. Technology Stack

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Maps**: Leaflet + React-Leaflet (Interactive cadastral location picker)
- **Icons**: Lucide React
- **Data Visualization**: Recharts (Database telemetry & distributions)
- **Web3 / Blockchain**: Ethers.js v6 + MetaMask Provider

### Backend
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database & ORM**: PostgreSQL / SQLite dev fallback with Prisma ORM
- **Authentication**: JWT (JSON Web Tokens) + Bcrypt
- **Web3 Signature Challenge**: Nonce-based EIP-4361 / `personal_sign` signature recovery
- **Validation**: Zod runtime schema validation
- **Security**: Helmet, CORS, Rate Limiting, Sanitized Multer File Uploads

### Blockchain & Smart Contracts
- **Environment**: Hardhat (Solidity `^0.8.24`)
- **Libraries**: OpenZeppelin Contracts (`AccessControl`, `ReentrancyGuard`, `Pausable`)
- **Networks Supported**: Hardhat Local Node (Chain ID `31337`), Ethereum Sepolia Testnet

---

## 3. Project Structure

```
land-registration-blockchain/
├── blockchain/                 # Hardhat smart contract development environment
│   ├── contracts/              # LandRegistry.sol
│   ├── scripts/                # deploy.ts
│   ├── test/                   # Comprehensive Hardhat test suite (15 tests)
│   └── hardhat.config.ts
├── backend/                    # Express REST API orchestration layer
│   ├── prisma/                 # schema.prisma, schema.postgres.prisma, seed.ts
│   ├── src/                    # Controllers, Services, Middlewares, Routes, Blockchain
│   └── tests/                  # Automated integration test suite (12 tests)
├── frontend/                   # React Vite single page application
│   ├── src/
│   │   ├── components/         # Navbar, Sidebar, MapLocationPicker, PropertyCard, Modals
│   │   ├── pages/              # Public, Owner, Buyer, Registrar, and Admin pages
│   │   └── context/            # AuthContext, Web3Context
│   └── index.html
├── docs/                       # Comprehensive academic & architectural documentation
│   ├── diagrams/               # Mermaid sequence, ER, and architecture diagrams
│   ├── architecture.md
│   ├── database.md
│   ├── blockchain.md
│   ├── api.md
│   ├── security.md
│   ├── testing.md
│   ├── user-flows.md
│   └── academic_project_report.md
├── docker/                     # Dockerfiles for backend, frontend, and blockchain
├── docker-compose.yml          # Full multi-container composition
├── package.json                # Root orchestration workspace scripts
├── .env.example
└── SECURITY.md                 # Security threat model & disclosure policy
```

---

## 4. Quick Start: Local Development

### Prerequisites
- Node.js `v18+` (Tested on Node `v22`)
- npm `v9+`
- MetaMask Browser Extension (Optional for user signing, built-in demo accounts provided)

### Step 1: Install Dependencies
From the repository root:
```bash
npm run blockchain:install
npm run backend:install
npm run frontend:install
```

### Step 2: Database Initialization & Seeding
From the repository root:
```bash
npm run backend:migrate
npm run backend:seed
```

### Step 3: Launch Local Blockchain Node & Deploy Contract
**Terminal 1 (Blockchain Node):**
```bash
npm run blockchain
```

**Terminal 2 (Deploy Contract):**
```bash
npm run deploy:contract
```

### Step 4: Start Backend API
**Terminal 3 (Backend):**
```bash
npm run backend
```
*Backend runs on `http://localhost:5000` (Health check at `http://localhost:5000/health`)*

### Step 5: Start Frontend Portal
**Terminal 4 (Frontend):**
```bash
npm run frontend
```
*Frontend runs on `http://localhost:5173`*

---

## 5. Docker Deployment (Single Command)
If Docker and Docker Compose are installed:
```bash
docker compose up --build
```
This launches:
- `postgres`: PostgreSQL 16 on port 5432
- `blockchain`: Hardhat local node on port 8545
- `backend`: Express API on port 5000
- `frontend`: React SPA served via Nginx on port 80

---

## 6. Pre-Configured Demo Accounts

| Role | Email | Password | Hardhat Account # / Wallet |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@landregistry.gov` | `Admin@123456` | Account #0 (`0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`) |
| **REGISTRAR** | `registrar@landregistry.gov` | `Registrar@123456` | Account #1 (`0x70997970C51812dc3A010C7d01b50e0d17dc79C8`) |
| **LAND_OWNER** | `owner@gmail.com` | `Owner@123456` | Account #2 (`0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`) |
| **BUYER** | `buyer@gmail.com` | `Buyer@123456` | Account #3 (`0x90F79bf6EB2c4f870365E785982E1f101E93b906`) |

*Tip: The Sign In page (`/login`) includes 1-click test credentials buttons for all 4 roles!*

---

## 7. Running Automated Tests

### Run Smart Contract Tests (15 Tests)
```bash
npm run test:contract
```
*Tests access control, duplicate prevention, zero-address rejection, transfer authorizations, pausability, and document verification.*

### Run Backend Integration Tests (12 Tests)
```bash
npm run test:backend
```
*Tests authentication, RBAC, wallet nonce generation, public verification, and administrative metrics.*

### Run All Tests
```bash
npm run test:all
```

---

## 8. Complete 23-Step End-to-End Walkthrough Demonstration

1. Open `http://localhost:5173/login`.
2. Click **Land Owner** quick-login button (`owner@gmail.com`).
3. View the Owner Dashboard and registered property `PROP-KA-BLR-001`.
4. Click **Register Land** in navigation.
5. Enter Survey Number (e.g. `204/1A`), Area (e.g. `1800`), choose **Residential**, Village: `Indiranagar`, District: `Bengaluru Urban`.
6. Click on the interactive **Leaflet Map** to pinpoint coordinates.
7. Select a title deed file: notice the instant client-side **SHA-256 fingerprint** calculation.
8. Submit the application.
9. Sign out and sign in as **Sub-Registrar** (`registrar@landregistry.gov`).
10. Navigate to **Land Applications**.
11. Click on the document badge to open the **Cryptographic Integrity Inspector**.
12. Click **Approve On-Chain**: watch the live modal submit the transaction, mine the block on Hardhat, and display the confirmed transaction hash!
13. Sign in as **Prospective Buyer** (`buyer@gmail.com`).
14. Navigate to **Browse Properties** to explore certified properties.
15. Sign in as **Land Owner** and navigate to **Ownership Transfers**.
16. Initiate a transfer for your property to the buyer (`buyer@gmail.com`).
17. Sign in as **Sub-Registrar** and navigate to **Transfer Approvals**.
18. Click **Approve & Transfer**: the smart contract reassigns ownership on Ethereum and updates the chain-of-custody.
19. Sign in as **Buyer**: observe that the property is now in your possession.
20. Open **Public Verification** (`/public/verify`).
21. Enter the Property ID (e.g. `PROP-KA-BLR-001`).
22. Observe the complete blockchain proof: current owner address, block number, transaction hash, and historical ownership provenance.
23. Drag & drop the deed file into the verification box to observe the **MATCH (Authentic Record)** verification.

---

## 9. Academic Project Notice
This project is an advanced academic engineering prototype demonstrating decentralized ledger technology in public administration. Legal ownership in real-world governance remains subject to statutory revenue laws and competent government authorities.
