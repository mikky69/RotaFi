/**
 * AppShell.jsx
 * Desktop  : fixed 228px sidebar
 * Tablet   : icon-only 58px sidebar
 * Mobile   : sticky top bar + fixed bottom tab bar
 *
 * Dark/light toggle appears in sidebar footer (desktop/tablet)
 * and in the mobile top bar (next to the avatar).
 */
import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { T, sans } from '../theme.js';
import { useAppState } from '../hooks/useAppState.jsx';
import { useTheme } from '../hooks/useTheme.jsx';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const NAV = [
  { path: '/app', exact: true, label: 'Overview', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
  { path: '/app/circles', exact: false, label: 'My Circles', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2|M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8' },
  { path: '/app/join', exact: false, label: 'Join', icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2|M12 3a4 4 0 0 1 0 8|M19 8v6M22 11h-6' },
  { path: '/app/history', exact: false, label: 'History', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z|M14 2v6h6|M16 13H8|M16 17H8|M10 9H8' },
  { path: '/app/profile', exact: false, label: 'Profile', icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2|M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8' },
];

function Ico({ d, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {d.split('|').map((p, i) => <path key={i} d={p} />)}
    </svg>
  );
}

// ── Theme toggle button ───────────────────────────────────────────────────────
function ThemeToggle({ collapsed }) {
  const { isDark, toggle } = useTheme();
  const [hov, setHov] = useState(false);

  const sunPath = 'M12 4.354a4 4 0 1 1 0 15.292M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41';
  const moonPath = 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z';
  const label = isDark ? 'Light mode' : 'Dark mode';

  return (
    <button
      onClick={toggle}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={label}
      aria-label={label}
      style={{
        width: '100%',
        padding: collapsed ? '9px 0' : '8px 12px',
        borderRadius: 7,
        border: `1px solid ${hov ? T.borderH : T.border}`,
        color: hov ? T.text : T.muted,
        background: hov ? T.card : 'transparent',
        fontSize: 13, fontFamily: sans, cursor: 'pointer',
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: collapsed ? 0 : 8,
        transition: 'all .15s',
        marginBottom: 6,
      }}
    >
      <Ico d={isDark ? sunPath : moonPath} size={15} />
      {!collapsed && label}
    </button>
  );
}

// ── Inline toggle for mobile top bar ─────────────────────────────────────────
function ThemeToggleIcon() {
  const { isDark, toggle } = useTheme();
  const sunPath = 'M12 4.354a4 4 0 1 1 0 15.292M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41';
  const moonPath = 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z';
  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        width: 34, height: 34, borderRadius: 8,
        border: `1px solid ${T.border}`,
        background: T.card,
        color: T.muted,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', flexShrink: 0,
      }}
    >
      <Ico d={isDark ? sunPath : moonPath} size={16} />
    </button>
  );
}

// ── Breakpoint hook ───────────────────────────────────────────────────────────
function useBreakpoint() {
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return { isMobile: w < 640, isTablet: w >= 640 && w < 1024 };
}

// ── Sidebar nav item ──────────────────────────────────────────────────────────
function SidebarItem({ item, collapsed }) {
  const location = useLocation();
  const [hov, setHov] = useState(false);
  const isActive = item.exact
    ? location.pathname === item.path
    : location.pathname.startsWith(item.path);

  return (
    <Link to={item.path}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={collapsed ? item.label : undefined}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none',
        padding: collapsed ? '9px 10px' : '9px 12px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderRadius: 8,
        background: isActive ? T.pinkDim : hov ? T.card : 'transparent',
        color: isActive ? T.pink : hov ? T.text : T.muted,
        border: isActive ? `1px solid ${T.pinkD}50` : '1px solid transparent',
        transition: 'all .15s',
        fontFamily: sans, fontSize: 14, fontWeight: isActive ? 500 : 400,
        whiteSpace: 'nowrap', overflow: 'hidden',
      }}>
      <span style={{ flexShrink: 0 }}><Ico d={item.icon} size={16} /></span>
      {!collapsed && <span style={{ flex: 1 }}>{item.label}</span>}
      {!collapsed && isActive && (
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: T.pink, flexShrink: 0 }} />
      )}
    </Link>
  );
}

