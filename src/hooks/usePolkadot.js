/**
 * usePolkadot.js
 *
 * Handles:
 *  - Polkadot.js extension wallet connection
 *  - ApiPromise connection to a Substrate node
 *  - ContractPromise interaction with the RotaFi ink! contract
 *
 * Usage:
 *   const { accounts, connect, disconnect, api, isConnected } = usePolkadot();
 */
import { useState, useCallback, useRef } from 'react';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
import {
  web3Enable,
  web3Accounts,
  web3FromAddress,
} from '@polkadot/extension-dapp';
import ROTAFI_ABI from '../contract/abi.json';

// ── Config ─────────────────────────────────────────────────────────────────
// Change these to your target network
const WS_ENDPOINT      = import.meta.env.VITE_WS_ENDPOINT      || 'wss://rpc.astar.network';
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS  || '';
const APP_NAME         = 'RotaFi';

// ── Hook ───────────────────────────────────────────────────────────────────
export function usePolkadot() {
  const [accounts, setAccounts]       = useState([]);
  const [activeAccount, setActiveAccount] = useState(null);
  const [api, setApi]                 = useState(null);
  const [contract, setContract]       = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError]             = useState(null);
  const apiRef = useRef(null);

  // ── Connect wallet & chain ──────────────────────────────────────────────
  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      // 1. Enable extension
      const extensions = await web3Enable(APP_NAME);
      if (extensions.length === 0) {
        throw new Error(
          'No Polkadot extension found. Please install the Polkadot.js browser extension.'
        );
      }

      // 2. Get accounts
      const allAccounts = await web3Accounts();
      if (allAccounts.length === 0) {
        throw new Error(
          'No accounts found. Please create or import an account in your Polkadot.js extension.'
        );
      }
      setAccounts(allAccounts);
      setActiveAccount(allAccounts[0]);

      // 3. Connect to node
      const provider = new WsProvider(WS_ENDPOINT);
      const _api = await ApiPromise.create({ provider });
      await _api.isReady;
      apiRef.current = _api;
      setApi(_api);

      // 4. Instantiate contract (if address is configured)
      if (CONTRACT_ADDRESS) {
        const _contract = new ContractPromise(_api, ROTAFI_ABI, CONTRACT_ADDRESS);
        setContract(_contract);
      }

      return { accounts: allAccounts, api: _api };
    } catch (err) {
      setError(err.message || 'Connection failed');
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // ── Disconnect ──────────────────────────────────────────────────────────
  const disconnect = useCallback(async () => {
    if (apiRef.current) {
      await apiRef.current.disconnect();
      apiRef.current = null;
    }
    setApi(null);
    setContract(null);
    setAccounts([]);
    setActiveAccount(null);
    setError(null);
  }, []);

  // ── Switch active account ───────────────────────────────────────────────
  const switchAccount = useCallback((address) => {
    const found = accounts.find((a) => a.address === address);
    if (found) setActiveAccount(found);
  }, [accounts]);

  // ── Contract helpers ────────────────────────────────────────────────────

  /**
   * Query (read-only): calls a contract message that does not mutate state.
   * @param {string} message  - ink! message selector name
   * @param {any[]}  args     - ordered arguments
   * @returns decoded output value
   */
  const query = useCallback(async (message, args = []) => {
    if (!contract || !activeAccount) throw new Error('Not connected');
    const { result, output } = await contract.query[message](
      activeAccount.address,
      { gasLimit: -1 },
      ...args
    );
    if (result.isErr) throw new Error(result.asErr.toString());
    return output?.toHuman();
  }, [contract, activeAccount]);

  /**
   * Execute (mutating): signs and sends a contract call.
   * @param {string}   message   - ink! message selector name
   * @param {any[]}    args      - ordered arguments
   * @param {string}   value     - optional token value to transfer (e.g. '0')
   * @param {Function} onStatus  - callback(status) for transaction events
   */
  const execute = useCallback(async (message, args = [], value = '0', onStatus) => {
    if (!contract || !activeAccount) throw new Error('Not connected');

    const injector = await web3FromAddress(activeAccount.address);

    // Dry-run to estimate gas
    const { gasRequired } = await contract.query[message](
      activeAccount.address,
      { gasLimit: -1, value },
      ...args
    );

    return new Promise((resolve, reject) => {
      contract.tx[message](
        { gasLimit: gasRequired, value },
        ...args
      )
        .signAndSend(activeAccount.address, { signer: injector.signer }, (status) => {
          onStatus?.(status);
          if (status.isInBlock) {
            resolve(status);
          }
          if (status.isError) {
            reject(new Error('Transaction failed'));
          }
        })
        .catch(reject);
    });
  }, [contract, activeAccount]);

  return {
    // State
    accounts,
    activeAccount,
    api,
    contract,
    isConnecting,
    isConnected: !!api && !!activeAccount,
    error,
    // Actions
    connect,
    disconnect,
    switchAccount,
    // Contract
    query,
    execute,
  };
}
