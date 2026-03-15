import React from 'react';
import { useNavigate } from 'react-router-dom';
import { T, sans } from '../theme.js';
import { Spinner } from './ui.jsx';
import { useAppState } from '../hooks/useAppState.jsx';

export default function ConnectPrompt() {
  const { handleConnect, isConnecting, walletError } = useAppState();
  const navigate = useNavigate();

  return (
    <div style={{ minHeight:'100%', display:'flex', alignItems:'center', justifyContent:'center', padding:24, background:T.bg }}>
      <div style={{ maxWidth:380, width:'100%', textAlign:'center', animation:'fadeUp .3s ease both' }}>
        <div style={{ width:54, height:54, borderRadius:14, background:T.pinkDim, border:`1px solid ${T.pinkD}60`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 22px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={T.pink} strokeWidth="2">
            <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>
          </svg>
        </div>
        <h2 style={{ fontFamily:"'Sora',sans-serif", fontSize:20, fontWeight:700, color:T.text, marginBottom:10 }}>Connect your wallet</h2>
        <p style={{ color:T.muted, fontSize:14, lineHeight:1.7, marginBottom:26 }}>
          Connect your Polkadot wallet to access this page. You'll land right here after connecting.
        </p>
        <button onClick={handleConnect} disabled={isConnecting}
          style={{ width:'100%', padding:'13px 24px', background:isConnecting?T.dim:T.pink, color:'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:600, fontFamily:sans, cursor:isConnecting?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10, transition:'background .15s', boxShadow:isConnecting?'none':`0 0 28px ${T.pinkGlow}` }}>
          {isConnecting && <Spinner size={16} color="#fff"/>}
          {isConnecting ? 'Connecting...' : 'Connect Polkadot Wallet'}
        </button>
        {walletError && (
          <div style={{ marginTop:14, background:T.errBg, border:`1px solid ${T.errBdr}`, color:T.err, borderRadius:8, padding:'10px 14px', fontSize:13 }}>{walletError}</div>
        )}
        <button onClick={()=>navigate('/')} style={{ marginTop:14, color:T.muted, fontSize:13, fontFamily:sans, cursor:'pointer', textDecoration:'underline', textUnderlineOffset:3 }}>
          Back to home
        </button>
      </div>
    </div>
  );
}