// ── Bottom tab bar ────────────────────────────────────────────────────────────
function BottomBar() {
  const location = useLocation();
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
      background: T.sidebar, borderTop: `1px solid ${T.border}`,
      display: 'flex', height: 60,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {NAV.map(item => {
        const isActive = item.exact
          ? location.pathname === item.path
          : location.pathname.startsWith(item.path);
        return (
          <Link key={item.path} to={item.path} style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 4,
            textDecoration: 'none',
            color: isActive ? T.pink : T.muted,
            background: isActive ? T.pinkDim : 'transparent',
            borderTop: isActive ? `2px solid ${T.pink}` : '2px solid transparent',
            transition: 'all .15s',
          }}>
            <Ico d={item.icon} size={20} />
            <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 400, letterSpacing: '.02em' }}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

// ── Custom Connect Button ─────────────────────────────────────────────────────
function CustomConnect({ collapsed }) {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        if (!ready) return null;

        if (!connected) {
          return (
            <button onClick={openConnectModal} type="button" style={{
              width: '100%', padding: collapsed ? '9px 0' : '9px 12px',
              borderRadius: 8, border: 'none', background: T.pink, color: '#fff',
              fontSize: 13, fontWeight: 600, fontFamily: sans, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'background .15s'
            }}>
              {collapsed ? <Ico d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z|M12 9v4|M12 17h.01" size={16} /> : 'Connect'}
            </button>
          );
        }

        if (chain.unsupported) {
          return (
            <button onClick={openChainModal} type="button" style={{
              width: '100%', padding: collapsed ? '9px 0' : '9px 12px',
              borderRadius: 8, border: `1px solid ${T.err}`, background: T.errBg, color: T.err,
              fontSize: 13, fontWeight: 600, fontFamily: sans, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              {collapsed ? <Ico d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" size={16} /> : 'Wrong network'}
            </button>
          );
        }

        return (
          <div style={{ display: 'flex', flexDirection: collapsed ? 'column' : 'row', gap: 6, width: '100%' }}>
            <button
              onClick={openChainModal}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: collapsed ? '8px 0' : '8px 10px', borderRadius: 8, background: T.card, border: `1px solid ${T.border}`, cursor: 'pointer', transition: 'all .15s' }}
              title={chain.name}
            >
              {chain.hasIcon && (
                <div style={{ background: chain.iconBackground, width: 16, height: 16, borderRadius: '50%', overflow: 'hidden' }}>
                  {chain.iconUrl && <img alt={chain.name ?? 'Chain icon'} src={chain.iconUrl} style={{ width: 16, height: 16 }} />}
                </div>
              )}
              {!collapsed && <span style={{ color: T.text, fontSize: 13, fontWeight: 500, fontFamily: sans }}>{chain.name}</span>}
            </button>

            <button onClick={openAccountModal} type="button" style={{
              flex: 1, padding: collapsed ? '8px 0' : '8px 12px', borderRadius: 8, background: T.surface, border: `1px solid ${T.border}`, cursor: 'pointer', transition: 'all .15s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
            }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: T.pinkDim, border: `1px solid ${T.pink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {account.ensAvatar ? <img src={account.ensAvatar} alt="ENS" style={{ width: 20, height: 20 }} /> : <span style={{ fontSize: 10, fontWeight: 700, color: T.pink }}>{account.displayName.slice(0, 2)}</span>}
              </div>
              {!collapsed && (
                <span style={{ color: T.text, fontSize: 13, fontWeight: 600, fontFamily: sans }}>
                  {account.displayName}
                </span>
              )}
            </button>
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}

// ── Mobile top bar ────────────────────────────────────────────────────────────
function MobileTopBar() {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: T.sidebar,
      borderBottom: `1px solid ${T.border}`,
      height: 52, display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', padding: '0 16px', gap: 10,
    }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: T.transparent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src="/rotafi_logo.svg" alt="" width='26px' height='26px' />
        </div>
        <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 700, color: T.text }}>RotaFi</span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <ThemeToggleIcon />
        <CustomConnect collapsed={true} />
      </div>
    </header>
  );
}

// ── AppShell ──────────────────────────────────────────────────────────────────
export default function AppShell({ children }) {
  const { isMobile, isTablet } = useBreakpoint();
  const collapsed = isTablet;

  // ── Mobile ────────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: T.bg }}>
        <MobileTopBar />
        <main style={{ flex: 1, overflowY: 'auto', paddingBottom: 70 }}>
          {children}
        </main>
        <BottomBar />
      </div>
    );
  }

  // ── Tablet / Desktop ──────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', height: '100vh', background: T.bg, overflow: 'hidden' }}>
      <aside style={{
        width: collapsed ? 58 : 228, flexShrink: 0,
        background: T.sidebar, borderRight: `1px solid ${T.border}`,
        display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden',
        transition: 'width .2s ease',
      }}>
        {/* Logo → home */}
        <Link to="/" title="Return to home" style={{
          padding: collapsed ? '16px 10px' : '16px 14px 14px',
          borderBottom: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', gap: 9,
          textDecoration: 'none', transition: 'background .15s', flexShrink: 0,
          justifyContent: collapsed ? 'center' : 'flex-start',
          overflow: 'hidden',
        }}
          onMouseEnter={e => e.currentTarget.style.background = T.card}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: T.transparent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {/* <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg> */}
            <img src="/rotafi_logo.svg" alt="" width='64px' height='64px' />
          </div>
          {!collapsed && (
            <div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 700, color: T.text, lineHeight: 1 }}>RotaFi</div>
              <div style={{ fontSize: 10, color: T.pink, fontWeight: 600, letterSpacing: '.04em', marginTop: 2 }}>POLKADOT</div>
            </div>
          )}
        </Link>

        {/* Nav */}
        <nav style={{ flex: 1, padding: collapsed ? '10px 5px' : '10px 8px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {!collapsed && (
            <div style={{ color: T.muted, fontSize: 10, fontWeight: 600, letterSpacing: '.08em', padding: '6px 12px 8px', textTransform: 'uppercase' }}>App</div>
          )}
          {NAV.map(item => <SidebarItem key={item.path} item={item} collapsed={collapsed} />)}
        </nav>

        {/* Bottom: theme toggle + wallet */}
        <div style={{ padding: collapsed ? '8px 5px' : '10px 8px', borderTop: `1px solid ${T.border}`, flexShrink: 0 }}>
          <ThemeToggle collapsed={collapsed} />
          <CustomConnect collapsed={collapsed} />
        </div>
      </aside>

      <main style={{ flex: 1, overflowY: 'auto', height: '100%' }}>
        {children}
      </main>
    </div>
  );
}
