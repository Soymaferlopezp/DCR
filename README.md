<h1 align="center"> DCR — Dev Control Room </h1>

<div align="center">
  
```bash
██████╗ ██████╗██████╗
██╔══██╗██╔════╝██╔══██╗
██║  ██║██║     ██████╔╝
██║  ██║██║     ██╔══██╗
██████╔╝╚██████╗██║  ██║
╚═════╝  ╚═════╝╚═╝  ╚═╝
```
</div>

<p align="center"> <strong> Your command center for building on Somnia.</strong> <i>All systems, under control.</i></p>

  ---
<p align="center">
DCR (Dev Control Room) is a <strong>Web3 DevTool</strong> for <strong>Somnia testnet</strong>.  
Track your own contracts, watch <strong>live on-chain activity</strong> (pings/registrations), and get <strong>gas insights</strong> in a sleek, retro-futuristic dashboard.

- **Live telemetry**: real-time `DevPing` events (owner/public).
- **Register & manage** your contracts (per-wallet).
- **Overview**: session KPIs, activity chart by block, and **Gas per Tx** chart.
- **Ping Alerts** page: quick audit trail of live pings.
- **Analyze** any public contract without registering it.

> Built for the **Somnia DeFi Mini Hackathon** (Dev Tooling track).
</p>

---

## 🧭 Demo Flow

**Landing (`/`)**
- Connect wallet (RainbowKit).  
- On connect → redirect to `/dashboard/overview`.  
- On disconnect → redirect to `/` automatically.

**Dashboard (left fixed nav + right content)**
- **Overview (`/dashboard/overview`)**  
  - Cards: Registered (total), Active (session), Avg Gas (session).  
  - Chart: Activity by block (Pings & Registers).  
  - Chart: **Gas per tx (session)** (latest ~50 of *your* confirmed txs).  
  - Activity feed (recent window): Pings & Registers, with gas for your own tx.

- **My Contracts (`/dashboard/contracts`)**  
  - Form: `registerMyContract(name, address)` → on-chain.  
  - Table: your registered contracts (owner view).  
  - Action: `ping(contract, kind=owner)`.

- **Analyze (`/dashboard/analyze`)**  
  - Input any address → **Load** to start watching.  
  - Watch **live `DevPing`** (polling; robust to flaky RPC).  
  - Action: **Send Public Ping** (ping(kind=public)).  
  - Manual **Refresh** if RPC lags.

- **Ping Alerts (`/dashboard/alerts`)**  
  - Quick live table of recent pings (kind, tx, block).

- **Settings (`/dashboard/settings`)**  
  - Basic preferences / theme placeholders (MVP scope).

--- 

## 🧪 Smart Contract

**`SomniaDevLog.sol` (EVM-compatible)**
- **Functions**
  - `registerMyContract(string name, address contractAddress)`
  - `ping(address contractUsed, uint8 kind)` // `kind` = 0 owner, 1 public
  - `getMyContracts()` → `(address[] addrs, string[] labels)` (owner-scoped)
- **Events**
  - `ContractRegistered(address indexed dev, string name, address indexed contractAddress)`
  - `DevPing(address indexed dev, address indexed contractUsed, uint8 kind)`

**Deployed (testnet)**  
- **DevLog**: `0xbc6BBA2bAdF319788073B8CA42d7c169178ed952`  
- **Chain**: Somnia **testnet** (`chainId` ~ `50312`)  
- **Explorer**: `https://somnia-testnet.socialscan.io/`  
- **RPC (primary)**: `https://dream-rpc.somnia.network/` *(fallback supported)*

> Note: `ContractRegistered.name` is **not indexed** (by design); we surface `dev` and `contractAddress` via topics and keep names client-side once fetched by owner.

--- 

## 🛠 Tech Stack

**Frontend**
- **Next.js 14** (App Router) + **TypeScript**
- **TailwindCSS** (neon/cosmic theme), minimal shadcn/ui usage
- **RainbowKit** (Wallet UX) + **wagmi@2** + **viem@2**

