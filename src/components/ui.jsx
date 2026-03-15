import React, { useEffect } from 'react';
import { T, sans } from '../theme.js';

export function Spinner({ size = 15, color = T.bg }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', border: `2px solid ${color}40`, borderTopColor: color, animation: 'spin .65s linear infinite', flexShrink: 0 }} />
  );
}

export function Badge({ label, color, bg, border }) {
  return (
    <span style={{ background: bg, color, border: `1px solid ${border || color + '40'}`, fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 4, letterSpacing: '.03em', whiteSpace: 'nowrap', flexShrink: 0, fontFamily: sans }}>
      {label}
    </span>
  );
}

export function Ring({ pct = 0, size = 80, strokeWidth = 5, color = T.pink }) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * Math.min(Math.max(pct, 0), 1);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={T.border} strokeWidth={strokeWidth} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={`${dash} ${c}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray .5s ease' }} />
    </svg>
  );
}

export function Toast({ message, type = 'success', onClose }) {
  const ok  = type === 'success';
  const bg  = ok ? T.okBg  : T.errBg;
  const bdr = ok ? T.okBdr : T.errBdr;
  const clr = ok ? T.ok    : T.err;
  useEffect(() => { const t = setTimeout(onClose, 4500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ position:'fixed', bottom:24, right:24, zIndex:9999, background:'var(--card)', border:`1px solid ${bdr}`, padding:'13px 18px', borderRadius:10, fontSize:14, display:'flex', alignItems:'center', gap:10, maxWidth:380, animation:'fadeIn .2s ease', boxShadow:'0 8px 40px rgba(0,0,0,.7)', fontFamily:sans }}>
      <div style={{ width:8, height:8, borderRadius:'50%', background:clr, flexShrink:0, animation:'pulseDot 2s infinite' }} />
      <span style={{ flex:1, color:T.text }}>{message}</span>
      <button onClick={onClose} style={{ color:T.muted, fontSize:18, lineHeight:1, cursor:'pointer' }}>&#x2715;</button>
    </div>
  );
}

export function Metric({ label, value, accent, sub }) {
  return (
    <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:10, padding:'18px 20px' }}>
      <div style={{ color:T.muted, fontSize:11, fontWeight:500, marginBottom:10, textTransform:'uppercase', letterSpacing:'.06em' }}>{label}</div>
      <div style={{ fontSize:26, fontWeight:600, color:accent || T.text, fontFamily:"'Sora',sans-serif", lineHeight:1.1 }}>{value}</div>
      {sub && <div style={{ color:T.muted, fontSize:12, marginTop:6 }}>{sub}</div>}
    </div>
  );
}

export function GoldButton({ children, onClick, disabled, style: extra, variant = 'pink' }) {
  const bg = variant === 'pink' ? T.pink : T.card;
  const cl = variant === 'pink' ? '#fff' : T.text;
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ background: disabled ? T.dim : bg, color: disabled ? T.muted : cl, border: variant === 'ghost' ? `1px solid ${T.border}` : 'none', borderRadius:8, padding:'11px 20px', fontSize:14, fontWeight:500, display:'flex', alignItems:'center', justifyContent:'center', gap:8, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .6 : 1, transition:'all .15s', fontFamily:sans, whiteSpace:'nowrap', ...extra }}>
      {children}
    </button>
  );
}

export function Avatar({ name = '?', size = 32, active = false }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background: active ? T.pinkDim : T.card, border:`1.5px solid ${active ? T.pink : T.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*.33, fontWeight:600, color: active ? T.pink : T.muted, flexShrink:0, fontFamily:sans }}>
      {initials}
    </div>
  );
}

export function Divider({ margin = '0' }) {
  return <div style={{ borderTop:`1px solid ${T.border}`, margin }} />;
}

export function Tag({ children, color = T.pink }) {
  return (
    <span style={{ background: color + '18', color, fontSize:11, fontWeight:500, padding:'3px 10px', borderRadius:20, letterSpacing:'.02em', whiteSpace:'nowrap', border:`1px solid ${color}30` }}>
      {children}
    </span>
  );
}

export function StatusDot({ active }) {
  return (
    <div style={{ width:7, height:7, borderRadius:'50%', background: active ? T.ok : T.muted, flexShrink:0, boxShadow: active ? `0 0 6px ${T.ok}` : 'none' }} />
  );
}

export function Empty({ message, cta }) {
  return (
    <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:'48px 24px', textAlign:'center' }}>
      <div style={{ width:48, height:48, borderRadius:12, background:T.pinkDim, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', fontSize:22 }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={T.pink} strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
      </div>
      <p style={{ color:T.muted, fontSize:14, lineHeight:1.7, marginBottom: cta ? 20 : 0 }}>{message}</p>
      {cta}
    </div>
  );
}
