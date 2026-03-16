import React from 'react';
import { useNavigate } from 'react-router-dom';
import { T, sans } from '../theme.js';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function ConnectPrompt() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: T.bg }}>
      <div style={{ maxWidth: 380, width: '100%', textAlign: 'center', animation: 'fadeUp .3s ease both' }}>
        <div style={{ width: 54, height: 54, borderRadius: 14, background: T.pinkDim, border: `1px solid ${T.pinkD}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 22px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={T.pink} strokeWidth="2">
            <rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" />
          </svg>
        </div>
        <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 700, color: T.text, marginBottom: 10 }}>Connect your wallet</h2>
        <p style={{ color: T.muted, fontSize: 14, lineHeight: 1.7, marginBottom: 26 }}>
          Connect your wallet to access this page
        </p>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <ConnectButton />
        </div>

        <button onClick={() => navigate('/')} style={{ marginTop: 24, color: T.muted, fontSize: 13, fontFamily: sans, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3, background: 'none', border: 'none' }}>
          Back to home
        </button>
      </div>
    </div>
  );
}
