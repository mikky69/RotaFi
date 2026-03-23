import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { COLORS, cls, cn } from '../theme.js';
import { useTheme } from '../hooks/useTheme.jsx';

const SUN =
	'M12 4.354a4 4 0 1 1 0 15.292M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41';
const MOON = 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z';

function ThemeIco({ d }) {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.8"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			{d
				.split('M')
				.filter(Boolean)
				.map((seg, i) => (
					<path key={i} d={'M' + seg} />
				))}
		</svg>
	);
}

export default function LandingPage() {
	const { isDark, toggle } = useTheme();

	return (
		<div className="min-h-screen bg-bg font-sans overflow-x-hidden">
			{/* ── Nav ────────────────────────────────────────────────────────── */}
			<nav
				className="fixed top-0 left-0 right-0 z-[100] h-[60px] flex items-center justify-between border-b border-border backdrop-blur-md px-4 sm:px-8 lg:px-12"
				style={{ background: isDark ? 'rgba(13,13,15,.88)' : 'rgba(244,244,246,.88)' }}
			>
				<div className="flex items-center gap-2.5">
					<img
						src="/rotafi_logo.svg"
						alt=""
						width={28}
						height={28}
						className="shrink-0"
					/>
					<span className="font-sora text-[17px] font-bold text-ink tracking-tight">
						RotaFi
					</span>
					<span
						className="text-[10px] font-semibold text-pink px-1.5 py-0.5 tracking-widest"
						style={{ background: 'var(--pink-dim)', borderColor: 'var(--pink-d)60' }}
					>
						POLKADOT
					</span>
				</div>
				<div className="flex items-center gap-2.5">
					<button
						onClick={toggle}
						aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
						className="w-[34px] h-[34px] rounded-lg border border-border bg-transparent text-muted flex items-center justify-center cursor-pointer hover:bg-card hover:text-ink transition-all shrink-0"
					>
						<ThemeIco d={isDark ? SUN : MOON} />
					</button>
					<ConnectButton.Custom>
						{({ openConnectModal, mounted }) =>
							mounted && (
								<button
									onClick={openConnectModal}
									className={cn(cls.btnPink, 'px-4 py-2 text-[13px] shrink-0')}
								>
									Launch App
								</button>
							)
						}
					</ConnectButton.Custom>
				</div>
			</nav>

			{/* ── Hero ──────────────────────────────────────────────────────── */}
			<section className="relative overflow-hidden pt-36 pb-24 px-6 text-center">
				<div
					className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-96 rounded-full pointer-events-none blur-3xl"
					style={{
						background: `radial-gradient(ellipse at center, var(--pink-glow) 0%, transparent 70%)`,
					}}
				/>
				<div
					className="absolute inset-0 opacity-25 pointer-events-none"
					style={{
						backgroundImage: `linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px)`,
						backgroundSize: '40px 40px',
					}}
				/>

				<div
					className="relative z-10 max-w-3xl mx-auto"
					style={{ animation: 'fadeUp .5s ease both' }}
				>
					<div
						className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 mb-8"
						style={{ background: 'var(--pink-dim)', borderColor: 'var(--pink-d)60' }}
					>
						<div
							className="w-1.5 h-1.5 rounded-full bg-pink"
							style={{ animation: 'pulseDot 2s infinite' }}
						/>
						<span className="text-pink text-xs font-semibold tracking-widest">
							LIVE ON POLKADOT
						</span>
					</div>

					<h1
						className="font-sora font-bold text-ink leading-[1.07] tracking-tight mb-5"
						style={{ fontSize: 'clamp(36px,8vw,64px)' }}
					>
						Savings circles,
						<br />
						<span className="text-pink">trustless</span> and
						<br />
						on-chain.
					</h1>

					<p
						className="text-muted leading-relaxed max-w-[540px] mx-auto mb-10 font-light"
						style={{ fontSize: 'clamp(15px,2.5vw,18px)' }}
					>
						RotaFi brings the Ajo, Esusu, and Chit fund tradition to Polkadot. Groups
						pool USDC together each cycle. A smart contract guarantees every member
						receives the pot, no middleman required.
					</p>

					<ConnectButton.Custom>
						{({ openConnectModal, mounted }) =>
							mounted && (
								<button
									onClick={openConnectModal}
									className={cn(
										cls.btnPink,
										'px-8 py-3.5 text-[15px] rounded-xl shadow-lg',
									)}
									style={{ boxShadow: `0 0 40px var(--pink-glow)` }}
								>
									<svg
										width="17"
										height="17"
										viewBox="0 0 24 24"
										fill="none"
										stroke="white"
										strokeWidth="2.5"
									>
										<rect x="2" y="5" width="20" height="14" rx="2" />
										<path d="M2 10h20" />
									</svg>
									Connect Wallet &amp; Launch
								</button>
							)
						}
					</ConnectButton.Custom>
				</div>
			</section>

			{/* ── CTA strip ─────────────────────────────────────────────────── */}
			<section className="px-4 sm:px-8 pb-20">
				<div
					className="max-w-[860px] mx-auto rounded-2xl text-center relative overflow-hidden px-6 py-12 sm:px-12 sm:py-14"
					style={{
						background: `linear-gradient(135deg, var(--pink-d)30 0%, var(--purple)20 100%)`,
						borderColor: 'var(--pink-d)50',
					}}
				>
					<div
						className="absolute -top-16 -right-16 w-52 h-52 rounded-full pointer-events-none blur-2xl"
						style={{ background: `radial-gradient(var(--pink-glow), transparent 70%)` }}
					/>
					<h2
						className="relative font-sora font-bold text-ink tracking-tight mb-3"
						style={{ fontSize: 'clamp(22px,4vw,34px)' }}
					>
						Ready to start saving with your circle?
					</h2>
					<p
						className="relative text-muted mb-8"
						style={{ fontSize: 'clamp(13px,2vw,15px)' }}
					>
						Connect your Polkadot wallet to create a new circle or join an existing one.
					</p>
					<ConnectButton.Custom>
						{({ openConnectModal, mounted }) =>
							mounted && (
								<button
									onClick={openConnectModal}
									className={cn(
										cls.btnPink,
										'relative px-8 py-3.5 text-[15px] rounded-xl',
									)}
								>
									Get started
								</button>
							)
						}
					</ConnectButton.Custom>
				</div>
			</section>

			{/* ── Footer ─────────────────────────────────────────────────────── */}
			<footer className="border-t border-border px-4 sm:px-8 py-5 flex items-center justify-between flex-wrap gap-3">
				<div className="flex items-center gap-2">
					<div className="w-5 h-5 rounded-[5px] bg-pink flex items-center justify-center shrink-0">
						<svg
							width="10"
							height="10"
							viewBox="0 0 24 24"
							fill="none"
							stroke="white"
							strokeWidth="2.5"
						>
							<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
							<circle cx="9" cy="7" r="4" />
						</svg>
					</div>
					<span className="text-muted text-[13px] font-sora font-semibold">RotaFi</span>
				</div>
				<span className="text-dim text-xs">
					Built on Polkadot EVM · Solidity smart contracts · ERC20 USDC
				</span>
			</footer>
		</div>
	);
}