**Data & Charts**
- **Recharts** for Overview charts (Activity & Gas per Tx)
- Lightweight **sessionStorage** “scoped” by `(chainId, address)` for **session KPIs** and recent gas samples

**Contracts & Tooling**
- **Hardhat** (+ `@nomicfoundation/hardhat-ethers`) for compile/deploy
- Node 18+

---

## 🧩 Architecture Diagram

```bash
┌──────────┐
│ Landing  │  copy + value prop
└────┬─────┘
     │
     v
┌─────────────────────┐
│ Wallet Connect      │ wagmi + RainbowKit
└────┬────────────────┘
     │ connected ?
     ├─────────────── yes ────────────────────────────────────────────────┐
     │ no                                                                 │
     v                                                                    v
[ show connect CTA ]                                              ┌─────────────┐
< back to Landing >                                               │ Overview    │ KPIs: pings, gas, regs
                                                                  └────┬────────┘
                                                                       │
                                                                       │ nav
             ┌───────────────────────────────┬─────────────────────────┴─────────────────────────────┐
             v                               v                                                       v
      ┌─────────────┐                 ┌─────────────┐                                           ┌───────────┐
      │ Contracts   │                 │ Analyze     │                                           │ Alerts    │
      │ (MyContracts│                 │ (Public)    │                                           │           │
      └────┬────────┘                 └────┬────────┘                                           └────┬──────┘
           │  register contract tx         │  enter contract addr                                    │ set rules
           v                               v                                                         v
  ┌──────────────────────┐         ┌──────────────────────┐                                   ┌─────────────────────┐
  │ SomniaDevLog.sol     │  <────> │ Read/Watch (viem)    │                                   │ Stream/Watch Events │
  │ (Shannon Testnet)    │         │ getLogs / watchLogs  │                                   │ DevPing, Regs       │
  └───────┬──────────────┘         └────────┬─────────────┘                                   └─────────┬───────────┘
          │ emits events:                     │ decode + update                                           │ notify UI
          │  - ContractRegistered             │                                                           │
          │  - DevPing                        │                                                           │
          v                                   v                                                           v
  ┌──────────────────────┐            ┌──────────────────────┐                                   ┌──────────────────────┐
  │ Session Storage      │            │ Charts / KPIs        │                                   │ Toasts / Badges      │
  │ pingsCount, gas[],   │  ───────→  │ Recharts (Overview)  │                                   │ "New ping", "New reg"│
  │ txMeta[]             │            └──────────────────────┘                                   └──────────────────────┘
  └──────────────────────┘

Optional Plan B (historicals / indexing):
┌──────────────┐      events for indexing        ┌──────────┐      query (Overview/Analyze)       ┌───────────┐
│ wagmi/viem   │  ───────────────────────────→   │ API      │  ───────────────────────────────→   │ DB (Prisma│
│ getLogs/feed │                                 │ Routes   │                                     │ Postgres/ │
└──────────────┘                                 └────┬─────┘                                     │ SQLite)   │
                                                      └───────────────────────────────────────────┴───────────┘


```

---

## 📂 Repo Structure

```bash

dcr/
├─ src/
│  ├─ app/
│  │  ├─ page.tsx                       # Landing (connect → redirect)
│  │  ├─ providers.tsx                  # Wagmi, RainbowKit, Query, Toaster
│  │  ├─ dashboard/
│  │  │  ├─ layout.tsx                  # Sidebar + content shell
│  │  │  ├─ overview/page.tsx           # KPIs, activity chart, gas chart, feed
│  │  │  ├─ contracts/page.tsx          # Register + list + ping
│  │  │  ├─ analyze/page.tsx            # Watch public pings + send public ping
│  │  │  ├─ alerts/page.tsx             # Ping alerts table (MVP)
│  │  │  └─ settings/page.tsx           # MVP settings
│  │  └─ globals.css
│  ├─ components/
│  │  ├─ DashboardHeader.tsx
│  │  ├─ Sidebar.tsx
│  │  ├─ OverviewChart.tsx              # Activity by block
│  │  └─ GasChart.tsx                   # Gas per tx (session)
│  ├─ lib/
│  │  ├─ devlog.ts                      # abi + address
│  │  └─ session.ts                     # scoped session KPIs + txMeta feed
│  └─ styles/ (optional)
│
├─ contracts/
│  ├─ SomniaDevLog.sol
│  └─ scripts/
│     └─ deploy.cjs
│
├─ hardhat.config.cjs
├─ .env.local
├─ README.md
└─ package.json


```

