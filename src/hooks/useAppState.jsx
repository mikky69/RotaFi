import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useCirclesData } from './useCircle.js';

// ── Profile helpers ───────────────────────────────────────────────────────────
const PROFILE_KEY = 'rotafi_profile';

function loadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveProfile(p) {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch { }
}

const DEFAULT_PROFILE = {
  displayName: '',
  bio: '',
  location: '',
  avatarColor: '#E6007A',
  notifications: { depositReminders: true, payoutAlerts: true },
};

// ── Context ───────────────────────────────────────────────────────────────────
const AppStateContext = createContext(null);

export function AppStateProvider({ children }) {
  const [toast, setToast] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [profile, setProfileState] = useState(() => ({ ...DEFAULT_PROFILE, ...(loadProfile() || {}) }));

  const { address, isConnected, isConnecting } = useAccount();
  const { disconnectAsync } = useDisconnect();

  const { circles, available, refetch: refetchCircles } = useCirclesData();

  const connected = isConnected;
  const account = address ? { address } : null;
  const sh = a => a ? a.slice(0, 6) + '...' + a.slice(-4) : '?';
  const displayName = profile.displayName.trim() || sh(account?.address);

  const notify = useCallback((message, type = 'success') => setToast({ message, type }), []);
  const updateProfile = useCallback((updates) => {
    setProfileState(prev => {
      const next = { ...prev, ...updates };
      saveProfile(next);
      return next;
    });
  }, []);

  const handleConnect = useCallback(async () => { }, []);

  const handleDisconnect = useCallback(async () => {
    if (disconnectAsync) {
      await disconnectAsync();
    }
  }, [disconnectAsync]);

  const handleDeposit = useCallback(async (circleId) => {
    await refetchCircles();
    notify(`Deposit confirmed on-chain!`);
  }, [refetchCircles, notify]);

  const handleTriggerPayout = useCallback(async (circleId) => {
    await refetchCircles();
    notify(`Payout executed successfully!`);
  }, [refetchCircles, notify]);

  const handleJoin = useCallback(async (circleId) => {
    await refetchCircles();
    notify(`Successfully joined circle!`);
  }, [refetchCircles, notify]);

  const handleCreate = useCallback(async (params) => {
    const beforeIds = new Set([...circles, ...available].map(c => c.id));
    
    const result = await refetchCircles();
    
    // Find the difference
    const afterCircles = [
      ...(result.data?.circles || []),
      ...(result.data?.available || [])
    ];
    
    const newCircle = afterCircles.find(c => !beforeIds.has(c.id));
    
    notify(`"${params.name}" deployed to Polkadot EVM!`);
    
    // Return the new circle ID or empty string if it couldn't detect it immediately
    return newCircle ? newCircle.id : '';
  }, [circles, available, refetchCircles, notify]);

  const handleRefresh = useCallback(async () => {
    await refetchCircles();
  }, [refetchCircles]);

  const value = {
    connected, account, displayName, circles, available,
    toast, showCreate, isConnecting,
    profile, updateProfile,
    setToast, setShowCreate,
    handleConnect, handleDisconnect,
    handleDeposit, handleTriggerPayout,
    handleJoin, handleCreate,
    handleRefresh,
    notify,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    console.error("Missing AppStateContext! Stack trace follows:");
    console.trace();
    throw new Error('useAppState must be used inside AppStateProvider');
  }
  return ctx;
}
