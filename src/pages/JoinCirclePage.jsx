import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWriteContract, useReadContract, useAccount, usePublicClient } from 'wagmi';
import { parseUnits } from 'viem';
import { COLORS, cls, cn } from '../theme.js';
import { Tag, GoldButton, Spinner } from '../components/ui.jsx';
import { PolUSDCABI, RotaFiCircleABI, RotaFiFactoryABI, ADDRESSES } from '../contracts/index.js';

const $ = (n, symbol = '$') =>
	symbol +
	Number(n || 0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const sh = (a) => (a ? a.slice(0, 8) + '...' + a.slice(-4) : '');

function CircleCard({ circle, onJoin, alreadyIn }) {
	console.log('circle', circle);
	const [loading, setLoading] = useState(false);
	const [expanded, setExpanded] = useState(false);
	const [step, setStep] = useState(''); // 'approving', 'joining'
	const { address } = useAccount();
	const publicClient = usePublicClient();
	const { writeContractAsync } = useWriteContract();

	const spots = circle.memberCap - circle.memberCount;
	const filled = circle.memberCount / circle.memberCap;

	// Check current allowance broadly
	const { data: allowance } = useReadContract({
		address: circle.tokenAddress,
		abi: PolUSDCABI,
		functionName: 'allowance',
		args: [address, circle.contractAddress],
		query: { enabled: !!address && !!circle.contractAddress && !!circle.tokenAddress },
	});

	const handleJoin = async (e) => {
		e.stopPropagation(); // Keep this to prevent card expansion
		console.log(
			`🚀 [JoinCirclePage] Attempting to join circle: "${circle.name}" at ${circle.contractAddress}`,
		);
		console.log(`📊 Token: ${circle.tokenSymbol || 'USDC'} (${circle.tokenAddress})`);

		setLoading(true);
		try {
			const amountToApprove = parseUnits(
				circle.depositAmount.toString(),
				circle.tokenDecimals || 6,
			);
			console.log(`💳 Allowance required: ${amountToApprove.toString()}`);

			// Need approval?
			if (!allowance || allowance < amountToApprove) {
				setStep('approving');
				console.log(
					`⏳ [JoinCirclePage] Approving ${circle.tokenSymbol || 'USDC'} for ${circle.contractAddress}...`,
				);
				const approveHash = await writeContractAsync({
					address: circle.tokenAddress,
					abi: PolUSDCABI,
					functionName: 'approve',
					args: [circle.contractAddress, amountToApprove],
				});
				console.log(`✅ [JoinCirclePage] Approval tx submitted: ${approveHash}`);
				await publicClient.waitForTransactionReceipt({ hash: approveHash });
			}

			setStep('joining');
			console.log(`⏳ [JoinCirclePage] Joining circle contract...`);
			const joinHash = await writeContractAsync({
				address: circle.contractAddress,
				abi: RotaFiCircleABI,
				functionName: 'joinCircle',
			});
			console.log(`✅ [JoinCirclePage] Join tx submitted: ${joinHash}`);
			await publicClient.waitForTransactionReceipt({ hash: joinHash });

			// Register membership in the factory registry so getCirclesByMember picks it up
			console.log(
				`⏳ [JoinCirclePage] Recording join in Factory: ${ADDRESSES.RotaFiFactory}`,
			);
			const recordHash = await writeContractAsync({
				address: ADDRESSES.RotaFiFactory,
				abi: RotaFiFactoryABI,
				functionName: 'recordJoin',
				args: [circle.contractAddress],
			});
			console.log(`✅ [JoinCirclePage] Factory record tx submitted: ${recordHash}`);
			await publicClient.waitForTransactionReceipt({ hash: recordHash });

			console.log(`🎉 [JoinCirclePage] Successfully joined circle: ${circle.name}!`);
			// Notify AppState to refetch and show success toast
			await onJoin(circle.id, joinHash); // Changed txHash to joinHash
		} catch (err) {
			console.error('❌ [JoinCirclePage] Error joining circle:', err);
			alert(err.shortMessage || 'Failed to join group.');
		} finally {
			setLoading(false);
			setStep('');
		}
	};

	return (
		<div
			className={cn(cls.card, 'overflow-hidden transition-[border-color]')}
		>
			<div className="p-4">
				{/* Header row */}
				<div className="flex items-start gap-3 mb-3">
					<div className="flex-1 min-w-0">
						<div className="font-sora text-[15px] font-semibold text-ink truncate mb-1">
							{circle.name}
						</div>
						<div className="flex items-center gap-2 flex-wrap">
							<span className="text-muted text-xs">
								{$(circle.depositAmount, '')} {circle.tokenSymbol || 'USDC'}/
								{circle.cycleLabel.toLowerCase()}
							</span>
							<span className="text-dim">·</span>
							<span
								className={cn(
									'text-xs',
									spots <= 2 ? 'text-warn font-medium' : 'text-muted',
								)}
							>
								{spots} spot{spots !== 1 ? 's' : ''} left
							</span>
						</div>
					</div>
					<div className="text-right shrink-0">
						<div className="font-sora text-xl font-bold text-pink">
							{$(circle.pot, '')}
						</div>
						<div className="text-muted text-[11px]">
							{circle.tokenSymbol || 'USDC'} pot
						</div>
					</div>
				</div>

				{/* Fill bar */}
				<div className="mb-3">
					<div className="flex justify-between text-[11px] text-muted mb-1">
						<span>
							{circle.memberCount}/{circle.memberCap} members
						</span>
						<span>{Math.round(filled * 100)}% full</span>
					</div>
					<div className="h-1 bg-border rounded-full overflow-hidden">
						<div
							className="h-full rounded-full transition-[width]"
							style={{
								width: `${filled * 100}%`,
								background: `linear-gradient(90deg,var(--pink),var(--pink-l))`,
							}}
						/>
					</div>
				</div>

				{/* Actions */}
				<div className="flex gap-2">
					{!alreadyIn ? (
						<GoldButton
							onClick={handleJoin}
							disabled={loading}
							style={{ flex: 1, padding: '9px 0', fontSize: 14 }}
						>
							{loading && <Spinner size={14} color="#fff" />}
							{loading
								? step === 'approving'
									? `Approving ${circle.tokenSymbol || 'USDC'}...`
									: 'Joining...'
								: 'Join Circle'}
						</GoldButton>
					) : (
						<div className="flex-1 py-[9px] text-sm text-ok border border-ok-bdr bg-ok-bg rounded-lg text-center">
							Joined
						</div>
					)}
					<button
						onClick={() => setExpanded(!expanded)}
						className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border bg-surface text-muted text-[13px] cursor-pointer hover:bg-card hover:text-ink transition-colors"
					>
						{expanded ? 'Less' : 'More'}
						<svg
							width="12"
							height="12"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
						>
							<path d={expanded ? 'm18 15-6-6-6 6' : 'm6 9 6 6 6-6'} />
						</svg>
					</button>
				</div>
			</div>

			{/* Expanded details */}
			{expanded && (
				<div
					className="border-t border-border p-4 flex flex-col gap-2.5"
					style={{ animation: 'fadeUp .2s ease both' }}
				>
					<div className="grid grid-cols-2 gap-2.5">
						<div>
							<div className={cls.label}>Contract</div>
							<div className="text-ink text-xs font-mono break-all">
								{sh(circle.contractAddress)}
							</div>
						</div>
						<div>
							<div className={cls.label}>Your position</div>
							<div className="text-ink text-[13px]">#{circle.memberCount + 1}</div>
						</div>
					</div>
					<div className="bg-warn-bg border border-warn-bdr rounded-lg px-3 py-2.5 text-xs text-warn leading-relaxed">
						Joining requires two transactions: 1. Approve {circle.tokenSymbol || 'USDC'}
						, 2. Join Circle. Make sure you have enough {circle.tokenSymbol || 'USDC'}.
					</div>
					<Link
						to={`/app/circle/${circle.id}`}
						className="text-pink text-[13px] flex items-center gap-1.5 hover:text-pink-l transition-colors"
					>
						View full details
						<svg
							width="12"
							height="12"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
						>
							<path d="m9 18 6-6-6-6" />
						</svg>
					</Link>
				</div>
			)}
		</div>
	);
}

export default function JoinCirclePage({ availableCircles, myCircleIds, onJoin, onCreateCircle }) {
	const [search, setSearch] = useState('');
	const [sortBy, setSortBy] = useState('pot');
	const filtered = availableCircles
		.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
		.sort((a, b) => (sortBy === 'pot' ? b.pot - a.pot : b.memberCount - a.memberCount));

	return (
		<div className="p-4 sm:p-8" style={{ animation: 'fadeUp .3s ease both' }}>
			<div className="flex justify-between items-start mb-5">
				<div>
					<h1 className="font-sora text-xl font-bold text-ink mb-1">Join a Circle</h1>
					<p className="text-muted text-[13px]">{availableCircles.length} open to join</p>
				</div>
				<GoldButton
					onClick={onCreateCircle}
					variant="ghost"
					style={{ padding: '9px 14px', fontSize: 13 }}
				>
					Create
				</GoldButton>
			</div>

			{/* Search + sort */}
			<div className="flex gap-2 mb-4">
				<div className="relative flex-1">
					<svg
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke={COLORS.muted}
						strokeWidth="2"
						className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
					>
						<circle cx="11" cy="11" r="8" />
						<path d="m21 21-4.35-4.35" />
					</svg>
					<input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search..."
						className={cn(cls.input, 'pl-9')}
					/>
				</div>
				<div>	
					<select
						value={sortBy}
						onChange={(e) => setSortBy(e.target.value)}
						className={cn(cls.input, 'shrink-1')}
					>
						<option value="pot">Pot</option>
						<option value="members">Members</option>
					</select>
				</div>
			</div>

			<div
				className="rounded-xl px-3.5 py-2.5 mb-4 text-xs text-muted"
				style={{ background: 'var(--pink-dim)', borderColor: 'var(--pink-d)50' }}
			>
				Approve ERC20 token spend on the contract before your first deposit.
			</div>

			<div className="flex flex-col gap-2.5">
				{filtered.length === 0 ? (
					<div className={cn(cls.card, 'p-10 text-center')}>
						<p className="text-muted text-sm mb-3.5">
							{search
								? `No circles matching "${search}"`
								: 'No open circles right now.'}
						</p>
						<GoldButton
							onClick={onCreateCircle}
							style={{ fontSize: 13, padding: '9px 20px', margin: '0 auto' }}
						>
							Create a new circle
						</GoldButton>
					</div>
				) : (
					filtered.map((c) => (
						<CircleCard
							key={c.id}
							circle={c}
							onJoin={onJoin}
							alreadyIn={myCircleIds.includes(c.id)}
						/>
					))
				)}
			</div>
		</div>
	);
}
