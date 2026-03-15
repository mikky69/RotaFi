import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
    'process.env': {},
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  optimizeDeps: {
    include: [
      '@polkadot/api',
      '@polkadot/api-contract',
      '@polkadot/extension-dapp',
    ],
  },
  server: {
    port: 3000,
    host: '0.0.0.0'
  }
});
