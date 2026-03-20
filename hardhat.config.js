import { config as dotenvConfig } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "hardhat/config";
import hardhatEthers from "@nomicfoundation/hardhat-ethers";
import hardhatMocha from "@nomicfoundation/hardhat-mocha";
import hardhatEthersChaiMatchers from "@nomicfoundation/hardhat-ethers-chai-matchers";
import hardhatNetworkHelpers from "@nomicfoundation/hardhat-network-helpers";
import hardhatVerify from "@nomicfoundation/hardhat-verify";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenvConfig({ path: resolve(__dirname, ".env") });

const PRIVATE_KEY = process.env.PRIVATE_KEY;

export default defineConfig({
  plugins: [
    hardhatEthers,
    hardhatMocha,
    hardhatEthersChaiMatchers,
    hardhatNetworkHelpers,
    hardhatVerify,
  ],

  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: false,
    },
  },

  networks: {
    hardhat: {
      type: "edr-simulated",
    },
    localhost: {
      type: "http",
      url: "http://127.0.0.1:8545",
    },
    paseo: {
      type: "http",
      url: process.env.POLKADOT_HUB_RPC ?? "https://eth-rpc-testnet.polkadot.io/",
      chainId: 420420417,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      gasPrice: "auto",
    },
  },

  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },

  chainDescriptors: {
    420420417: {
      name: "paseo",
      blockExplorers: {
        etherscan: {
          name: "Routescan",
          url: "https://polkadot.testnet.routescan.io",
          apiUrl: "https://api.routescan.io/v2/network/testnet/evm/420420417/etherscan",
        },
      },
    },
  },

  verify: {
    etherscan: {
      apiKey: "rsc_H4C7TH0",
    },
  },
});
