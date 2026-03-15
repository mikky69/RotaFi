/**
 * useAppState.jsx — central app context
 * Includes: wallet, circles, profile (persisted to localStorage)
 */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { usePolkadot } from './usePolkadot.js';

// ── Profile helpers ───────────────────────────────────────────────────────────
const PROFILE_KEY = 'rotafi_profile';

function loadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveProfile(p) {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch {}
}

const DEFAULT_PROFILE = {
  displayName: '',
  bio: '',
  location: '',
  avatarColor: '#E6007A',
  notifications: { depositReminders: true, payoutAlerts: true },
};

// ── Mock seed data ────────────────────────────────────────────────────────────
const MOCK_CIRCLES = [
  {
    id: 'c1', name: 'Lagos Tech Circle',
    contractAddress: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM58Ot',
    memberCount: 8, memberCap: 8, depositAmount: 100, cycleLabel: 'Monthly',
    currentRound: 3, totalRounds: 8, pot: 800, myPosition: 5, myTurnLabel: 'May 2026',
    hasPaid: true, isAdmin: false,
    roster: [
      { name:'Adaeze O.', position:1, hasPaid:true,  hasReceived:true,  isMe:false },
      { name:'Kemi A.',   position:2, hasPaid:true,  hasReceived:true,  isMe:false },
      { name:'Emeka C.',  position:3, hasPaid:true,  hasReceived:false, isMe:false },
      { name:'Yemi B.',   position:4, hasPaid:false, hasReceived:false, isMe:false },
      { name:'You',       position:5, hasPaid:true,  hasReceived:false, isMe:true  },
      { name:'Chidi N.',  position:6, hasPaid:false, hasReceived:false, isMe:false },
      { name:'Fatima Y.', position:7, hasPaid:false, hasReceived:false, isMe:false },
      { name:'Dele M.',   position:8, hasPaid:false, hasReceived:false, isMe:false },
    ],
    payoutHistory: [
      { round:1, recipientName:'Adaeze O.', amount:800, date:'Jan 15, 2026', txHash:'5F3sa8VXtKGkNjYpmRU9WbFh1y2ZQE7Dv6Xcs' },
      { round:2, recipientName:'Kemi A.',   amount:800, date:'Feb 15, 2026', txHash:'5CiPPrL7sBmTkW4aQd3EHfGx8NvYuZo9Je1'  },
    ],
  },
  {
    id: 'c2', name: 'Abuja Professionals',
    contractAddress: '5DAAnrj7yMZbr9USmDwEo48xB6yYBLeMBrKe1FH2YGTm9FH',
    memberCount: 5, memberCap: 5, depositAmount: 200, cycleLabel: 'Monthly',
    currentRound: 1, totalRounds: 5, pot: 1000, myPosition: 2, myTurnLabel: 'Apr 2026',
    hasPaid: false, isAdmin: true,
    roster: [
      { name:'Bola A.',    position:1, hasPaid:true,  hasReceived:false, isMe:false },
      { name:'You',        position:2, hasPaid:false, hasReceived:false, isMe:true  },
      { name:'Tunde F.',   position:3, hasPaid:false, hasReceived:false, isMe:false },
      { name:'Ngozi E.',   position:4, hasPaid:false, hasReceived:false, isMe:false },
      { name:'Rasheed O.', position:5, hasPaid:false, hasReceived:false, isMe:false },
    ],
    payoutHistory: [],
  },
];

const MOCK_AVAILABLE = [
  { id:'c3', name:'Diaspora Savings Pool',  contractAddress:'5Gyw5wnMkXoAEHJbPdKnPLfANxKEQXMq9k', memberCount:6, memberCap:10, depositAmount:50,  cycleLabel:'Weekly',  pot:500  },
  { id:'c4', name:'Port Harcourt Builders', contractAddress:'5Hq3MkXoAEHJbPdKnPLfANxKEQXMq9kAx', memberCount:3, memberCap:6,  depositAmount:150, cycleLabel:'Monthly', pot:900  },
  { id:'c5', name:'Nairobi Startup Circle', contractAddress:'5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpN', memberCount:4, memberCap:8,  depositAmount:75,  cycleLabel:'Monthly', pot:600  },
  { id:'c6', name:'Accra Digital Savers',   contractAddress:'5CiPPkLrpA2GHFDpXXNsMqBgYzTjWoeR', memberCount:2, memberCap:5,  depositAmount:200, cycleLabel:'Monthly', pot:1000 },
];

const MOCK_ACCOUNT = {
  address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
  meta: { name: 'Demo Wallet' },
};

// ── Context ───────────────────────────────────────────────────────────────────
const AppStateContext = createContext(null);

