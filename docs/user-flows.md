# Comprehensive User Workflows

## Flow 1: Land Registration Workflow

```
[Land Owner]
   │
   ├─► Log in to Portal
   ├─► Connect MetaMask Wallet
   ├─► Complete Land Registration Form:
   │    • Survey Number, Acreage, Classification
   │    • Revenue Jurisdiction (Village, Taluk, District)
   │    • Select GPS Coordinates on Leaflet Map
   │    • Upload Title Deed (Computes SHA-256 fingerprint)
   └─► Submit Application (Enters PENDING_VERIFICATION state)
             │
             ▼
[Government Sub-Registrar]
   │
   ├─► Open Applications Inbox
   ├─► Inspect Land Attributes & Cadastral Boundaries
   ├─► Download and Verify Title Deed PDF
   ├─► Test SHA-256 Cryptographic Hash Match
   └─► Click "Approve On-Chain"
             │
             ▼
[Backend & Ethereum Ledger]
   │
   ├─► Set Status: BLOCKCHAIN_PENDING
   ├─► Invoke LandRegistry.sol -> registerLand(...)
   ├─► Receive Mining Confirmation & Receipt
   ├─► Set Status: REGISTERED
   ├─► Index Transaction Hash, Block Number & Contract Reference
   └─► Send Success Notification to Owner
```

---

## Flow 2: Multi-Party Ownership Transfer Workflow

```
[Current Land Owner]
   │
   ├─► Select Registered Property from "My Lands"
   ├─► Click "Initiate Transfer"
   ├─► Specify Prospective Buyer & Legal Consideration Reason
   └─► Submit Transfer Request (Status: PENDING)
             │
             ▼
[Prospective Buyer]
   │
   ├─► Receives In-App Notification
   └─► Reviews Property Details & Cadastral Map
             │
             ▼
[Government Sub-Registrar]
   │
   ├─► Open Transfer Approvals Inbox
   ├─► Verify Buyer & Seller Ethereum Addresses
   └─► Click "Approve & Transfer"
             │
             ▼
[Backend & Ethereum Ledger]
   │
   ├─► Set Status: BLOCKCHAIN_PENDING
   ├─► Invoke LandRegistry.sol -> transferOwnership(...)
   ├─► Emit OwnershipTransferred event
   ├─► Update Land.ownerId to Buyer
   ├─► Append Entry to OwnershipHistory table
   ├─► Update TransferRequest status to COMPLETED
   └─► Issue Confirmation Notifications to both parties
```

---

## Flow 3: Public Citizen & Financial Institution Verification Flow

```
[Citizen / Bank / Court Officer]
   │
   ├─► Navigate to Public Verification Portal (/public/verify)
   ├─► Enter Canonical Property Identifier (e.g. PROP-KA-BLR-001)
   ├─► Inspect Blockchain Proof Certificate:
   │    • Verified Current Owner Ethereum Address
   │    • Smart Contract Address & Block Number
   │    • Confirmed Transaction Hash
   │    • Complete Historical Provenance Chain
   └─► Test Physical Document:
        • Drag & Drop Physical Deed PDF
        • Browser computes local SHA-256 hash
        • System performs zero-knowledge comparison:
             MATCH    ──► "Authentic Unmodified Document Verified"
             MISMATCH ──► "Tampering / Forgery Detected"
```
