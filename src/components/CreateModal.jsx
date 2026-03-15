import React, { useState } from 'react';
import { T, sans, inputStyle, labelStyle } from '../theme.js';
import { Spinner, GoldButton } from './ui.jsx';

const $ = n => '$' + Number(n||0).toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2});

export default function CreateModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name:'', memberCap:'8', depositAmount:'100', frequency:'Monthly', usdcAddress:'' });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const set = k => e => setForm(f=>({...f,[k]:e.target.value}));

  const cap = parseInt(form.memberCap)||0;
  const amt = parseFloat(form.depositAmount)||0;
  const pot = cap * amt;
  const valid = form.name.trim().length>0 && amt>0 && cap>=3 && form.usdcAddress.trim().length>0;

  const submit = async () => {
    if (!valid) return;
    setSaving(true); setError('');
    try {
      await onCreate({ name:form.name.trim(), memberCap:cap, depositAmount:String(Math.floor(amt*1_000_000)), cycleSeconds: form.frequency==='Weekly'?604800:2592000, usdcAddress:form.usdcAddress.trim(), depositAmountDisplay:amt, cycleLabel:form.frequency });
      onClose();
    } catch(err) {
      setError(err.message || 'Transaction failed.');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9000, padding:24 }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, width:'100%', maxWidth:460, animation:'fadeUp .2s ease', maxHeight:'90vh', overflowY:'auto' }}>

        {/* Header */}
        <div style={{ padding:'20px 26px', borderBottom:`1px solid ${T.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontFamily:"'Sora',sans-serif", fontSize:18, fontWeight:700, color:T.text }}>Create New Circle</div>
            <div style={{ color:T.muted, fontSize:13, marginTop:2 }}>Deploy an ink! contract to Polkadot</div>
          </div>
          <button onClick={onClose} style={{ width:30, height:30, borderRadius:7, border:`1px solid ${T.border}`, background:T.card, color:T.muted, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div style={{ padding:'24px 26px' }}>
          <label style={labelStyle}>Circle name</label>
          <input style={{...inputStyle, marginBottom:18}} placeholder="e.g. Lagos Tech Circle" value={form.name} onChange={set('name')} maxLength={60}/>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:18 }}>
            <div>
              <label style={labelStyle}>Members</label>
              <select style={inputStyle} value={form.memberCap} onChange={set('memberCap')}>
                {[3,4,5,6,8,10,12].map(n=><option key={n} value={n}>{n} members</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Frequency</label>
              <select style={inputStyle} value={form.frequency} onChange={set('frequency')}>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>
          </div>

          <label style={labelStyle}>Amount per member per cycle (USDC)</label>
          <input style={{...inputStyle,marginBottom:18}} type="number" min="1" step="0.01" placeholder="100" value={form.depositAmount} onChange={set('depositAmount')}/>

          <label style={labelStyle}>USDC contract address (PSP22)</label>
          <input style={{...inputStyle,marginBottom:20}} placeholder="5... (PSP22 USDC on your network)" value={form.usdcAddress} onChange={set('usdcAddress')}/>

          {/* Pot preview */}
          <div style={{ background:T.pinkDim, border:`1px solid ${T.pinkD}50`, borderRadius:10, padding:'16px 18px', marginBottom:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
              <span style={{ color:T.muted, fontSize:13 }}>Total pot per cycle</span>
              <span style={{ fontFamily:"'Sora',sans-serif", fontSize:28, fontWeight:700, color:T.pink }}>{$(pot)}</span>
            </div>
            <div style={{ color:T.muted, fontSize:12 }}>{form.memberCap} members × {$(amt)} — each member wins once</div>
          </div>

          {error && <div style={{ background:T.errBg, border:`1px solid ${T.errBdr}`, color:T.err, borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:16 }}>{error}</div>}

          <div style={{ display:'flex', gap:10 }}>
            <button onClick={onClose} style={{ flex:1, padding:12, borderRadius:8, border:`1px solid ${T.border}`, color:T.muted, fontSize:14, background:'none', cursor:'pointer', fontFamily:sans, transition:'background .15s' }}
              onMouseEnter={e=>e.currentTarget.style.background=T.card}
              onMouseLeave={e=>e.currentTarget.style.background='none'}>
              Cancel
            </button>
            <GoldButton onClick={submit} disabled={!valid||saving} style={{ flex:2, padding:12, fontSize:14 }}>
              {saving&&<Spinner size={14} color="#fff"/>}
              {saving?'Deploying contract...':'Create Circle'}
            </GoldButton>
          </div>
        </div>
      </div>
    </div>
  );
}
