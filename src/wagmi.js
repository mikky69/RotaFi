import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';

// Define the Polkadot Hub Testnet (Paseo)
export const polkadotHubTestnet = {
  id: 420420417,
  name: 'Polkadot Hub Testnet',
  network: 'polkadot-hub-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Paseo',
    symbol: 'PAS',
  },
  rpcUrls: {
    default: { http: [process.env.POLKADOT_HUB_RPC ?? 'https://eth-rpc-testnet.polkadot.io'] },
    public: { http: [process.env.POLKADOT_HUB_RPC ?? 'https://eth-rpc-testnet.polkadot.io'] },
  },
  blockExplorers: {
    default: { name: 'Polkadot Hub Explorer', url: 'https://polkadot.testnet.routescan.io' },
  },
  testnet: true,
};

export const localHardhat = {
  id: 31337,
  name: 'Local Hardhat Node',
  network: 'localhost',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
    public: { http: ['http://127.0.0.1:8545'] },
  },
};

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo';

export const config = getDefaultConfig({
  appName: 'RotaFi',
  projectId,
  chains: [polkadotHubTestnet, localHardhat],
  transports: {
    [polkadotHubTestnet.id]: http(),
    [localHardhat.id]: http(),
  },
});