export function AppStateProvider({ children }) {
  const [connected,  setConnected]  = useState(false);
  const [circles,    setCircles]    = useState(MOCK_CIRCLES);
  const [available,  setAvailable]  = useState(MOCK_AVAILABLE);
  const [toast,      setToast]      = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [profile,    setProfileState] = useState(() => ({ ...DEFAULT_PROFILE, ...(loadProfile() || {}) }));

  const { connect, disconnect, isConnecting, activeAccount, error: walletError } = usePolkadot();

  const account  = activeAccount || MOCK_ACCOUNT;
  // Effective display name: profile > wallet meta name > truncated address
  const sh = a => a ? a.slice(0,6)+'...'+a.slice(-4) : '?';
  const displayName = profile.displayName.trim() || account?.meta?.name || sh(account?.address);

  const notify = useCallback((message, type = 'success') => setToast({ message, type }), []);

  // ── Profile ──────────────────────────────────────────────────────────────
  const updateProfile = useCallback((updates) => {
    setProfileState(prev => {
      const next = { ...prev, ...updates };
      saveProfile(next);
      return next;
    });
  }, []);

  // Keep "You" labels in circles in sync with displayName changes
  useEffect(() => {
    if (!profile.displayName.trim()) return;
    setCircles(prev => prev.map(c => ({
      ...c,
      roster: c.roster.map(m => m.isMe ? { ...m, name: profile.displayName.trim() } : m),
    })));
  }, [profile.displayName]);

  // ── Connect / disconnect ──────────────────────────────────────────────────
  const handleConnect = useCallback(async () => {
    try { await connect(); } catch (_) {}
    setConnected(true);
  }, [connect]);

  const handleDisconnect = useCallback(async () => {
    await disconnect();
    setConnected(false);
    setCircles(MOCK_CIRCLES);
    setAvailable(MOCK_AVAILABLE);
  }, [disconnect]);

  // ── Deposit ───────────────────────────────────────────────────────────────
  const handleDeposit = useCallback(async (circleId) => {
    await new Promise(r => setTimeout(r, 2000));
    setCircles(prev => prev.map(c =>
      c.id !== circleId ? c : {
        ...c, hasPaid: true,
        roster: c.roster.map(m => m.isMe ? { ...m, hasPaid: true } : m),
      }
    ));
    const c = circles.find(x => x.id === circleId);
    if (c) notify(`Deposit of $${Number(c.depositAmount).toFixed(2)} USDC confirmed on-chain`);
  }, [circles, notify]);

  // ── Trigger payout ────────────────────────────────────────────────────────
  const handleTriggerPayout = useCallback(async (circleId) => {
    await new Promise(r => setTimeout(r, 2000));
    setCircles(prev => {
      const circle = prev.find(x => x.id === circleId);
      if (!circle) return prev;
      const recipient = circle.roster.find(m => m.position === circle.currentRound);
      notify(`Pot of $${Number(circle.pot).toFixed(2)} sent to ${recipient?.name || 'recipient'}`);
      return prev.map(c => {
        if (c.id !== circleId) return c;
        return {
          ...c,
          currentRound: c.currentRound + 1,
          roster: c.roster.map(m => m.position === c.currentRound ? { ...m, hasReceived: true } : m),
          payoutHistory: [...c.payoutHistory, {
            round: c.currentRound, recipientName: recipient?.name || '?',
            amount: c.pot,
            date: new Date().toLocaleDateString('en', { month:'short', day:'numeric', year:'numeric' }),
            txHash: '5' + Math.random().toString(36).slice(2, 38).toUpperCase(),
          }],
        };
      });
    });
  }, [notify]);

  // ── Join ──────────────────────────────────────────────────────────────────
  const handleJoin = useCallback(async (circleId) => {
    await new Promise(r => setTimeout(r, 1500));
    const myName = profile.displayName.trim() || 'You';
    setAvailable(prev => {
      const c = prev.find(x => x.id === circleId);
      if (!c) return prev;
      setCircles(p => [...p, {
        ...c,
        memberCount: c.memberCount + 1,
        currentRound: 1, totalRounds: c.memberCap,
        myPosition: c.memberCount + 1, myTurnLabel: 'TBD',
        hasPaid: false, isAdmin: false,
        roster: [{ name: myName, position: c.memberCount + 1, hasPaid: false, hasReceived: false, isMe: true }],
        payoutHistory: [],
      }]);
      notify(`Joined "${c.name}" successfully`);
      return prev.filter(x => x.id !== circleId);
    });
  }, [profile.displayName, notify]);

  // ── Create ────────────────────────────────────────────────────────────────
  const handleCreate = useCallback(async (params) => {
    await new Promise(r => setTimeout(r, 2000));
    const myName = profile.displayName.trim() || 'You';
    const newCircle = {
      id: `c${Date.now()}`, name: params.name,
      contractAddress: '5' + Math.random().toString(36).slice(2, 46).toUpperCase(),
      memberCount: 1, memberCap: params.memberCap,
      depositAmount: params.depositAmountDisplay, cycleLabel: params.cycleLabel,
      currentRound: 0, totalRounds: params.memberCap,
      pot: params.memberCap * params.depositAmountDisplay,
      myPosition: 1, myTurnLabel: 'TBD',
      hasPaid: false, isAdmin: true,
      roster: [{ name: myName, position: 1, hasPaid: false, hasReceived: false, isMe: true }],
      payoutHistory: [],
    };
    setCircles(prev => [...prev, newCircle]);
    notify(`"${params.name}" deployed to Polkadot`);
    return newCircle.id;
  }, [profile.displayName, notify]);

  const value = {
    connected, account, displayName, circles, available,
    toast, showCreate, isConnecting, walletError,
    profile, updateProfile,
    setToast, setShowCreate,
    handleConnect, handleDisconnect,
    handleDeposit, handleTriggerPayout,
    handleJoin, handleCreate,
    notify,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used inside AppStateProvider');
  return ctx;
}
