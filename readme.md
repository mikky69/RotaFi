<p align="center">
  <img src="./assets/rotafi_logo.svg" alt="RotaFi Logo" width="200"/>
</p>

<h1 align="center">RotaFi</h1>

<p align="center">
  <strong>Decentralized Rotating Savings on Polkadot Hub</strong>
</p>

<p align="center">
  <a href="https://dorahacks.io/hackathon/polkadot-solidity-hackathon/buidl">
    <img src="https://img.shields.io/badge/Polkadot%20Solidity%20Hackathon-2026-E6007A?style=flat-square" alt="Hackathon"/>
  </a>
  <img src="https://img.shields.io/badge/Track-EVM%20Smart%20Contracts-7F77DD?style=flat-square" alt="Track"/>
  <img src="https://img.shields.io/badge/Built%20with-OpenZeppelin-4E5EE4?style=flat-square" alt="OpenZeppelin"/>
  <img src="https://img.shields.io/badge/Network-Polkadot%20Hub-E6007A?style=flat-square" alt="Network"/>
  <img src="https://img.shields.io/badge/License-MIT-1D9E75?style=flat-square" alt="License"/>
</p>

---

## What is RotaFi?

RotaFi brings the trusted community savings model known as **Ajo**, **Esusu**, and **Chit Funds** on-chain. Groups of participants commit to regular USDC contributions managed entirely by smart contracts, no middleman, no trust required. Each cycle, one member receives the full pot, rotating until everyone has been paid out.

Built with OpenZeppelin contracts on Polkadot Hub's EVM layer, RotaFi makes community finance transparent, permissionless, and accessible to anyone with a wallet.

---

## The Problem

Rotating savings groups have existed for centuries across Africa, Asia, and Latin America. They work, but they depend entirely on trust between members and a human organizer who can disappear with the funds, miss a payout, or simply make mistakes. There is no transparency, no enforcement, and no recourse.

RotaFi removes the human middleman and replaces trust with code.

---

## How It Works

1. **Create a circle** — a group admin deploys a new savings circle, sets the contribution amount (in USDC), the cycle duration, and the number of members.
2. **Members join** — participants join by connecting their wallet. The circle locks once the member cap is reached.
3. **Contribute each cycle** — every member deposits their USDC contribution before the cycle deadline.
4. **Automatic payout** — at the end of each cycle, the smart contract sends the full pot to the designated recipient for that round.
5. **Rotation continues** — the cycle repeats, rotating through all members until everyone has received their payout.
6. **Late penalties** — members who miss a contribution deadline are penalized; funds are held until they pay up.

---

## Smart Contracts

RotaFi is architected using a **Factory-Instance pattern** for scalability and isolation.

| Contract | Purpose | OZ Primitives |
|---|---|---|
| `RotaFiFactory.sol` | **Discovery & Registry**. Deploys new circles and tracks member participation globally across the platform. | `Ownable` |
| `RotaFiCircle.sol` | **Protocol Logic**. Handles the escrow, rotation, round-robin payout logic, and late-member penalization. | `AccessControl`, `SafeERC20`, `ReentrancyGuard`, `Pausable` |
| `PolUSDC.sol` | **Stablecoin Gateway**. A custom ERC20 used for testing that includes a 24-hour faucet for testnet users. On Polkadot Mainnet, we use the native USDC token. | `ERC20`, `Ownable` |

---

## Technical Deep Dive

### OpenZeppelin Infrastructure
We didn't just inherit standards; we composed OZ libraries to enforce the ROSCA protocol:
- **`AccessControl`**: Implements a dual-role system. `DEFAULT_ADMIN_ROLE` (Global Admin) can pause the platform, while `CIRCLE_ADMIN_ROLE` (Circle Creator) manages specific group parameters.
- **`SafeERC20`**: Essential for the DeFi track. We use `safeTransfer` and `safeTransferFrom` to handle the USDC escrow logic, ensuring the contract remains robust against non-standard ERC20 implementations.
- **`Pausable`**: Integrated into all state-changing functions (`join`, `deposit`, `payout`) as a circuit breaker for security.
- **`ReentrancyGuard`**: Protects the `triggerPayout` function, preventing malicious recipients from double-claiming the pot.

### Architecture & Custom Logic
- **Rotating Recipient Model**: The contract maintains an ordered array of members. Every `triggerPayout` call increments the `currentRound` and switches the `recipient` index, ensuring fair and predictable rotation.
- **The "Dead Man's Switch" Payout**: A crucial UX feature where *any* member can trigger the payout if the deadline is passed, preventing a circle from stalling if one member goes offline.
- **Gas-Optimized Errors**: We utilized Solidity 0.8.24 **Custom Errors** (e.g., `revert NotMember()`) instead of long strings, resulting in ~12% gas savings for our end-users on Polkadot Hub.

