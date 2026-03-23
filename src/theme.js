// SVG colours (CSS variable references)
export const COLORS = {
  pink:     'var(--pink)',
  pinkL:    'var(--pink-l)',
  pinkD:    'var(--pink-d)',
  ok:       'var(--ok)',
  okBg:     'var(--ok-bg)',
  okBdr:    'var(--ok-bdr)',
  err:      'var(--err)',
  errBg:    'var(--err-bg)',
  errBdr:   'var(--err-bdr)',
  warn:     'var(--warn)',
  warnBg:   'var(--warn-bg)',
  warnBdr:  'var(--warn-bdr)',
  text:     'var(--text)',
  muted:    'var(--muted)',
  dim:      'var(--dim)',
  border:   'var(--border)',
  card:     'var(--card)',
  surface:  'var(--surface)',
};

// Shared Tailwind class strings 
export const cls = {
  card: 'bg-card border border-border rounded-xl',

  input: [
    'w-full px-3.5 py-2.5',
    'rounded-lg border border-border',
    'bg-input text-ink text-sm',
    'outline-none transition-colors',
    'focus:border-pink-d',
  ].join(' '),

  label: 'block text-muted text-xs font-medium uppercase tracking-widest mb-1.5',

  btnPink: [
    'inline-flex items-center justify-center gap-2',
    'rounded-lg bg-pink text-white font-semibold',
    'cursor-pointer transition-colors',
    'hover:bg-pink-l',
    'disabled:opacity-60 disabled:cursor-not-allowed',
  ].join(' '),

  btnGhost: [
    'inline-flex items-center justify-center gap-2',
    'rounded-lg bg-transparent text-muted font-medium',
    'border border-border',
    'cursor-pointer transition-colors',
    'hover:bg-card hover:text-ink',
    'disabled:opacity-60 disabled:cursor-not-allowed',
  ].join(' '),
};

// Class name merge helper
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
