import React, { useEffect } from 'react';
import { COLORS, cls, cn } from '../theme.js';

export function Spinner({ size = 15, color }) {
  return (
    <div
      className="rounded-full border-2 shrink-0"
      style={{
        width: size,
        height: size,
        borderColor: (color || 'currentColor') + '40',
        borderTopColor: color || 'currentColor',
        animation: 'spin 0.65s linear infinite',
      }}
    />
  );
}

export function Ring({ pct = 0, size = 80, strokeWidth = 5, color }) {
  const r    = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * Math.min(Math.max(pct, 0), 1);
  return (
    <svg
      width={size} height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="shrink-0 -rotate-90"
    >
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={COLORS.border} strokeWidth={strokeWidth} />
      <circle
        cx={size/2} cy={size/2} r={r}
        fill="none"
        stroke={color || COLORS.pink}
        strokeWidth={strokeWidth}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray .5s ease' }}
      />
    </svg>
  );
}

export function Toast({ message, type = 'success', onClose }) {
  const ok = type === 'success';
  useEffect(() => { const t = setTimeout(onClose, 4500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-[9999]',
        'flex items-center gap-3 max-w-sm px-4 py-3 rounded-xl border shadow-2xl',
        cn(cls.card, ok ? 'border-ok-bdr' : 'border-err-bdr')
      )}
      style={{ animation: 'fadeIn .2s ease' }}
    >
      <div
        className={cn('w-2 h-2 rounded-full shrink-0', ok ? 'bg-ok' : 'bg-err')}
        style={{ animation: 'pulseDot 2s infinite' }}
      />
      <span className="flex-1 text-ink text-sm">{message}</span>
      <button onClick={onClose} className="text-muted text-lg leading-none cursor-pointer hover:text-ink transition-colors">
        &#x2715;
      </button>
    </div>
  );
}

export function Metric({ label, value, accent, sub }) {
  return (
    <div className={cn(cls.card, 'p-4 sm:p-5')}>
      <div className="text-muted text-[11px] font-medium uppercase tracking-widest mb-2">{label}</div>
      <div
        className="font-sora text-2xl font-semibold leading-tight"
        style={{ color: accent || 'var(--text)' }}
      >
        {value}
      </div>
      {sub && <div className="text-muted text-xs mt-1.5">{sub}</div>}
    </div>
  );
}

export function GoldButton({ children, onClick, disabled, style: extra, variant = 'pink', className: extra_cls }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        variant === 'pink' ? cls.btnPink : cls.btnGhost,
        'px-5 py-2.5 text-sm',   /* default sizing — overridable via style prop */
        extra_cls
      )}
      style={extra}
    >
      {children}
    </button>
  );
}

export function Avatar({ name = '?', size = 32, active = false }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold shrink-0',
        active ? 'text-pink border-[1.5px] border-pink' : 'text-muted border-[1.5px] border-border'
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.33,
        background: active ? 'var(--pink-dim)' : 'var(--card)',
      }}
    >
      {initials}
    </div>
  );
}

export function Tag({ children, color }) {
  const c = color || COLORS.pink;
  return (
    <span
      className="inline-flex items-center text-[11px] font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap"
      style={{ background: c + '18', color: c, border: `1px solid ${c}30` }}
    >
      {children}
    </span>
  );
}

export function StatusDot({ active }) {
  return (
    <div
      className={cn('w-[7px] h-[7px] rounded-full shrink-0', active ? 'bg-ok' : 'bg-muted')}
      style={active ? { boxShadow: '0 0 6px var(--ok)' } : undefined}
    />
  );
}

export function Empty({ message, cta }) {
  return (
    <div className={cn(cls.card, 'py-12 px-6 text-center')}>
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
        style={{ background: 'var(--pink-dim)' }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={COLORS.pink} strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
        </svg>
      </div>
      <p className="text-muted text-sm leading-relaxed" style={{ marginBottom: cta ? 20 : 0 }}>{message}</p>
      {cta}
    </div>
  );
}

export function Badge({ label, color, bg, border }) {
  return (
    <span
      className="text-[11px] font-medium px-2 py-0.5 rounded whitespace-nowrap shrink-0"
      style={{ background: bg, color, border: `1px solid ${border || color + '40'}`, letterSpacing: '.03em' }}
    >
      {label}
    </span>
  );
}
