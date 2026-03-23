import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { cn } from '../theme.js';
import { useAppState } from '../hooks/useAppState.jsx';
import { useTheme } from '../hooks/useTheme.jsx';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const NAV = [
  { path: '/app',         exact: true,  label: 'Overview',   icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
  { path: '/app/circles', exact: false, label: 'My Circles', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2|M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8' },
  { path: '/app/join',    exact: false, label: 'Join',        icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2|M12 3a4 4 0 0 1 0 8|M19 8v6M22 11h-6' },
  { path: '/app/history', exact: false, label: 'History',     icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z|M14 2v6h6|M16 13H8|M16 17H8|M10 9H8' },
  { path: '/app/profile', exact: false, label: 'Profile',     icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2|M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8' },
];

function Ico({ d, size = 18, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      className={cn('shrink-0', className)}>
      {d.split('|').map((p, i) => <path key={i} d={p} />)}
    </svg>
  );
}

function useBreakpoint() {
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return { isMobile: w < 640, isTablet: w >= 640 && w < 1024 };
}

const SUN  = 'M12 4.354a4 4 0 1 1 0 15.292M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41';
const MOON = 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z';

function ThemeToggle({ collapsed }) {
  const { isDark, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className={cn(
        'w-full flex items-center gap-2 rounded-lg text-muted text-sm cursor-pointer',
        'border border-transparent hover:border-border hover:bg-card hover:text-ink',
        'transition-all mb-1.5',
        collapsed ? 'justify-center px-2 py-2' : 'px-3 py-2'
      )}
    >
      <Ico d={isDark ? SUN : MOON} size={15} />
      {!collapsed && (isDark ? 'Light mode' : 'Dark mode')}
    </button>
  );
}

function ThemeToggleIcon() {
  const { isDark, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="w-[34px] h-[34px] rounded-lg border border-border bg-card text-muted flex items-center justify-center cursor-pointer hover:text-ink transition-colors shrink-0"
    >
      <Ico d={isDark ? SUN : MOON} size={16} />
    </button>
  );
}

function SidebarItem({ item, collapsed }) {
  const location  = useLocation();
  const isActive  = item.exact
    ? location.pathname === item.path
    : location.pathname.startsWith(item.path);

  return (
    <Link
      to={item.path}
      title={collapsed ? item.label : undefined}
      className={cn(
        'flex items-center gap-2.5 rounded-lg text-sm transition-all overflow-hidden whitespace-nowrap',
        collapsed ? 'justify-center px-2.5 py-2' : 'px-3 py-2.5',
        isActive
          ? 'text-pink font-medium'
          : 'text-muted hover:bg-card hover:text-ink'
      )}
      style={isActive ? { background: 'var(--pink-dim)', borderColor: 'var(--pink-d)50' } : undefined}
    >
      <span className="shrink-0"><Ico d={item.icon} size={16} /></span>
      {!collapsed && <span className="flex-1">{item.label}</span>}
      {!collapsed && isActive && (
        <div className="w-1.5 h-1.5 rounded-full bg-pink shrink-0" />
      )}
    </Link>
  );
}

function BottomBar() {
  const location = useLocation();
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[200] bg-sidebar border-t border-border flex h-[60px]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {NAV.map(item => {
        const isActive = item.exact
          ? location.pathname === item.path
          : location.pathname.startsWith(item.path);
        return (
          <Link
            key={item.path} to={item.path}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-1 transition-all',
              'border-t-2',
              isActive
                ? 'text-pink border-pink'
                : 'text-muted border-transparent hover:text-ink'
            )}
            style={isActive ? { background: 'var(--pink-dim)' } : undefined}
          >
            <Ico d={item.icon} size={20} />
            <span className={cn('text-[10px] tracking-tight', isActive ? 'font-semibold' : 'font-normal')}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

function CustomConnect({ collapsed }) {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        const ready     = mounted;
        const connected = ready && account && chain;
        if (!ready) return null;

        if (!connected) {
          return (
            <button
              onClick={openConnectModal} type="button"
              className={cn(
                'w-full flex items-center justify-center gap-1.5 rounded-lg',
                'bg-pink text-white text-sm font-semibold cursor-pointer hover:bg-pink-l transition-colors',
                collapsed ? 'px-2 py-2' : 'px-3 py-2.5'
              )}
            >
              {collapsed
                ? <Ico d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z|M12 9v4|M12 17h.01" size={16} />
                : 'Connect'}
            </button>
          );
        }

        if (chain.unsupported) {
          return (
            <button
              onClick={openChainModal} type="button"
              className={cn(
                'w-full flex items-center justify-center gap-1.5 rounded-lg',
                'border border-err bg-err-bg text-err text-sm font-semibold cursor-pointer',
                collapsed ? 'px-2 py-2' : 'px-3 py-2.5'
              )}
            >
              {collapsed
                ? <Ico d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" size={16} />
                : 'Wrong network'}
            </button>
          );
        }

        return (
          <div className={cn('flex gap-1.5 w-full', collapsed ? 'flex-col' : 'flex-row')}>
            <button
              onClick={openChainModal}
              title={chain.name}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg bg-card border border-border cursor-pointer hover:border-border-h transition-colors"
            >
              {chain.hasIcon && (
                <div className="w-4 h-4 rounded-full overflow-hidden" style={{ background: chain.iconBackground }}>
                  {chain.iconUrl && <img alt={chain.name ?? 'Chain'} src={chain.iconUrl} className="w-4 h-4" />}
                </div>
              )}
              {!collapsed && <span className="text-ink text-[13px] font-medium font-sans">{chain.name}</span>}
            </button>

            <button
              onClick={openAccountModal} type="button"
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-surface border border-border cursor-pointer hover:border-border-h transition-colors"
            >
              <div className="w-[22px] h-[22px] rounded-full flex items-center justify-center overflow-hidden border border-pink"
                style={{ background: 'var(--pink-dim)' }}>
                {account.ensAvatar
                  ? <img src={account.ensAvatar} alt="ENS" className="w-5 h-5" />
                  : <span className="text-[10px] font-bold text-pink">{account.displayName.slice(0, 2)}</span>}
              </div>
              {!collapsed && (
                <span className="text-ink text-[13px] font-semibold font-sans">{account.displayName}</span>
              )}
            </button>
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}

function MobileTopBar() {
  return (
    <header className="sticky top-0 z-[100] bg-sidebar border-b border-border h-[52px] flex items-center justify-between px-4 gap-2.5">
      <Link to="/" className="flex items-center gap-2 shrink-0">
        <img src="/rotafi_logo.svg" alt="" width={26} height={26} />
        <span className="font-sora text-base font-bold text-ink">RotaFi</span>
      </Link>
      <div className="flex items-center gap-2">
        <ThemeToggleIcon />
        <CustomConnect collapsed={true} />
      </div>
    </header>
  );
}

export default function AppShell({ children }) {
  const { isMobile, isTablet } = useBreakpoint();
  const collapsed = isTablet;

  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen bg-bg">
        <MobileTopBar />
        <main className="flex-1 overflow-y-auto pb-[70px]">{children}</main>
        <BottomBar />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      <aside className={cn(
        'flex flex-col h-full bg-sidebar border-r border-border shrink-0 overflow-hidden transition-[width] duration-200',
        collapsed ? 'w-[58px]' : 'w-[228px]'
      )}>
        {/* Logo */}
        <Link
          to="/"
          title="Return to home"
          className={cn(
            'flex items-center gap-2.5 border-b border-border overflow-hidden',
            'hover:bg-card transition-colors shrink-0',
            collapsed ? 'justify-center px-2.5 py-4' : 'px-3.5 py-4'
          )}
        >
          <img src="/rotafi_logo.svg" alt="" width={collapsed ? 30 : 64} height={collapsed ? 30 : 64} className="shrink-0" />
          {!collapsed && (
            <div>
              <div className="font-sora text-[15px] font-bold text-ink leading-none">RotaFi</div>
              <div className="text-[10px] text-pink font-semibold tracking-widest mt-0.5">POLKADOT</div>
            </div>
          )}
        </Link>

        {/* Nav */}
        <nav className={cn('flex-1 overflow-y-auto flex flex-col gap-0.5', collapsed ? 'p-1.5' : 'p-2')}>
          {!collapsed && (
            <div className="text-muted text-[10px] font-semibold uppercase tracking-widest px-3 py-1.5">App</div>
          )}
          {NAV.map(item => <SidebarItem key={item.path} item={item} collapsed={collapsed} />)}
        </nav>

        {/* Footer */}
        <div className={cn('border-t border-border shrink-0', collapsed ? 'p-1.5' : 'p-2')}>
          <ThemeToggle collapsed={collapsed} />
          <CustomConnect collapsed={collapsed} />
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto h-full">{children}</main>
    </div>
  );
}
