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

RotaFi brings the trusted community savings model known as **Ajo**, **Esusu**, and **Chit Funds** on-chain. Groups of participants commit to regular contributions in **USDC, DOT, or any ERC20 token**, managed entirely by smart contracts—no middleman, no trust required. Each cycle, one member receives the full pot, rotating until everyone has been paid out.

**Now featuring Multi-Token Support and Automatic Payouts.**

Built with OpenZeppelin contracts on Polkadot Hub's EVM layer, RotaFi makes community finance transparent, permissionless, and accessible to anyone with a wallet.

---

## The Problem

Rotating savings groups have existed for centuries across Africa, Asia, and Latin America. They work, but they depend entirely on trust between members and a human organizer who can disappear with the funds, miss a payout, or simply make mistakes. There is no transparency, no enforcement, and no recourse.

RotaFi removes the human middleman and replaces trust with code.

---

## How It Works

1. **Create a circle** — a group admin deploys a new savings circle, sets the contribution amount and **token type** (USDC, DOT, or any custom ERC20), the cycle duration, and the member cap.
2. **Members join** — participants join by connecting their wallet. The circle locks once the member cap is reached.
3. **Contribute each cycle** — every member deposits their contribution before the cycle deadline.
4. **Automatic payout** — as soon as the last member of a round deposits, the smart contract **automatically triggers the payout** and advances the round, ensuring a seamless user experience.
5. **Rotation continues** — the cycle repeats, rotating through all members until everyone has received their payout.
6. **Late penalties** — members who miss a contribution deadline are penalized; funds are held until they pay up.

---

## Smart Contracts

RotaFi is architected using a **Factory-Instance pattern** for scalability and isolation.

| Contract | Purpose | OZ Primitives |
|---|---|---|
| `RotaFiFactory.sol` | **Discovery & Registry**. Deploys new circles and tracks member participation globally across the platform. | `Ownable`, `AccessControl` |
| `RotaFiCircle.sol` | **Protocol Logic**. Handles the escrow, rotation, multi-token metadata, and automatic payout logic. | `AccessControl`, `SafeERC20`, `ReentrancyGuard`, `Pausable` |
| `PolUSDC.sol` / `PolDOT.sol` | **Testnet Assets**. Custom ERC20 tokens for Paseo testnet with 24-hour faucets for seamless testing. | `ERC20`, `Ownable` |

---

## Technical Deep Dive

### OpenZeppelin & Security Infrastructure
We composed multiple OZ libraries to enforce the ROSCA protocol and ensure institutional-grade security:
- **`SafeERC20`**: A core requirement for the DeFi track. We use `safeTransfer` and `safeTransferFrom` to handle escrow, ensuring RotaFi is compatible with all token variants (including those with missing return values or complex behavior).
- **`AccessControl`**: Implements a robust permission system. `DEFAULT_ADMIN_ROLE` handles global emergency pauses, while `CIRCLE_ADMIN_ROLE` empowers individual circle creators.
- **`ReentrancyGuard`**: Protects all sensitive transfer functions, preventing a payout recipient from recursively calling the contract to drain the pot.
- **`Pausable`**: Provides a global circuit breaker to protect user funds in case of emergency.

### Advanced Features
- **Universal Multi-Token Support**: Unlike standard ROSCAs, RotaFi supports any ERC20. The contracts dynamically query `IERC20Metadata` to fetch `symbol()` and `decimals()`, ensuring the UI calculates "the pot" correctly for any asset (USDC, DOT, etc.).
- **Automatic Payout Logic**: We optimized the `deposit()` function to check for round completion. If the current deposit is the last one needed, the contract immediately executes the payout and starts the next round in a single atomic transaction.
- **Gas-Optimized Errors**: We utilized Solidity 0.8.24 **Custom Errors** (e.g., `revert AlreadyMember()`) instead of expensive strings, saving users significant gas on Polkadot Hub.

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
| Contract Libraries | OpenZeppelin Contracts (AccessControl, SafeERC20, ReentrancyGuard, Pausable) |
| Network | Polkadot Hub (EVM) |
| Development | Hardhat |
| Frontend | React, Vite, React Router |
| Web3 Integration | Wagmi, Viem |
| Wallet Connection| RainbowKit |
| Tokens Supported | Multi-Token (USDC, DOT, Custom ERC20) |

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

#### 3. Seed demo circles
```bash
npm run seed:local
```

---

## Contract Verification

RotaFi contracts are verified on the **Polkadot Hub Testnet (Paseo) Routescan Explorer**. Verification ensures transparency and allows users to interact with the contracts directly through the web interface.

### Verified Contracts
- **RotaFiFactory**: [`0xAc0Cce18A19A3e9262B9C48d8B94B032Cff05C3D`](https://polkadot.testnet.routescan.io/address/0xAc0Cce18A19A3e9262B9C48d8B94B032Cff05C3D#code)
- **PolUSDC**: [`0x1251B41cE5De06D5baD51619f928c3b539eA73c2`](https://polkadot.testnet.routescan.io/address/0x1251B41cE5De06D5baD51619f928c3b539eA73c2#code)
- **PolDOT**: [`0x2A90232C05f36F7d715D31524f68088bA64F8EAA`](https://polkadot.testnet.routescan.io/address/0x2A90232C05f36F7d715D31524f68088bA64F8EAA#code)

### How to Verify New Contracts
If you deploy a new circle or factory, use the following Hardhat v3 command:

```bash
npx hardhat verify --network paseo <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

**Example (Verifying a Circle):**
```bash
npx hardhat verify --network paseo 0x... "Lagos Savers" 3 50000000 86400 0x... 0x...
```

*Note: The `hardhat.config.js` is pre-configured with `chainDescriptors` for the Polkadot Hub Testnet (Chain ID: 420420417) to support Routescan's Etherscan-compatible API.*

---

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
- [x] Multi-token support (DOT, USDC, Custom ERC20)
- [x] Automatic Round Payouts
- [ ] Cross-chain circle membership via XCM
- [ ] On-chain reputation score for members
- [x] Mobile-first PWA

---

## Team

Built during the **Polkadot Solidity Hackathon 2026**, organized by OpenGuild and the Web3 Foundation.
