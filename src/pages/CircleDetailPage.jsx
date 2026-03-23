import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWriteContract, useAccount, useReadContract, usePublicClient } from 'wagmi';
import { parseUnits } from 'viem';
import { ADDRESSES, PolUSDCABI, RotaFiCircleABI, RotaFiFactoryABI } from '../contracts/index.js';
import { COLORS, cls, cn } from '../theme.js';
import { Ring, Tag, GoldButton, Spinner, Avatar } from '../components/ui.jsx';

const $ = (n, symbol = '$') =>
	symbol +
	Number(n || 0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const sh = (a) => (a ? a.slice(0, 8) + '...' + a.slice(-4) : '');

export default function CircleDetailPage({
	circle,
	isMember,
	connected,
	onBack,
	onDeposit,
	onTriggerPayout,
	onJoin,
	onRefresh,
}) {
	const navigate = useNavigate();
	const { address: userAddress } = useAccount();
	const publicClient = usePublicClient();
	const { writeContractAsync } = useWriteContract();

	const { data: allowance, refetch: refetchAllowance } = useReadContract({
		address: circle.tokenAddress,
		abi: PolUSDCABI,
		functionName: 'allowance',
		args: [userAddress, circle.contractAddress],
		query: { enabled: !!userAddress && !!circle.contractAddress && !!circle.tokenAddress },
	});

	const { data: tokenBalance, refetch: refetchBalance } = useReadContract({
		address: circle.tokenAddress,
		abi: PolUSDCABI,
		functionName: 'balanceOf',
		args: [userAddress],
		query: { enabled: !!userAddress && !!circle.tokenAddress },
	});

	const [triggering, setTriggering] = useState(false);
	const [joining, setJoining] = useState(false);
	const [depositing, setDepositing] = useState(false);
	const [claiming, setClaiming] = useState(false);
	const [flagging, setFlagging] = useState(false);
	const [pausing, setPausing] = useState(false);
	const [addrCopied, setAddrCopied] = useState(false);
	const [linkCopied, setLinkCopied] = useState(false);
	const [tab, setTab] = useState('rotation');

	const pct = circle.totalRounds > 0 ? circle.currentRound / circle.totalRounds : 0;
	const paid = circle.roster?.filter((m) => m.hasPaid).length || 0;
	const allDeposited = paid === circle.memberCount;
	const recipient = circle.roster?.find((m) => m.position === circle.currentRound);
	const spots = circle.memberCap - circle.memberCount;

	const now = Math.floor(Date.now() / 1000);
	const isLate = circle.deadline > 0 && now > circle.deadline;
	const timeRemaining = circle.deadline > now ? circle.deadline - now : 0;

	const requiredDepositBigInt = circle.depositAmount
		? parseUnits(circle.depositAmount.toString(), circle.tokenDecimals || 6)
		: 0n;
	const hasEnoughToken = tokenBalance !== undefined && tokenBalance >= requiredDepositBigInt;

	const formatTime = (seconds) => {
		if (circle.deadline === 0) return 'Waiting for members...';
		if (seconds <= 0) return 'Deadline passed';
		const d = Math.floor(seconds / 86400);
		const h = Math.floor((seconds % 86400) / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		if (d > 0) return `${d}d ${h}h remaining`;
		if (h > 0) return `${h}h ${m}m remaining`;
		return `${m}m remaining`;
	};

	const doDeposit = async () => {
		if (!circle.depositAmount || !circle.contractAddress) return;
		setDepositing(true);
		try {
			const amountBigInt = parseUnits(
				circle.depositAmount.toString(),
				circle.tokenDecimals || 6,
			);

			// Check allowance and approve if needed
			if (!allowance || allowance < amountBigInt) {
				const approveHash = await writeContractAsync({
					address: circle.tokenAddress,
					abi: PolUSDCABI,
					functionName: 'approve',
					args: [circle.contractAddress, amountBigInt],
				});
				await publicClient.waitForTransactionReceipt({ hash: approveHash });
			}

			// Execute deposit
			const txHash = await writeContractAsync({
				address: circle.contractAddress,
				abi: RotaFiCircleABI,
				functionName: 'deposit',
			});
			await publicClient.waitForTransactionReceipt({ hash: txHash });

			// Update local queries
			await Promise.all([refetchAllowance(), refetchBalance()]);

			// Update UI optimism
			if (onDeposit) await onDeposit(circle.id);
		} catch (err) {
			console.error(err);
			alert(err.shortMessage || 'Failed to deposit.');
		} finally {
			setDepositing(false);
		}
	};

	const doClaimFaucet = async () => {
		setClaiming(true);
		try {
			const txHash = await writeContractAsync({
				address: circle.tokenAddress,
				abi: PolUSDCABI,
				functionName: 'faucet',
			});
			await publicClient.waitForTransactionReceipt({ hash: txHash });

			// Refetch user's balance locally so the "Insufficient Funds" box disappears immediately
			await refetchBalance();

			// Await confirmation optionally, but triggering our global refetch is enough to make the UI feel fast
			if (onDeposit) await onDeposit(circle.id);
		} catch (err) {
			console.error(err);
			alert(
				err.shortMessage ||
					'Failed to claim from faucet. You may have already claimed in the last 24h.',
			);
		} finally {
			setClaiming(false);
		}
	};

	const doTrigger = async () => {
		setTriggering(true);
		try {
			const txHash = await writeContractAsync({
				address: circle.contractAddress,
				abi: RotaFiCircleABI,
				functionName: 'triggerPayout',
			});
			await publicClient.waitForTransactionReceipt({ hash: txHash });

			// Global refetch
			if (onTriggerPayout) await onTriggerPayout(circle.id);
		} catch (err) {
			console.error(err);
			alert(err.shortMessage || 'Failed to trigger payout.');
		} finally {
			setTriggering(false);
		}
	};

	const doJoin = async () => {
		setJoining(true);
		try {
			const amountToApprove = parseUnits(
				circle.depositAmount.toString(),
				circle.tokenDecimals || 6,
			);
			if (!allowance || allowance < amountToApprove) {
				const approveHash = await writeContractAsync({
					address: circle.tokenAddress,
					abi: PolUSDCABI,
					functionName: 'approve',
					args: [circle.contractAddress, amountToApprove],
				});
				await publicClient.waitForTransactionReceipt({ hash: approveHash });
			}

			const joinHash = await writeContractAsync({
				address: circle.contractAddress,
				abi: RotaFiCircleABI,
				functionName: 'joinCircle',
			});
			await publicClient.waitForTransactionReceipt({ hash: joinHash });

			const recordHash = await writeContractAsync({
				address: ADDRESSES.RotaFiFactory,
				abi: RotaFiFactoryABI,
				functionName: 'recordJoin',
				args: [circle.contractAddress],
			});
			await publicClient.waitForTransactionReceipt({ hash: recordHash });

			await onJoin(circle.id, joinHash);
		} catch (err) {
			console.error(err);
			alert(err.shortMessage || 'Failed to join circle.');
		} finally {
			setJoining(false);
		}
	};

	const doFlagLate = async () => {
		setFlagging(true);
		try {
			const txHash = await writeContractAsync({
				address: circle.contractAddress,
				abi: RotaFiCircleABI,
				functionName: 'flagLateMembers',
			});
			await publicClient.waitForTransactionReceipt({ hash: txHash });
			if (onRefresh) await onRefresh();
		} catch (e) {
			console.error(e);
		} finally {
			setFlagging(false);
		}
	};

	const doTogglePause = async () => {
		setPausing(true);
		try {
			const txHash = await writeContractAsync({
				address: circle.contractAddress,
				abi: RotaFiCircleABI,
				functionName: circle.isPaused ? 'unpause' : 'pause',
			});
			await publicClient.waitForTransactionReceipt({ hash: txHash });
			if (onRefresh) await onRefresh();
		} catch (e) {
			console.error(e);
		} finally {
			setPausing(false);
		}
	};

	const copyAddr = () => {
		navigator.clipboard?.writeText(circle.contractAddress || '');
		setAddrCopied(true);
		setTimeout(() => setAddrCopied(false), 2000);
	};
	const copyLink = () => {
		navigator.clipboard?.writeText(window.location.href);
		setLinkCopied(true);
		setTimeout(() => setLinkCopied(false), 2500);
	};

	return (
		<div style={{ animation: 'fadeUp .3s ease both' }} className="min-h-full">
			{/* ── Top bar ─────────────────────────────────────────────────────── */}
			<div className="bg-surface border-b border-border px-4 py-3 flex items-center gap-2.5 sticky top-0 z-10">
				<button
					onClick={onBack}
					className="w-8 h-8 rounded-lg border border-border bg-card flex items-center justify-center cursor-pointer text-muted hover:text-ink hover:border-border-h transition-colors shrink-0"
				>
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
					>
						<path d="m15 18-6-6 6-6" />
					</svg>
				</button>
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 flex-wrap">
						<h1 className="font-sora text-[15px] font-bold text-ink truncate">
							{circle.name}
						</h1>
						{circle.isAdmin && <Tag color={COLORS.pink}>Admin</Tag>}
					</div>
					<div className="flex items-center gap-1.5 mt-0.5">
						<span className="text-muted text-[11px] font-mono">
							{sh(circle.contractAddress)}
						</span>
						<button
							onClick={copyAddr}
							className={cn(
								'flex shrink-0 cursor-pointer transition-colors',
								addrCopied ? 'text-ok' : 'text-muted',
							)}
						>
							{addrCopied ? (
								<svg
									width="11"
									height="11"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2.5"
								>
									<polyline points="20 6 9 17 4 12" />
								</svg>
							) : (
								<svg
									width="11"
									height="11"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
								>
									<rect x="9" y="9" width="13" height="13" rx="2" />
									<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
								</svg>
							)}
						</button>
					</div>
				</div>
				<button
					onClick={copyLink}
					className={cn(
						'flex items-center gap-1.5 px-3 py-[7px] rounded-lg border text-xs cursor-pointer transition-all shrink-0',
						linkCopied
							? 'bg-ok-bg border-ok-bdr text-ok'
							: 'bg-card border-border text-muted hover:text-ink hover:border-border-h',
					)}
				>
					{linkCopied ? (
						<svg
							width="13"
							height="13"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
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
							stroke="currentColor"
							strokeWidth="2"
						>
							<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
							<polyline points="16 6 12 2 8 6" />
							<line x1="12" y1="2" x2="12" y2="15" />
						</svg>
					)}
					{linkCopied ? 'Copied!' : 'Share'}
				</button>
			</div>

			<div className="px-4 py-4 pb-16">
				{/* ── Stats hero ──────────────────────────────────────────────── */}
				<div className={cn(cls.card, 'p-4 mb-3.5')}>
					<div className="flex items-center gap-4 mb-4">
						<div className="relative shrink-0">
							<Ring pct={pct} size={88} strokeWidth={6} />
							<div className="absolute inset-0 flex flex-col items-center justify-center">
								<span className="font-sora text-lg font-bold text-ink leading-none">
									{circle.currentRound}
								</span>
								<span className="text-[11px] text-muted mt-0.5">
									of {circle.totalRounds}
								</span>
							</div>
						</div>
						<div className="flex-1">
							<div className="text-muted text-[11px] uppercase tracking-widest mb-1.5">
								Pot this cycle
							</div>
							<div className="font-sora text-3xl font-bold text-pink leading-none">
								{$(circle.pot, '')}{' '}
								<span className="text-sm font-normal">
									{circle.tokenSymbol || 'USDC'}
								</span>
							</div>
							<div className="text-muted text-xs mt-1.5">
								{$(circle.depositAmount, '')} {circle.tokenSymbol || 'USDC'}/member
								· {circle.memberCount} members
							</div>
							{recipient && (
								<div className="text-muted text-xs mt-1">
									Receiving: <span className="text-ink">{recipient.name}</span>
								</div>
							)}
							{circle.isActive && circle.currentRound > 0 && (
								<div
									className={cn(
										'text-xs mt-1 font-medium',
										isLate ? 'text-warn' : 'text-ok',
									)}
								>
									{formatTime(timeRemaining)}
								</div>
							)}
						</div>
					</div>
					<div className="grid grid-cols-3 gap-2">
						{[
							{
								label: 'Members paid',
								val: `${paid}/${circle.memberCount}`,
								col: allDeposited ? COLORS.ok : COLORS.text,
							},
							{
								label: isMember ? 'My position' : 'Spots left',
								val: isMember ? `#${circle.myPosition}` : `${spots}`,
								col: COLORS.text,
							},
							{
								label: isMember ? 'My turn' : 'Frequency',
								val: isMember ? circle.myTurnLabel : circle.cycleLabel,
								col: COLORS.text,
							},
						].map((s, i) => (
							<div
								key={i}
								className="bg-surface border border-border rounded-xl p-2.5"
							>
								<div className="text-muted text-[10px] uppercase tracking-widest mb-1">
									{s.label}
								</div>
								<div
									className="font-sora text-[15px] font-bold"
									style={{ color: s.col }}
								>
									{s.val}
								</div>
							</div>
						))}
					</div>
				</div>

				{/* ── Alerts ──────────────────────────────────────────────────── */}
				{circle.isPaused && (
					<div className="bg-warn-bg border border-warn-bdr rounded-xl p-4 mb-3 flex items-start gap-3">
						<svg
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke={COLORS.warn}
							strokeWidth="2"
							className="shrink-0 mt-0.5"
						>
							<circle cx="12" cy="12" r="10" />
							<line x1="12" y1="8" x2="12" y2="12" />
							<line x1="12" y1="16" x2="12.01" y2="16" />
						</svg>
						<div className="flex-1">
							<div className="text-warn font-semibold text-sm mb-1">
								Circle Paused
							</div>
							<div className="text-warn opacity-90 text-[13px]">
								This circle has been temporarily paused by the admin.
							</div>
						</div>
					</div>
				)}

				{isMember &&
					!circle.hasPaid &&
					!circle.isPaused &&
					(circle.memberCount === circle.memberCap ? (
						<div className="bg-err-bg border border-err-bdr rounded-xl p-4 mb-3 flex items-start gap-3">
							<svg
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke={COLORS.err}
								strokeWidth="2"
								className="shrink-0 mt-0.5"
							>
								<circle cx="12" cy="12" r="10" />
								<path d="M12 8v4M12 16h.01" />
							</svg>
							<div className="flex-1">
								<div className="text-ink font-medium text-sm mb-1">
									Deposit required
								</div>
								<div className="text-muted text-[13px] mb-2.5">
									{$(circle.depositAmount, '')} {circle.tokenSymbol || 'USDC'} due
									for round {circle.currentRound}
								</div>
								{!circle.hasPaid ? (
									<GoldButton
										onClick={doDeposit}
										disabled={depositing}
										style={{ width: '100%', padding: '12px', fontSize: 15 }}
									>
										{depositing && <Spinner size={16} color="#fff" />}
										{depositing
											? `Processing...`
											: `Deposit ${$(circle.depositAmount, '')} ${circle.tokenSymbol || 'USDC'}`}
									</GoldButton>
								) : (
									<div className="mt-1.5 p-2.5 bg-card border border-border rounded-lg">
										<div className="flex items-center justify-between gap-3">
											<div className="text-ink text-[13px]">
												Insufficient {circle.tokenSymbol || 'USDC'} balance.
											</div>
											<button
												onClick={doClaimFaucet}
												disabled={claiming}
												className="px-3 py-1.5 rounded-lg bg-pink text-white text-xs font-medium cursor-pointer hover:bg-pink-l transition-colors disabled:cursor-not-allowed disabled:opacity-60"
											>
												{claiming
													? 'Claiming...'
													: `Claim 1,000 Test ${circle.tokenSymbol || 'USDC'}`}
											</button>
										</div>
										<div className="text-muted text-[11px] mt-1">
											Mint free testnet tokens from the faucet to fund your
											deposits.
										</div>
									</div>
								)}
							</div>
						</div>
					) : (
						<div className={cn(cls.card, 'p-4 mb-3 flex items-start gap-3')}>
							<svg
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke={COLORS.muted}
								strokeWidth="2"
								className="shrink-0 mt-0.5"
							>
								<circle cx="12" cy="12" r="10" />
								<path d="M12 8v4M12 16h.01" />
							</svg>
							<div className="flex-1">
								<div className="text-ink font-medium text-sm mb-1">
									Waiting for members...
								</div>
								<div className="text-muted text-[13px]">
									We are still waiting for {spots} more member
									{spots !== 1 ? 's' : ''} to join before Round 1 begins and
									deposits open.
								</div>
							</div>
						</div>
					))}

				{isMember && allDeposited && circle.hasPaid && (
					<div className="bg-ok-bg border border-ok-bdr rounded-xl p-4 mb-3 flex items-start gap-3">
						<svg
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke={COLORS.ok}
							strokeWidth="2"
							className="shrink-0 mt-0.5"
						>
							<polyline points="20 6 9 17 4 12" />
						</svg>
						<div className="flex-1">
							<div className="text-ink font-medium text-sm mb-1">
								All deposits received
							</div>
							<div className="text-muted text-[13px] mb-2.5">
								Ready to pay {$(circle.pot, '')} {circle.tokenSymbol || 'USDC'} to{' '}
								{recipient?.name}.
							</div>
							<GoldButton
								onClick={doTrigger}
								disabled={triggering}
								style={{ padding: '9px 16px', fontSize: 13 }}
							>
								{triggering && <Spinner size={13} color="#fff" />}
								{triggering ? 'Sending...' : 'Trigger Payout'}
							</GoldButton>
						</div>
					</div>
				)}

				{/* ── Admin Controls ────────────────────────────────────────────── */}
				{circle.isAdmin && (
					<div
						className={cn(
							cls.card,
							'p-4 mb-3 flex items-center justify-between gap-3 flex-wrap',
						)}
					>
						<div className="flex-1 min-w-[200px]">
							<div className="text-ink font-medium text-sm mb-1">Admin Controls</div>
							<div className="text-muted text-[13px]">
								{circle.isPaused
									? 'Circle is currently paused.'
									: 'Manage circle state and members.'}
							</div>
						</div>
						<div className="flex gap-2 shrink-0">
							{isLate && !allDeposited && !circle.isPaused && (
								<button
									onClick={doFlagLate}
									disabled={flagging}
									className="px-3 py-2 rounded-lg bg-warn-bg text-warn border border-warn-bdr text-xs font-medium cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-60"
								>
									{flagging ? 'Flagging...' : 'Flag Late Members'}
								</button>
							)}
							<button
								onClick={doTogglePause}
								disabled={pausing}
								className="px-3 py-2 rounded-lg bg-card text-ink border border-border text-xs font-medium cursor-pointer hover:bg-card-h transition-colors disabled:opacity-60"
							>
								{pausing
									? '...'
									: circle.isPaused
										? 'Unpause Circle'
										: 'Pause Circle'}
							</button>
						</div>
					</div>
				)}

				{/* ────────────────── Non Member Options ────────────────────────── */}
				{!isMember &&
					(spots > 0 ? (
						<div
							className="rounded-xl p-4 mb-3 flex items-start gap-3"
							style={{
								background: 'var(--pink-dim)',
								borderColor: 'var(--pink-d)50',
							}}
						>
							<svg
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke={COLORS.pink}
								strokeWidth="2"
								className="shrink-0 mt-0.5"
							>
								<circle cx="12" cy="12" r="10" />
								<path d="M12 8v4M12 16h.01" />
							</svg>
							<div className="flex-1">
								<div className="text-ink font-medium text-sm mb-1">
									{spots} spot{spots !== 1 ? 's' : ''} open
								</div>
								<div className="text-muted text-[13px] mb-2.5">
									{connected
										? `You can join right now by clicking below.`
										: 'Connect your wallet to join.'}
								</div>
								{connected ? (
									<GoldButton
										onClick={doJoin}
										disabled={joining}
										style={{ padding: '9px 16px', fontSize: 13 }}
									>
										{joining && <Spinner size={13} color="#fff" />}
										{joining ? 'Joining...' : 'Join Circle'}
									</GoldButton>
								) : (
									<button
										onClick={() => navigate('/')}
										className="px-4 py-2 rounded-lg bg-pink text-white text-[13px] cursor-pointer hover:bg-pink-l transition-colors border-none"
									>
										Connect wallet
									</button>
								)}
							</div>
						</div>
					) : (
						<div className={cn(cls.card, 'p-4 mb-3 flex items-start gap-3')}>
							<svg
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke={COLORS.muted}
								strokeWidth="2"
								className="shrink-0 mt-0.5"
							>
								<circle cx="12" cy="12" r="10" />
								<line x1="12" y1="8" x2="12" y2="12" />
								<line x1="12" y1="16" x2="12.01" y2="16" />
							</svg>
							<div className="flex-1">
								<div className="text-ink font-medium text-sm mb-1">Circle Full</div>
								<div className="text-muted text-[13px]">
									There are no remaining spots available in this circle.
								</div>
							</div>
						</div>
					))}

				{/* ── Tabs ────────────────────────────────────────────────────── */}
				<div className="flex gap-1 bg-card border border-border rounded-xl p-1 mb-4">
					{[
						['rotation', 'Rotation'],
						['history', 'History'],
					].map(([val, lbl]) => (
						<button
							key={val}
							onClick={() => setTab(val)}
							className={cn(
								'flex-1 py-[7px] px-3 rounded-lg text-[13px] font-medium cursor-pointer transition-all',
								tab === val
									? 'text-pink font-semibold'
									: 'text-muted border-transparent hover:text-ink',
							)}
							style={
								tab === val
									? {
											background: 'var(--pink-dim)',
											borderColor: 'var(--pink-d)50',
										}
									: undefined
							}
						>
							{lbl}
						</button>
					))}
				</div>

				{/* ── Rotation ─────────────────────────────────────────────────── */}
				{tab === 'rotation' && (
					<div className="flex flex-col gap-2">
						{(circle.roster || []).map((member, idx) => {
							const isCur = member.position === circle.currentRound;
							return (
								<div
									key={idx}
									className="flex items-center gap-3 p-3.5 rounded-xl transition-colors"
									style={{
										background: isCur ? 'var(--pink-dim)' : 'var(--card)',
										borderColor: isCur ? 'var(--pink-d)50' : 'var(--border)',
									}}
								>
									<div
										className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
										style={{
											background: isCur ? COLORS.pink : 'var(--surface)',
											borderColor: isCur ? COLORS.pink : 'var(--border)',
											color: isCur ? '#fff' : 'var(--muted)',
										}}
									>
										{member.position}
									</div>
									<Avatar name={member.name} size={28} active={member.isMe} />
									<div className="flex-1 min-w-0">
										<div
											className={cn(
												'text-[13px] truncate',
												member.isMe
													? 'text-pink font-semibold'
													: 'text-ink',
											)}
										>
											{member.name}
											{member.isMe ? ' (you)' : ''}
										</div>
										{isCur && (
											<div className="text-[11px] text-pink font-medium">
												Receiving now
											</div>
										)}
									</div>
									<div className="flex flex-col items-end gap-1 shrink-0">
										{member.hasPaid ? (
											<Tag color={COLORS.ok}>Paid</Tag>
										) : member.isPenalized ? (
											<Tag color={COLORS.err}>Late Penalty</Tag>
										) : (
											<Tag color={COLORS.muted}>Pending</Tag>
										)}
										{member.hasReceived && <Tag color={COLORS.ok}>Received</Tag>}
									</div>
								</div>
							);
						})}
					</div>
				)}

				{/* ── History ──────────────────────────────────────────────────── */}
				{tab === 'history' && (
					<div>
						{(circle.payoutHistory || []).length === 0 ? (
							<div
								className="rounded-lg px-3 py-2.5 text-xs text-pink leading-relaxed"
								style={{
									background: 'var(--pink-dim)',
									borderColor: 'var(--pink-d)40',
								}}
							>
								This circle uses <strong>{circle.tokenSymbol || 'USDC'}</strong> on{' '}
								{import.meta.env.VITE_NETWORK_NAME || 'Polkadot Hub'}.
							</div>
						) : (
							<div className="flex flex-col gap-2">
								{circle.payoutHistory.map((h, i) => (
									<div
										key={i}
										className={cn(cls.card, 'flex items-center gap-3 p-4')}
									>
										<div className="w-[34px] h-[34px] rounded-[10px] bg-ok-bg border border-ok-bdr flex items-center justify-center shrink-0">
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
										</div>
										<div className="flex-1 min-w-0">
											<div className="text-ink text-[13px] font-medium">
												Round {h.round} → {h.recipientName}
											</div>
											<div className="text-muted text-[11px] mt-0.5">
												{h.date} · {sh(h.txHash)}
											</div>
										</div>
										<div className="font-sora text-base font-bold text-ok shrink-0">
											{$(h.amount, '')} {circle.tokenSymbol || 'USDC'}
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
