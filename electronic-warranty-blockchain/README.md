# WarrantyChain — Electronic Warranty on Blockchain

A blockchain-backed electronic product warranty system. Manufacturers register warranties; only the **SHA-256 hash**
of the invoice is stored on Ethereum (Sepolia). Customers can retrieve warranties, verify documents, and file claims
that authorized service staff update — all with an auditable on-chain trail.

## Tech stack

| Layer | Technology |
|---|---|
| Smart contract | Solidity 0.8.24 + Hardhat 2 + OpenZeppelin `AccessControl` |
| Blockchain | Ethereum Sepolia testnet |
| Frontend | React + Vite + ethers.js v6 |
| Backend | Node.js + Express |
| Database | MongoDB (Mongoose) |

## Architecture

```
React (hash file in browser) ──ethers.js──▶ ElectronicWarranty.sol (Sepolia)
        │                                        ▲ hash, roles, claims, events
        └──── REST ────▶ Express API ──▶ MongoDB  (profiles, product details, claim text, file metadata)
```

* **On-chain:** warranty record, document hash, expiry, claim status, roles.
* **Off-chain:** invoices, personal data, claim descriptions (only their hash goes on-chain).
* A matching hash proves the file is *unchanged*; it does not prove the original invoice was genuine.

## Smart contract

| Function | Who | Purpose |
|---|---|---|
| `registerWarranty` | `MANUFACTURER_ROLE` | Register product + document hash; duplicate IDs rejected |
| `getWarranty` | anyone | Read a warranty |
| `verifyWarranty` | anyone | Returns `(hashMatches, isActive)` |
| `submitClaim` | warranty owner | Record a claim (only while warranty active) |
| `updateClaimStatus` | `SERVICE_ROLE` | Submitted → In review → Approved/Rejected → Completed |
| `getCustomerProducts`, `getClaim`, `getClaimIdsByProduct` | anyone | Read helpers for the UI |

Events: `WarrantyRegistered`, `ClaimSubmitted`, `ClaimStatusUpdated`.
The deployer is the admin and grants `MANUFACTURER_ROLE` / `SERVICE_ROLE` with `grantRole`.

## Setup (follow in order)

Requires Node.js 18+ (20 or 22 recommended).

### 1. Contract — compile and test first
```bash
npm install
npm run compile
npm test                 # must pass before deploying
```

### 2. Deploy to Sepolia
```bash
cp .env.example .env     # fill SEPOLIA_RPC_URL and DEPLOYER_PRIVATE_KEY (test wallet only!)
npm run deploy:sepolia   # note the printed contract address
npm run sync-abi         # copies the compiler-generated ABI into frontend/src/abi/
```
Then grant roles (Hardhat console or Etherscan "Write Contract"):
`grantRole(MANUFACTURER_ROLE, <manufacturer address>)` and `grantRole(SERVICE_ROLE, <service address>)`.

Local alternative: `npm run node` in one terminal, `npm run deploy:local` in another.

### 3. Frontend
```bash
cd frontend
npm install
echo "VITE_CONTRACT_ADDRESS=0xYourAddress" > .env
echo "VITE_API_URL=http://localhost:5000/api" >> .env   # optional
npm run dev
```
Use MetaMask on the Sepolia network.

### 4. Backend (optional for the first demo)
```bash
cd backend
npm install
# create backend/.env with PORT, MONGODB_URI, JWT_SECRET (see .env.example)
npm run dev
```

## Demo script (end-to-end)

1. Manufacturer wallet → **Register**: enter product, customer address, upload invoice → hash stored on-chain.
2. Customer wallet → **My Warranties**: card with expiry, hash and QR code.
3. **Verify**: enter product ID + same invoice → ✅ match. Upload a modified file → ❌ mismatch.
4. Customer → **Claims**: submit a claim.
5. Service wallet → change the claim status; the customer sees it update.

## Security notes

* Never commit `.env`, private keys or real user data (`.gitignore` covers them).
* Frontend env vars are public — no private keys there.
* Use a dedicated wallet holding only Sepolia test ETH.
* The backend currently has basic JWT auth only; add route protection before any real deployment.

## Project structure

```
contracts/        Solidity contract
ignition/modules/ Hardhat Ignition deployment
test/             Contract tests
scripts/          sync-abi.js (ABI -> frontend)
frontend/         React + Vite app
backend/          Express + MongoDB API
```