---

## Deployment & Development Scripts

The `scripts/` directory contains essential utilities for deploying and testing the protocol.

### 1. `deploy.js`
This script handles the deployment of the entire protocol suite to any EVM-compatible network (Hardhat Local, Polkadot Hub Testnet, etc.).
- **What it does**: Deploys `PolUSDC` (test token) and `RotaFiFactory`.
- **Artifacts**: Automatically generates a `deployments.json` file in the project root containing the new contract addresses.
- **Usage**: 
  ```bash
  npx hardhat run scripts/deploy.js --network <network_name>
  ```

### 2. `seed.js`
A comprehensive seeding script to prepare a local or testnet environment for demonstration.
- **What it does**: 
  - Mints and distributes `PolUSDC` to test wallets (Alice, Bob, Carol).
  - Deploys a "Lagos Savers" circle and simulates member joins and deposits.
  - Deploys an "Abuja Monthly" circle with open spots.
- **Prerequisite**: Requires a valid `deployments.json` (running `deploy.js` first).
- **Usage**:
  ```bash
  npx hardhat run scripts/seed.js --network <network_name>
  ```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contracts | Solidity ^0.8.24 |
| Contract Libraries | OpenZeppelin Contracts |
| Network | Polkadot Hub (EVM) |
| Development | Hardhat (v3) |
| Frontend | React, Vite, React Router |
| Web3 Integration | Wagmi, Viem |
| Wallet Connection| RainbowKit |
| Stablecoin | USDC |

---

## Project Structure

```
rotafi/
├── contracts/
│   ├── RotaFiCircle.sol
│   ├── RotaFiFactory.sol
│   └── PolUSDC.sol
├── scripts/
│   ├── deploy.js
│   └── seed.js
├── src/
│   ├── components/    # Reusable UI components
│   ├── contracts/     # ABIs and dynamic deployment addresses
│   ├── hooks/         # Custom React hooks (useCircle, useAppState)
│   ├── pages/         # Page components (Overview, Join, Details)
│   ├── theme.js       # Design system
│   ├── wagmi.js       # Wagmi & RainbowKit configuration
│   ├── App.jsx        # App router and layout
│   └── main.jsx       # Entry point
├── test/
├── .env
├── hardhat.config.js
├── package.json
├── README.md
└── vite.config.js
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- MetaMask browser extension
- Polkadot Hub testnet configured in MetaMask

### Installation

```bash
git clone https://github.com/mikky69/rotafi.git
cd rotafi
npm install
```

### Environment Variables

Copy the `.env.example` to `.env` (or create a `.env` file):

```bash
cp .env.example .env
```

Fill in your `.env`:

```env
PRIVATE_KEY=your_wallet_private_key
WALLET_ADDRESS=your_wallet_address

# Hardhat Local Deployment Addreses
VITE_USDC_ADDRESS=""
VITE_CIRCLE_FACTORY_ADDRESS=""

# Polkadot Hub Testnet
POLKADOT_HUB_RPC=https://eth-rpc-testnet.polkadot.io
```

### Run Local Hardhat Node

```bash
npm run node
```

### Deploy Contracts (Local)

In a separate terminal, deploy the contracts to the local Hardhat network:

```bash
npm run deploy:local
```

### Run the Frontend

Start the Vite development server:

```bash
npm run dev
```

### Deploy to Polkadot Hub Testnet

If you want to deploy your own instance to the testnet:

```bash
npm run deploy:testnet
```

Note: RotaFi's frontend is set up to automatically use the latest deployments from `src/contracts/deployments.json`, which is updated every time you run the deployment scripts.

---

## Polkadot Hub Integration

RotaFi is deployed on **Polkadot Hub's native EVM layer**. This gives RotaFi access to:

- **Shared security** from the Polkadot relay chain
- **Low transaction fees**
- **Cross-chain potential** via Polkadot's XCM messaging protocol
- **EVM compatibility** allowing standard Solidity tooling (Hardhat, MetaMask, OpenZeppelin) with no modifications

---

## Roadmap

- [x] Core savings circle contract
- [x] Factory deployment pattern
- [x] React frontend MVP with Web3 wallet support
- [x] Contract integration and state syncing (Wagmi/Viem)
- [ ] Multi-token support (DOT, other stablecoins)
- [ ] Cross-chain circle membership via XCM
- [ ] On-chain reputation score for members
- [x] Mobile-first PWA

---

## Team

Built during the **Polkadot Solidity Hackathon 2026**, organized by OpenGuild and the Web3 Foundation.
