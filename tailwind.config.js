/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  // We use CSS custom properties for theming (data-theme attribute).
  // Dark-mode Tailwind classes (dark:) are not needed — the CSS vars switch automatically.
  darkMode: 'class',
  theme: {
    extend: {
      // ── Colour tokens — all reference CSS custom properties ──────────────
      // This means every bg-*, text-*, border-* class automatically responds
      // to dark/light theme without any dark: prefix in JSX.
      colors: {
        // Surfaces
        bg:       'var(--bg)',
        surface:  'var(--surface)',
        card:     'var(--card)',
        'card-h': 'var(--card-h)',
        sidebar:  'var(--sidebar)',
        input:    'var(--input-bg)',

        // Borders
        border:     'var(--border)',
        'border-h': 'var(--border-h)',

        // Polkadot pink
        pink:       'var(--pink)',
        'pink-l':   'var(--pink-l)',
        'pink-d':   'var(--pink-d)',

        // Text
        ink:    'var(--text)',
        muted:  'var(--muted)',
        dim:    'var(--dim)',

        // Semantic status colours
        ok:         'var(--ok)',
        'ok-bg':    'var(--ok-bg)',
        'ok-bdr':   'var(--ok-bdr)',
        err:        'var(--err)',
        'err-bg':   'var(--err-bg)',
        'err-bdr':  'var(--err-bdr)',
        warn:       'var(--warn)',
        'warn-bg':  'var(--warn-bg)',
        'warn-bdr': 'var(--warn-bdr)',
        purple:     'var(--purple)',
      },

      // ── Typography ────────────────────────────────────────────────────────
      fontFamily: {
        sora: ['Sora', 'DM Sans', 'sans-serif'],
        sans: ['DM Sans', 'Inter', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },

      // ── Animations ────────────────────────────────────────────────────────
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to:   { opacity: '1', transform: 'none' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'none' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%':      { opacity: '.5', transform: 'scale(.8)' },
        },
        spin: {
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-up':   'fadeUp 0.3s ease both',
        'fade-in':   'fadeIn 0.2s ease both',
        'slide-up':  'slideUp 0.18s ease both',
        'pulse-dot': 'pulseDot 2s infinite',
        'spin-fast': 'spin 0.65s linear infinite',
      },
    },
  },
  plugins: [],
};
