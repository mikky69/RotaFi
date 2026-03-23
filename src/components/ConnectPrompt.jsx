import React from 'react';
import { useNavigate } from 'react-router-dom';
import { COLORS } from '../theme.js';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function ConnectPrompt() {
  const navigate = useNavigate();

  return (
    <div className="min-h-full flex items-center justify-center p-6 bg-bg">
      <div className="max-w-sm w-full text-center" style={{ animation: 'fadeUp .3s ease both' }}>
        <div
          className="w-[54px] h-[54px] rounded-2xl flex items-center justify-center mx-auto mb-6 border"
          style={{ background: 'var(--pink-dim)', borderColor: 'var(--pink-d)60' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={COLORS.pink} strokeWidth="2">
            <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>
          </svg>
        </div>
        <h2 className="font-sora text-xl font-bold text-ink mb-2.5">Connect your wallet</h2>
        <p className="text-muted text-sm leading-relaxed mb-7">
          Connect your wallet to access this page
        </p>
        <div className="flex justify-center">
          <ConnectButton />
        </div>
        <button
          onClick={() => navigate('/')}
          className="mt-6 text-muted text-sm underline underline-offset-2 cursor-pointer hover:text-ink transition-colors"
        >
          Back to home
        </button>
      </div>
    </div>
  );
}
