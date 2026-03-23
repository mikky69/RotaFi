import React, { useState } from 'react';
import { COLORS, cls, cn } from '../theme.js';
import { useAppState } from '../hooks/useAppState.jsx';
import { useTheme } from '../hooks/useTheme.jsx';
import { Tag, GoldButton, Spinner } from '../components/ui.jsx';

const sh = a => a ? a.slice(0, 8) + '...' + a.slice(-6) : '';

const AVATAR_COLORS = [
  '#E6007A', '#7C3AED', '#2563EB', '#0891B2',
  '#059669', '#D97706', '#DC2626', '#DB2777',
];

function Field({ label, children }) {
  return (
    <div className="mb-5">
      <label className={cls.label}>{label}</label>
      {children}
    </div>
  );
}

export default function ProfilePage() {
  const { profile, updateProfile, account, displayName, circles } = useAppState();
  const { isDark, toggle } = useTheme();
  const [form, setForm] = useState({ ...profile });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
  const $ = (n, sym = '$') => sym + Number(n || 0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const mainSym = circles[0]?.tokenSymbol || 'USDC';

  return (
    <div className="px-4 py-6 max-w-[680px] mx-auto" style={{ animation: 'fadeUp .3s ease both' }}>

      {/* ── Page title ─────────────────────────────────────────────────── */}
      <div className="mb-7">
        <h1 className="font-sora text-[22px] font-bold text-ink mb-1">Profile</h1>
        <p className="text-muted text-sm">Your identity on RotaFi — visible to other circle members</p>
      </div>

      {/* ── Avatar + stats ─────────────────────────────────────────────── */}
      <div className={cn(cls.card, "p-6 mb-5 flex items-center gap-5 flex-wrap")}>
        <div className="relative">
          <div className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-[26px] font-bold font-sora text-white shrink-0"
            style={{ background: form.avatarColor, boxShadow: `0 0 0 3px var(--card), 0 0 0 5px ${form.avatarColor}40` }}>
            {initials}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-ok border-2 border-card flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
        </div>
        <div className="flex-1 min-w-[180px]">
          <div className="font-sora text-lg font-bold text-ink">
            {form.displayName.trim() || <span className="text-muted italic font-normal text-base">No name set</span>}
          </div>
          {form.bio.trim() && <div className="text-muted text-[13px] mt-1">{form.bio}</div>}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-muted text-xs font-mono">{sh(account?.address)}</span>
            <Tag color={COLORS.pink}>Connected</Tag>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2.5 min-w-[200px]">
          {[
            { label: 'Circles', val: circles.length },
            { label: 'Saved',   val: $(totalSaved, '') + ' ' + mainSym },
            { label: 'Earned',  val: $(totalEarned, '') + ' ' + mainSym },
          ].map((s, i) => (
            <div key={i} className="bg-surface border border-border rounded-lg p-2.5 text-center">
              <div className="font-sora text-base font-bold text-pink">{s.val}</div>
              <div className="text-muted text-[11px] mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Form ───────────────────────────────────────────────────────── */}
      <div className={cn(cls.card, "p-6 mb-4")}>
        <div className="font-sora text-[15px] font-semibold text-ink border-b border-border pb-3.5 mb-5">
          Personal details
        </div>

        <Field label="Display name">
          <input className={cn(cls.input, "bg-surface")} placeholder="e.g. Amara Okafor"
            value={form.displayName} onChange={set('displayName')} maxLength={40} />
          <div className="text-muted text-xs mt-1.5">
            This name appears in circle rosters and payouts visible to other members.
          </div>
        </Field>

        <Field label="Bio / tagline">
          <textarea className={cn(cls.input, "bg-surface resize-y min-h-[72px]")}
            placeholder="e.g. Lagos-based developer, saving for a laptop"
            value={form.bio} onChange={set('bio')} maxLength={120} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Location">
            <input className={cn(cls.input, "bg-surface")} placeholder="e.g. Lagos, Nigeria"
              value={form.location} onChange={set('location')} maxLength={60} />
          </Field>
          <div>
            <label className={cls.label}>Avatar color</label>
            <div className="flex gap-2 flex-wrap mt-1">
              {AVATAR_COLORS.map(color => (
                <button key={color}
                  onClick={() => setForm(f => ({ ...f, avatarColor: color }))}
                  className="w-7 h-7 rounded-full cursor-pointer shrink-0 border-none transition-transform hover:scale-110"
                  style={{
                    background:  color,
                    border:      `2.5px solid ${form.avatarColor === color ? '#fff' : 'transparent'}`,
                    boxShadow:   form.avatarColor === color ? `0 0 0 1px ${color}` : 'none',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2.5">
          {hasChanges && (
            <button onClick={() => setForm({ ...profile })}
              className="px-4 py-2.5 rounded-lg border border-border text-muted text-sm bg-transparent cursor-pointer hover:bg-card transition-colors">
              Discard
            </button>
          )}
          <GoldButton onClick={handleSave} disabled={!hasChanges || saving} style={{ padding: '10px 24px', fontSize: 14 }}>
            {saving && <Spinner size={14} color="#fff" />}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save changes'}
          </GoldButton>
        </div>
      </div>

      {/* ── Notifications ──────────────────────────────────────────────── */}
      <div className={cn(cls.card, "p-6 mb-4")}>
        <div className="font-sora text-[15px] font-semibold text-ink border-b border-border pb-3.5 mb-5">
          Notifications
        </div>
        {[
          { key: 'depositReminders', label: 'Deposit reminders', sub: 'Get notified when a deposit is due in your circles' },
          { key: 'payoutAlerts',     label: 'Payout alerts',     sub: 'Get notified when you or a circle member receives the pot' },
        ].map(({ key, label, sub }) => (
          <div key={key} className="flex items-center justify-between gap-4 mb-4 last:mb-0">
            <div>
              <div className="text-ink text-sm font-medium">{label}</div>
              <div className="text-muted text-[13px] mt-0.5">{sub}</div>
            </div>
            <button
              onClick={() => setForm(f => ({ ...f, notifications: { ...f.notifications, [key]: !f.notifications[key] } }))}
              className="w-11 h-6 rounded-full relative shrink-0 cursor-pointer border-none transition-colors"
              style={{ background: form.notifications[key] ? COLORS.pink : 'var(--dim)' }}>
              <div className="w-[18px] h-[18px] rounded-full bg-white absolute top-[3px] transition-all"
                style={{ left: form.notifications[key] ? 23 : 3 }} />
            </button>
          </div>
        ))}
      </div>

      {/* ── Appearance ──────────────────────────────────────────────────────── */}
      <div className={cn(cls.card, "p-6 mb-4")}>
        <div className="font-sora text-[15px] font-semibold text-ink border-b border-border pb-3.5 mb-5">
          Appearance
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-ink text-sm font-medium mb-1">
              {isDark ? 'Dark mode' : 'Light mode'}
            </div>
            <div className="text-muted text-[13px]">
              {isDark ? 'Switch to a lighter look for bright environments' : 'Switch to a darker look for low-light environments'}
            </div>
          </div>
          <button onClick={toggle}
            className="w-[52px] h-7 rounded-full relative shrink-0 cursor-pointer border-none transition-colors"
            style={{ background: isDark ? COLORS.pink : 'var(--dim)' }}>
            <div className="w-[22px] h-[22px] rounded-full bg-white absolute top-[3px] shadow-md transition-all"
              style={{ left: isDark ? 27 : 3 }} />
          </button>
        </div>
      </div>

      {/* ── Wallet info ─────────────────────────────────────────────────── */}
      <div className={cn(cls.card, "p-6")}>
        <div className="font-sora text-[15px] font-semibold text-ink border-b border-border pb-3.5 mb-5">
          Wallet
        </div>
        <div className="flex flex-col gap-0">
          {[
            { label: 'Address',  val: account?.address,                     mono: true  },
            { label: 'Network',  val: 'Polkadot Testnet (Hub EVM)',          mono: false },
            { label: 'Contract', val: 'Solidity EVM · Multi-token savings',  mono: false },
          ].map(({ label, val, mono }) => (
            <div key={label} className="flex justify-between items-center gap-3 py-2.5 border-b border-border last:border-0">
              <span className="text-muted text-[13px] shrink-0">{label}</span>
              <span className={cn('text-ink text-[13px] text-right break-all', mono && 'font-mono')}>{val}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
