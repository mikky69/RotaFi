import React from 'react';
import { Link } from 'react-router-dom';
import { COLORS, cls, cn } from '../theme.js';
import { Tag } from '../components/ui.jsx';

const $ = (n, sym = '$') =>
	sym +
	Number(n || 0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const sh = (a) => (a ? a.slice(0, 8) + '...' + a.slice(-4) : '');

export default function HistoryPage({ circles }) {
	const allHistory = circles
		.flatMap((c) =>
			(c.payoutHistory || [])
				.filter((h) => h.recipientName === 'You')
				.map((h) => ({
					...h,
					type: 'payout',
					circleName: c.name,
					circleId: c.id,
					symbol: c.tokenSymbol || 'USDC',
				})),
		)
		.sort((a, b) => new Date(b.date) - new Date(a.date));

	const allDeposits = circles
		.filter((c) => c.hasPaid)
		.map((c) => ({
			type: 'deposit',
			circleName: c.name,
			circleId: c.id,
			amount: c.depositAmount,
			round: c.currentRound,
			date: 'This cycle',
			txHash: null,
			symbol: c.tokenSymbol || 'USDC',
		}));
	const rows = [...allHistory, ...allDeposits];
	const totalReceived = allHistory.reduce((s, h) => s + h.amount, 0);
	const totalDeposited = circles.reduce((s, c) => s + (c.hasPaid ? c.depositAmount : 0), 0);
	const mainSym = circles[0]?.tokenSymbol || '$';

	return (
		<div className="p-4 sm:p-8" style={{ animation: 'fadeUp .3s ease both' }}>
			<div className="mb-5">
				<h1 className="font-sora text-xl font-bold text-ink mb-1">Payout History</h1>
				<p className="text-muted text-[13px]">Full on-chain record</p>
			</div>

			{/* Summary */}
			<div className="grid grid-cols-3 gap-2.5 mb-6">
				{[
					{
						label: 'Received',
						value: `${$(totalReceived, '')} ${mainSym}`,
						color: COLORS.ok,
					},
					{
						label: 'Deposited',
						value: `${$(totalDeposited, '')} ${mainSym}`,
						color: COLORS.pink,
					},
					{ label: 'Payouts', value: allHistory.length, color: 'var(--text)' },
				].map((s, i) => (
					<div key={i} className={cn(cls.card, 'p-3.5')}>
						<div className="text-muted text-[11px] font-medium uppercase tracking-widest mb-1.5">
							{s.label}
						</div>
						<div className="font-sora text-xl font-bold" style={{ color: s.color }}>
							{s.value}
						</div>
					</div>
				))}
			</div>

			{/* List */}
			<div className="flex flex-col gap-2">
				{rows.length === 0 ? (
					<div className={cn(cls.card, 'p-10 text-center text-muted text-sm')}>
						No transactions yet.
					</div>
				) : (
					rows.map((row, i) => (
						<div
							key={i}
							className={cn(
								cls.card,
								'flex items-center gap-3 p-3.5 transition-colors cursor-default',
							)}
							onMouseEnter={(e) =>
								(e.currentTarget.style.background = 'var(--card-h)')
							}
							onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--card)')}
						>
							<div
								className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 border"
								style={{
									background:
										row.type === 'payout' ? COLORS.okBg : 'var(--pink-dim)',
									borderColor:
										row.type === 'payout' ? COLORS.okBdr : 'var(--pink-d)40',
								}}
							>
								{row.type === 'payout' ? (
									<svg
										width="14"
										height="14"
										viewBox="0 0 24 24"
										fill="none"
										stroke={COLORS.ok}
										strokeWidth="2.5"
									>
										<polyline points="20 6 9 17 4 12" />
									</svg>
								) : (
									<svg
										width="14"
										height="14"
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
								<Link
									to={`/app/circle/${row.circleId}`}
									className="text-ink text-[13px] font-medium block truncate transition-colors hover:text-pink"
								>
									{row.circleName}
								</Link>
								<div className="text-muted text-[11px] mt-0.5">
									Round {row.round} · {row.date}
									{row.txHash && (
										<span className="ml-1.5 text-pink font-mono">
											{sh(row.txHash)}
										</span>
									)}
								</div>
							</div>

							<div
								className="font-sora text-[15px] font-bold shrink-0"
								style={{ color: row.type === 'payout' ? COLORS.ok : 'var(--text)' }}
							>
								{row.type === 'payout' ? '+' : '-'}
								{$(row.amount, '')}{' '}
								<span className="text-[11px] font-normal text-muted">
									{row.symbol}
								</span>
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
}
