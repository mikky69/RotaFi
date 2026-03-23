import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { COLORS, cls, cn } from '../theme.js';
import { Metric, Ring, GoldButton, Tag } from '../components/ui.jsx';

const $ = (n, sym = '$') =>
	sym +
	Number(n || 0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const sh = (a) => (a ? a.slice(0, 8) + '...' + a.slice(-4) : '');

function ActivityRow({ item }) {
	return (
		<div className="flex items-center gap-3 py-[11px] border-b border-border last:border-0">
			<div
				className={cn(
					'w-8 h-8 rounded-[9px] shrink-0 flex items-center justify-center',
					'border',
				)}
				style={{
					background: item.type === 'payout' ? COLORS.okBg : 'var(--pink-dim)',
					borderColor: item.type === 'payout' ? COLORS.okBdr : 'var(--pink-d)40',
				}}
			>
				{item.type === 'payout' ? (
					<svg
						width="13"
						height="13"
						viewBox="0 0 24 24"
						fill="none"
						stroke={COLORS.ok}
						strokeWidth="2.5"
					>
						<polyline points="20 6 9 17 4 12" />
					</svg>
				) : (
					<svg
						width="13"
						height="13"
						viewBox="0 0 24 24"
						fill="none"
						stroke={COLORS.pink}
						strokeWidth="2.5"
					>
						<path d="M12 5v14M5 12l7-7 7 7" />
					</svg>
				)}
			</div>
			<div className="flex-1 min-w-0">
				<div className="text-ink text-[13px] font-medium truncate">{item.label}</div>
				<div className="text-muted text-xs">{item.date}</div>
			</div>
			<div className="text-right shrink-0">
				<div
					className="text-sm font-semibold font-sora"
					style={{ color: item.type === 'payout' ? COLORS.ok : 'var(--text)' }}
				>
					{item.amount} <span className="text-[10px] font-normal">{item.symbol}</span>
				</div>
			</div>
		</div>
	);
}

function MiniCircleCard({ circle }) {
	const pct = circle.totalRounds > 0 ? circle.currentRound / circle.totalRounds : 0;
	return (
		<Link to={`/app/circle/${circle.id}`} className="block">
			<div
				className={cn(cls.card, 'p-[14px] cursor-pointer transition-all')}
				style={{ borderColor: !circle.hasPaid ? COLORS.errBdr : undefined }}
				onMouseEnter={(e) => {
					e.currentTarget.style.background = 'var(--card-h)';
					e.currentTarget.style.borderColor = !circle.hasPaid ? COLORS.err : 'var(--border-h)';
				}}
				onMouseLeave={(e) => {
					e.currentTarget.style.background = 'var(--card)';
					e.currentTarget.style.borderColor = !circle.hasPaid
						? COLORS.errBdr
						: 'var(--border)';
				}}
			>
				<div className="flex items-center gap-3 mb-2.5">
					<div className="relative shrink-0">
						<Ring pct={pct} size={42} strokeWidth={3} />
						<div className="absolute inset-0 flex items-center justify-center">
							<span className="text-[10px] font-bold text-ink">
								{circle.currentRound}
							</span>
						</div>
					</div>
					<div className="flex-1 min-w-0">
						<div className="text-[13px] font-medium text-ink truncate">
							{circle.name}
						</div>
						<div className="text-[11px] text-muted">
							Round {circle.currentRound}/{circle.totalRounds}
						</div>
					</div>
					{!circle.hasPaid && <Tag color={COLORS.err}>Due</Tag>}
				</div>
				<div className="font-sora text-xl font-bold text-pink">
					{$(circle.pot, '')}{' '}
					<span className="text-xs font-normal text-muted">
						{circle.tokenSymbol || 'USDC'} pot
					</span>
				</div>
			</div>
		</Link>
	);
}

export default function OverviewPage({ account, circles }) {
	const navigate = useNavigate();
	const totalSaved = circles.reduce((s, c) => s + (c.hasPaid ? c.depositAmount : 0), 0);
	const pending = circles.filter((c) => !c.hasPaid).length;
	const totalEarned = circles
		.flatMap((c) => c.payoutHistory || [])
		.reduce((s, h) => s + h.amount, 0);
	const recentAct = [
		...circles.flatMap((c) =>
			(c.payoutHistory || []).map((h) => ({
				type: 'payout',
				label: `Received from ${c.name}`,
				amount: $(h.amount, ''),
				symbol: c.tokenSymbol || 'USDC',
				date: h.date,
			})),
		),
		...circles
			.filter((c) => c.hasPaid)
			.map((c) => ({
				type: 'deposit',
				label: `Deposited to ${c.name}`,
				amount: `-${$(c.depositAmount, '')}`,
				symbol: c.tokenSymbol || 'USDC',
				date: 'This cycle',
			})),
	].slice(0, 6);

	return (
		<div
			className="p-4 sm:p-8 max-w-[960px] mx-auto"
			style={{ animation: 'fadeUp .3s ease both' }}
		>
			<div className="mb-6">
				<h1 className="font-sora text-xl font-bold text-ink mb-1">Overview</h1>
				<p className="text-muted text-[13px]">
					Welcome back,{' '}
					<span className="text-ink">{account?.meta?.name || sh(account?.address)}</span>
				</p>
			</div>

			<div className="grid grid-cols-2 gap-2.5 mb-6">
				<Metric label="Active Circles" value={circles.length} />
				<Metric label="Deposited" value={$(totalSaved)} accent={COLORS.pink} />
				<Metric label="Total Received" value={$(totalEarned)} accent={COLORS.ok} />
				<Metric
					label="Pending Deposits"
					value={pending}
					accent={pending > 0 ? COLORS.err : undefined}
				/>
			</div>

			<div className="grid grid-cols-1 gap-5">
				<div>
					<div className="flex justify-between items-center mb-3">
						<h2 className="font-sora text-[15px] font-semibold text-ink">My Circles</h2>
						<Link
							to="/app/circles"
							className="text-pink text-[13px] hover:text-pink-l transition-colors"
						>
							View all
						</Link>
					</div>
					<div className="flex flex-col gap-2">
						{circles.length === 0 ? (
							<div className={cn(cls.card, 'p-6 text-center')}>
								<p className="text-muted text-[13px] mb-3">No active circles</p>
								<GoldButton
									onClick={() => navigate('/app/join')}
									style={{
										fontSize: 13,
										padding: '8px 16px',
										borderRadius: 8,
										margin: '0 auto',
									}}
								>
									Browse circles
								</GoldButton>
							</div>
						) : (
							circles.slice(0, 3).map((c) => <MiniCircleCard key={c.id} circle={c} />)
						)}
					</div>
				</div>

				<div>
					<div className="flex justify-between items-center mb-3">
						<h2 className="font-sora text-[15px] font-semibold text-ink">
							Recent Activity
						</h2>
						<Link
							to="/app/history"
							className="text-pink text-[13px] hover:text-pink-l transition-colors"
						>
							View all
						</Link>
					</div>
					<div className={cn(cls.card, 'px-4 py-1')}>
						{recentAct.length === 0 ? (
							<div className="py-7 text-center text-muted text-[13px]">
								No activity yet
							</div>
						) : (
							recentAct.map((a, i) => <ActivityRow key={i} item={a} />)
						)}
					</div>
				</div>
			</div>

			<div
				className={cn(cls.card, 'flex flex-wrap items-center gap-4 px-4 py-3 mt-5 text-xs')}
			>
				<div className="flex items-center gap-1.5">
					<div
						className="w-[7px] h-[7px] rounded-full bg-ok"
						style={{ boxShadow: '0 0 5px var(--ok)' }}
					/>
					<span className="text-ok font-medium">Connected</span>
				</div>
				<span className="text-muted">Polkadot Testnet</span>
				<span className="text-muted font-mono hidden sm:inline text-[11px]">
					{sh(account?.address)}
				</span>
				<span className="text-muted">
					sol <span className="text-pink">v0.8</span>
				</span>
			</div>
		</div>
	);
}
