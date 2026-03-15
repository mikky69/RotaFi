import React from 'react';
import { T, sans } from '../theme.js';
import { useTheme } from '../hooks/useTheme.jsx';
import { Spinner } from '../components/ui.jsx';

export default function LandingPage({ onConnect, isConnecting, error }) {
  const { isDark, toggle } = useTheme();
  const sunPath  = 'M12 4.354a4 4 0 1 1 0 15.292M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41';
  const moonPath = 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z';

  return (
    <div style={{ minHeight:'100vh', background:T.bg, fontFamily:sans, overflowX:'hidden' }}>

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav style={{
        position:'fixed', top:0, left:0, right:0, zIndex:100,
        borderBottom:`1px solid ${T.border}`,
        background: isDark ? 'rgba(13,13,15,.88)' : 'rgba(244,244,246,.88)',
        backdropFilter:'blur(14px)',
        height:60, display:'flex', alignItems:'center',
        justifyContent:'space-between',
        padding:'0 clamp(16px, 5vw, 48px)',
      }}>
        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:28, height:28, borderRadius:8, background: T.transparent, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            {/* <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg> */}
            <img src="/rotafi_logo.svg" alt="" width='64px' height='64px' />
          </div>
          <span style={{ fontFamily:"'Sora',sans-serif", fontSize:17, fontWeight:700, color:T.text, letterSpacing:'-.01em' }}>RotaFi</span>
          <span style={{ fontSize:10, fontWeight:600, color:T.pink, background:T.pinkDim, border:`1px solid ${T.pinkD}60`, padding:'2px 7px', borderRadius:4, letterSpacing:'.04em' }}>POLKADOT</span>
        </div>

        {/* Right: theme toggle + CTA — no nav links */}
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button
            onClick={toggle}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{ width:34, height:34, borderRadius:8, border:`1px solid ${T.border}`, background:'none', color:T.muted, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'all .15s', flexShrink:0 }}
            onMouseEnter={e=>{ e.currentTarget.style.background=T.card; e.currentTarget.style.color=T.text; }}
            onMouseLeave={e=>{ e.currentTarget.style.background='none'; e.currentTarget.style.color=T.muted; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              {(isDark ? sunPath : moonPath).split('M').filter(Boolean).map((seg, i) => (
                <path key={i} d={'M' + seg} />
              ))}
            </svg>
          </button>

          <button
            onClick={onConnect}
            disabled={isConnecting}
            style={{ background:T.pink, color:'#fff', border:'none', borderRadius:8, padding:'8px 18px', fontSize:13, fontWeight:600, fontFamily:sans, cursor:isConnecting?'not-allowed':'pointer', opacity:isConnecting?.7:1, display:'flex', alignItems:'center', gap:7, transition:'all .15s', flexShrink:0 }}
            onMouseEnter={e=>{ if(!isConnecting) e.currentTarget.style.background=T.pinkL; }}
            onMouseLeave={e=>e.currentTarget.style.background=T.pink}
          >
            {isConnecting ? <Spinner size={13} color="#fff" /> : null}
            {isConnecting ? 'Connecting...' : 'Launch App'}
          </button>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section style={{ padding:'140px 24px 100px', textAlign:'center', position:'relative', overflow:'hidden' }}>
        {/* Background glow */}
        <div style={{ position:'absolute', top:'10%', left:'50%', transform:'translateX(-50%)', width:600, height:400, background:`radial-gradient(ellipse at center, ${T.pinkGlow} 0%, transparent 70%)`, pointerEvents:'none', zIndex:0 }} />
        {/* Grid */}
        <div style={{ position:'absolute', inset:0, backgroundImage:`linear-gradient(${T.border} 1px, transparent 1px), linear-gradient(90deg, ${T.border} 1px, transparent 1px)`, backgroundSize:'40px 40px', opacity:.25, zIndex:0 }} />

        <div style={{ position:'relative', zIndex:1, maxWidth:760, margin:'0 auto', animation:'fadeUp .5s ease both' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:T.pinkDim, border:`1px solid ${T.pinkD}60`, borderRadius:20, padding:'6px 14px', marginBottom:32 }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:T.pink, animation:'pulseDot 2s infinite' }} />
            <span style={{ color:T.pink, fontSize:12, fontWeight:600, letterSpacing:'.05em' }}>LIVE ON POLKADOT</span>
          </div>

          <h1 style={{ fontFamily:"'Sora',sans-serif", fontSize:'clamp(36px, 8vw, 64px)', fontWeight:700, color:T.text, lineHeight:1.05, marginBottom:24, letterSpacing:'-.03em' }}>
            Savings circles,<br />
            <span style={{ color:T.pink }}>trustless</span> and<br />
            on-chain.
          </h1>

          <p style={{ color:T.muted, fontSize:'clamp(15px, 2.5vw, 18px)', lineHeight:1.75, maxWidth:540, margin:'0 auto 48px', fontWeight:300 }}>
            RotaFi brings the Ajo, Esusu, and Chit fund tradition to Polkadot.
            Groups pool USDC together each cycle. A smart contract guarantees
            every member receives the pot — no middleman required.
          </p>

          <button
            onClick={onConnect}
            disabled={isConnecting}
            style={{ background:T.pink, color:'#fff', border:'none', borderRadius:10, padding:'14px 32px', fontSize:15, fontWeight:600, fontFamily:sans, cursor:isConnecting?'not-allowed':'pointer', display:'inline-flex', alignItems:'center', gap:10, boxShadow:`0 0 40px ${T.pinkGlow}`, transition:'all .2s', opacity:isConnecting?.7:1 }}
            onMouseEnter={e=>{ if(!isConnecting){ e.currentTarget.style.background=T.pinkL; e.currentTarget.style.transform='translateY(-1px)'; }}}
            onMouseLeave={e=>{ e.currentTarget.style.background=T.pink; e.currentTarget.style.transform='none'; }}
          >
            {isConnecting
              ? <Spinner size={16} color="#fff" />
              : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
            }
            {isConnecting ? 'Connecting wallet...' : 'Connect Wallet & Launch'}
          </button>

          {error && (
            <div style={{ marginTop:20, background:T.errBg, border:`1px solid ${T.errBdr}`, color:T.err, borderRadius:8, padding:'11px 16px', fontSize:13, maxWidth:460, margin:'20px auto 0' }}>
              {error}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA strip ───────────────────────────────────────────────────── */}
      <section style={{ padding:'0 clamp(16px, 5vw, 48px) 80px' }}>
        <div style={{ maxWidth:860, margin:'0 auto', background:`linear-gradient(135deg, ${T.pinkD}30 0%, ${T.purple}20 100%)`, border:`1px solid ${T.pinkD}50`, borderRadius:16, padding:'clamp(32px, 6vw, 52px) clamp(24px, 5vw, 48px)', textAlign:'center', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-60, right:-60, width:220, height:220, borderRadius:'50%', background:`radial-gradient(${T.pinkGlow}, transparent 70%)`, pointerEvents:'none' }} />
          <h2 style={{ fontFamily:"'Sora',sans-serif", fontSize:'clamp(22px, 4vw, 34px)', fontWeight:700, color:T.text, marginBottom:12, letterSpacing:'-.02em', position:'relative' }}>
            Ready to start saving with your circle?
          </h2>
          <p style={{ color:T.muted, fontSize:'clamp(13px, 2vw, 15px)', marginBottom:32, position:'relative' }}>
            Connect your Polkadot wallet to create a new circle or join an existing one.
          </p>
          <button
            onClick={onConnect}
            disabled={isConnecting}
            style={{ background:T.pink, color:'#fff', border:'none', borderRadius:10, padding:'14px 36px', fontSize:15, fontWeight:600, fontFamily:sans, cursor:isConnecting?'not-allowed':'pointer', display:'inline-flex', alignItems:'center', gap:10, position:'relative', transition:'all .2s', opacity:isConnecting?.7:1 }}
            onMouseEnter={e=>{ if(!isConnecting) e.currentTarget.style.background=T.pinkL; }}
            onMouseLeave={e=>e.currentTarget.style.background=T.pink}
          >
            {isConnecting ? <Spinner size={15} color="#fff" /> : null}
            {isConnecting ? 'Connecting...' : 'Get started'}
          </button>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer style={{ borderTop:`1px solid ${T.border}`, padding:'20px clamp(16px, 5vw, 48px)', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:20, height:20, borderRadius:5, background:T.pink, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          </div>
          <span style={{ color:T.muted, fontSize:13, fontFamily:"'Sora',sans-serif", fontWeight:600 }}>RotaFi</span>
        </div>
        <span style={{ color:T.dim, fontSize:12 }}>Built on Polkadot · ink! smart contracts · PSP22 USDC</span>
      </footer>
    </div>
  );
}
