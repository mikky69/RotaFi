import React, { useState } from 'react';
import { T, sans, inputStyle, labelStyle } from '../theme.js';
import { useAppState } from '../hooks/useAppState.jsx';
import { useTheme } from '../hooks/useTheme.jsx';
import { Tag, GoldButton, Spinner, Toast } from '../components/ui.jsx';

const sh = a => a ? a.slice(0, 8) + '...' + a.slice(-6) : '';

const AVATAR_COLORS = [
  '#E6007A','#7C3AED','#2563EB','#0891B2',
  '#059669','#D97706','#DC2626','#DB2777',
];

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

export default function ProfilePage() {
  const { profile, updateProfile, account, displayName, circles } = useAppState();
  const { isDark, toggle } = useTheme();
  const [form, setForm]   = useState({ ...profile });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const hasChanges = JSON.stringify(form) !== JSON.stringify(profile);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    updateProfile(form);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const initials = (form.displayName.trim() || displayName)
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';

  const totalSaved  = circles.reduce((s, c) => s + (c.hasPaid ? c.depositAmount : 0), 0);
  const totalEarned = circles.flatMap(c => c.payoutHistory || []).reduce((s, h) => s + h.amount, 0);
  const $ = n => '$' + Number(n || 0).toLocaleString('en', { minimumFractionDigits:2, maximumFractionDigits:2 });

  return (
    <div style={{ padding:'24px 16px', maxWidth:680, margin:'0 auto', animation:'fadeUp .3s ease both' }}>

      {/* ── Page title ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontFamily:"'Sora',sans-serif", fontSize:22, fontWeight:700, color:T.text, marginBottom:4 }}>Profile</h1>
        <p style={{ color:T.muted, fontSize:14 }}>Your identity on RotaFi — visible to other circle members</p>
      </div>

      {/* ── Avatar + stats ─────────────────────────────────────────────── */}
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:'24px', marginBottom:20, display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
        <div style={{ position:'relative' }}>
          <div style={{ width:72, height:72, borderRadius:'50%', background:form.avatarColor, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, fontWeight:700, color:'#fff', fontFamily:"'Sora',sans-serif", flexShrink:0, boxShadow:`0 0 0 3px ${T.card}, 0 0 0 5px ${form.avatarColor}40` }}>
            {initials}
          </div>
          <div style={{ position:'absolute', bottom:-2, right:-2, width:20, height:20, borderRadius:'50%', background:T.ok, border:`2px solid ${T.card}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
        </div>
        <div style={{ flex:1, minWidth:180 }}>
          <div style={{ fontFamily:"'Sora',sans-serif", fontSize:18, fontWeight:700, color:T.text }}>
            {form.displayName.trim() || <span style={{ color:T.muted, fontStyle:'italic', fontWeight:400, fontSize:16 }}>No name set</span>}
          </div>
          {form.bio.trim() && <div style={{ color:T.muted, fontSize:13, marginTop:4 }}>{form.bio}</div>}
          <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:8, flexWrap:'wrap' }}>
            <span style={{ color:T.muted, fontSize:12, fontFamily:"'DM Mono',monospace" }}>{sh(account?.address)}</span>
            <Tag color={T.pink}>Connected</Tag>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, minWidth:200 }}>
          {[
            { label:'Circles', val:circles.length },
            { label:'Saved',   val:$(totalSaved).replace('$','$') },
            { label:'Earned',  val:$(totalEarned) },
          ].map((s,i) => (
            <div key={i} style={{ background:T.surface, borderRadius:8, padding:'10px 12px', textAlign:'center', border:`1px solid ${T.border}` }}>
              <div style={{ fontFamily:"'Sora',sans-serif", fontSize:16, fontWeight:700, color:T.pink }}>{s.val}</div>
              <div style={{ color:T.muted, fontSize:11, marginTop:3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Form ───────────────────────────────────────────────────────── */}
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:'24px', marginBottom:16 }}>
        <div style={{ fontFamily:"'Sora',sans-serif", fontSize:15, fontWeight:600, color:T.text, marginBottom:20, paddingBottom:14, borderBottom:`1px solid ${T.border}` }}>
          Personal details
        </div>

        <Field label="Display name">
          <input
            style={{ ...inputStyle, background:T.surface }}
            placeholder="e.g. Amara Okafor"
            value={form.displayName}
            onChange={set('displayName')}
            maxLength={40}
          />
          <div style={{ color:T.muted, fontSize:12, marginTop:6 }}>
            This name appears in circle rosters and payouts visible to other members.
          </div>
        </Field>

        <Field label="Bio / tagline">
          <textarea
            style={{ ...inputStyle, background:T.surface, resize:'vertical', minHeight:72 }}
            placeholder="e.g. Lagos-based developer, saving for a laptop"
            value={form.bio}
            onChange={set('bio')}
            maxLength={120}
          />
        </Field>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <Field label="Location">
            <input
              style={{ ...inputStyle, background:T.surface }}
              placeholder="e.g. Lagos, Nigeria"
              value={form.location}
              onChange={set('location')}
              maxLength={60}
            />
          </Field>
          <div>
            <label style={labelStyle}>Avatar color</label>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:4 }}>
              {AVATAR_COLORS.map(color => (
                <button key={color} onClick={() => setForm(f => ({ ...f, avatarColor: color }))}
                  style={{ width:28, height:28, borderRadius:'50%', background:color, border:`2.5px solid ${form.avatarColor === color ? '#fff' : 'transparent'}`, cursor:'pointer', transition:'transform .1s', boxShadow: form.avatarColor === color ? `0 0 0 1px ${color}` : 'none', flexShrink:0 }}
                  onMouseEnter={e => e.currentTarget.style.transform='scale(1.15)'}
                  onMouseLeave={e => e.currentTarget.style.transform='none'}
                />
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop:20, display:'flex', justifyContent:'flex-end', gap:10 }}>
          {hasChanges && (
            <button onClick={() => setForm({ ...profile })}
              style={{ padding:'10px 18px', borderRadius:8, border:`1px solid ${T.border}`, color:T.muted, fontSize:14, fontFamily:sans, background:'none', cursor:'pointer' }}>
              Discard
            </button>
          )}
          <GoldButton onClick={handleSave} disabled={!hasChanges || saving} style={{ padding:'10px 24px', fontSize:14 }}>
            {saving && <Spinner size={14} color="#fff" />}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save changes'}
          </GoldButton>
        </div>
      </div>

      {/* ── Notifications ──────────────────────────────────────────────── */}
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:'24px', marginBottom:16 }}>
        <div style={{ fontFamily:"'Sora',sans-serif", fontSize:15, fontWeight:600, color:T.text, marginBottom:18, paddingBottom:14, borderBottom:`1px solid ${T.border}` }}>
          Notifications
        </div>
        {[
          { key:'depositReminders', label:'Deposit reminders', sub:'Get notified when a deposit is due in your circles' },
          { key:'payoutAlerts',     label:'Payout alerts',     sub:'Get notified when you or a circle member receives the pot' },
        ].map(({ key, label, sub }) => (
          <div key={key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, marginBottom:16 }}>
            <div>
              <div style={{ color:T.text, fontSize:14, fontWeight:500 }}>{label}</div>
              <div style={{ color:T.muted, fontSize:13, marginTop:2 }}>{sub}</div>
            </div>
            <button onClick={() => setForm(f => ({ ...f, notifications: { ...f.notifications, [key]: !f.notifications[key] } }))}
              style={{
                width:44, height:24, borderRadius:12, flexShrink:0,
                background: form.notifications[key] ? T.pink : T.dim,
                transition:'background .2s', cursor:'pointer', position:'relative',
              }}>
              <div style={{
                width:18, height:18, borderRadius:'50%', background:'#fff',
                position:'absolute', top:3,
                left: form.notifications[key] ? 23 : 3,
                transition:'left .2s',
              }}/>
            </button>
          </div>
        ))}
      </div>

      {/* ── Appearance ──────────────────────────────────────────────────────── */}
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:'24px', marginBottom:16 }}>
        <div style={{ fontFamily:"'Sora',sans-serif", fontSize:15, fontWeight:600, color:T.text, marginBottom:18, paddingBottom:14, borderBottom:`1px solid ${T.border}` }}>
          Appearance
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:16 }}>
          <div>
            <div style={{ color:T.text, fontSize:14, fontWeight:500, marginBottom:3 }}>
              {isDark ? 'Dark mode' : 'Light mode'}
            </div>
            <div style={{ color:T.muted, fontSize:13 }}>
              {isDark ? 'Switch to a lighter look for bright environments' : 'Switch to a darker look for low-light environments'}
            </div>
          </div>
          <button onClick={toggle}
            style={{ width:52, height:28, borderRadius:14, flexShrink:0, background:isDark?T.pink:T.dim, transition:'background .2s', cursor:'pointer', position:'relative', border:'none' }}>
            <div style={{ width:22, height:22, borderRadius:'50%', background:'#fff', position:'absolute', top:3, left:isDark?27:3, transition:'left .2s', boxShadow:'0 1px 4px rgba(0,0,0,.3)' }}/>
          </button>
        </div>
      </div>

      {/* ── Wallet info ─────────────────────────────────────────────────── */}
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:'24px' }}>
        <div style={{ fontFamily:"'Sora',sans-serif", fontSize:15, fontWeight:600, color:T.text, marginBottom:18, paddingBottom:14, borderBottom:`1px solid ${T.border}` }}>
          Wallet
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {[
            { label:'Address',  val: account?.address, mono:true },
            { label:'Network',  val:'Polkadot Testnet',  mono:false },
            { label:'Contract', val:'ink! v4.3 · PSP22 USDC', mono:false },
          ].map(({ label, val, mono }) => (
            <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, padding:'10px 0', borderBottom:`1px solid ${T.border}` }}>
              <span style={{ color:T.muted, fontSize:13, flexShrink:0 }}>{label}</span>
              <span style={{ color:T.text, fontSize:13, fontFamily: mono ? "'DM Mono',monospace" : sans, textAlign:'right', wordBreak:'break-all' }}>{val}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
