/**
 * theme.js
 *
 * All color values are CSS custom properties.
 * Actual hex values live in global.css under [data-theme="dark"] and [data-theme="light"].
 * Switching theme = toggling the data-theme attribute on <html>.
 * No component re-renders needed.
 */

export const T = {
  bg:        'var(--bg)',
  surface:   'var(--surface)',
  card:      'var(--card)',
  cardH:     'var(--card-h)',
  sidebar:   'var(--sidebar)',

  border:    'var(--border)',
  borderH:   'var(--border-h)',

  pink:      'var(--pink)',
  pinkL:     'var(--pink-l)',
  pinkD:     'var(--pink-d)',
  pinkDim:   'var(--pink-dim)',
  pinkGlow:  'var(--pink-glow)',

  text:      'var(--text)',
  muted:     'var(--muted)',
  dim:       'var(--dim)',

  ok:        'var(--ok)',
  okBg:      'var(--ok-bg)',
  okBdr:     'var(--ok-bdr)',

  err:       'var(--err)',
  errBg:     'var(--err-bg)',
  errBdr:    'var(--err-bdr)',

  warn:      'var(--warn)',
  warnBg:    'var(--warn-bg)',
  warnBdr:   'var(--warn-bdr)',

  purple:    'var(--purple)',
  purpleDim: 'var(--purple-dim)',

  transparent: 'transparent'
};

export const serif = "'Sora', 'DM Sans', sans-serif";
export const sans  = "'DM Sans', 'Inter', sans-serif";

// inputStyle and labelStyle use CSS vars too
export const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  background: 'var(--input-bg)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  color: 'var(--text)',
  fontSize: 14,
  outline: 'none',
  transition: 'border-color .15s, background .2s',
  fontFamily: "'DM Sans', sans-serif",
};

export const labelStyle = {
  display: 'block',
  color: 'var(--muted)',
  fontSize: 12,
  fontWeight: 500,
  marginBottom: 6,
  letterSpacing: '.04em',
  textTransform: 'uppercase',
};
