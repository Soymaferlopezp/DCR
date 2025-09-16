# DCR — Dev Control Room

```bash
██████╗ ██████╗██████╗
██╔══██╗██╔════╝██╔══██╗
██║  ██║██║     ██████╔╝
██║  ██║██║     ██╔══██╗
██████╔╝╚██████╗██║  ██║
╚═════╝  ╚═════╝╚═╝  ╚═╝
```

**Your command center for building on Somnia.**  
_All systems, under control._

---

## Features

- **Wallet Connect** — seamless RainbowKit integration.  
- **Contract Registry** — register your Somnia testnet smart contracts.  
- **Live Pings** — interact with your contracts and visualize events.  
- **Gas Insights** — estimate gas per interaction.  
- **Public Analysis** — inspect activity of any address, even if not registered.  

---

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), TailwindCSS, shadcn/ui  
- **Wallet Integration**: wagmi v2 + RainbowKit + viem  
- **Charts**: Recharts  
- **Smart Contracts**: Solidity (Somnia testnet)  
- **DevOps**: Hardhat, dotenv  
- **Optional Indexer**: Node.js + SQLite/Postgres (future work)  

---

## System Architecture
```bash

                   ┌────────────────────────┐
                   │      Landing Page      │
                   │  - Connect wallet      │
                   │  - Project intro       │
                   └───────────┬────────────┘
                               │
                    Wallet connection (RainbowKit)
                               │
┌──────────────────────────────────┴──────────────────────────────────┐
│ Dashboard WebApp │
│ ┌───────────────┐ ┌─────────────────┐ ┌─────────────────────┐ │
│ │ Registry UI │→→ │ SomniaDevLog.sol │ ← │ Ping & Analytics │ │
│ │ Register form │ │ (on-chain log) │ │ Charts & Insights │  │
│ └───────────────┘ └─────────────────┘ └─────────────────────┘ │
│ │ ▲ │ │
│ ▼ │ ▼ │
│ Local cache / │ Public address analyzer │
│ Optional indexer │ (read-only mode) │
└──────────────────────────────────────────────────────────────────────┘

```

---

## Getting Started

```bash
# Clone the repository
git clone https://github.com/yourname/dcr.git
cd dcr

# Install dependencies
npm install

# Run local dev server
npm run dev

# Compile contracts
npx hardhat compile

# Deploy contract to Somnia testnet
npx hardhat run scripts/deploy.cjs --network somnia
```