---
## ⚙️ Environment Variables

Create .env.local at project root:

```bash
# WalletConnect / RainbowKit
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_wc_id

# Somnia RPC (Primary + optional fallback)
NEXT_PUBLIC_SOMNIA_RPC=https://dream-rpc.somnia.network/
NEXT_PUBLIC_SOMNIA_RPC_FALLBACK=https://somnia-testnet.socialscan.io/  # optional

# Chain Id (Shannon testnet)
NEXT_PUBLIC_SOMNIA_CHAIN_ID=50312

# DevLog Contract
NEXT_PUBLIC_DEVLOG_ADDRESS=0xbc6BBA2bAdF319788073B8CA42d7c169178ed952
```

## For Hardhat .env (if redeploying):

```bash
PRIVATE_KEY=0xYOUR_TESTNET_PRIVATE_KEY
SOMNIA_RPC=https://dream-rpc.somnia.network/
```

## 🧑‍💻 Installation & Dev

```bash
# 1) Install
npm install

# 2) Dev server
npm run dev
# http://localhost:3000

# 3) Build & start
npm run build
npm run start


## Hardhat

# Compile
npx hardhat compile

# Deploy (example)
npx hardhat run contracts/scripts/deploy.cjs --network somnia
# Update NEXT_PUBLIC_DEVLOG_ADDRESS after successful deploy
```

## 🔐 Wallet UX & Routing

- Landing shows a primary CTA button (RainbowKit).
- On successful connect → push to /dashboard/overview.
- In dashboard header, wallet shows short address; click to open RainbowKit, allows disconnect.
- On disconnect → redirect to / automatically.

---

## 📊 Data Model & Session

Session-scoped (per (chainId, wallet) in sessionStorage)
- pings: number (session counter)
- gasSamples: number[] (last ~200 samples)
- txMeta[]: { txHash, gasUsed, type: "Ping" | "Register", contract?, at } (last ~200)

These power:
- Active (session) and Avg Gas (session) cards
- Gas per tx (session) chart
- Gas column in Overview activity feed (for your txs)

Live activity
- getLogs windowed queries (chunked) for Pings and Registers
- Robust to RPC limits (range > 1000) by chunking + smaller lookbacks.
- useWatchContractEvent (polling) for live Pings, with manual Refresh fallback.

---

## 🧪 Features (MVP ✅)

- **Register contracts** (per owner). Prevents duplicate counting at UI level.
- **Ping** (owner/public) → signs tx → optimistic UI → waits receipt → updates KPIs & gas.
- **Analyze public address**: Load → start listening → Send Public Ping → Refresh if needed.
- **Overview**
  - Cards: Registered (total by owner), Active (session), Avg Gas (session).
  - Chart: Activity by block (mix Pings & Registers).
  - Chart: Gas per tx (session) (your last ~50 tx).
  - Feed: recent window (mix) with Gas for your own txs.
- **Ping Alerts**: live table of pings (kind, tx, block) with manual refresh.

---

## 🖌 Visual & Branding

- **Palette**
  - #0A0F1F (deep space background)
  - #00FFD1 (cyan accents)
  - #FF3B6A (neon pink for alerts)
  - #FFFFFF (pure white)
- **Vibe**: retro-futuristic mission control (consoles, panels, data grids).
- **Button hierarchy**: clear “Connect” CTA on Landing; neon outline hovers; monospace fragments.

---

## 👥 Team

    👩‍💻 Mafer Lopez — Dev & UX/UI Designer
    🚀 Mary Lopez — PM & BizDev
