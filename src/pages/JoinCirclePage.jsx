import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWriteContract, useReadContract, useAccount, usePublicClient } from 'wagmi';
import { parseUnits } from 'viem';
import { T, sans, inputStyle } from '../theme.js';
import { Tag, GoldButton, Spinner } from '../components/ui.jsx';
import { PolUSDCABI, RotaFiCircleABI, RotaFiFactoryABI, ADDRESSES } from '../contracts/index.js';

const $ = (n, symbol = '$') => symbol + Number(n || 0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const sh = a => a ? a.slice(0, 8) + '...' + a.slice(-4) : '';

function CircleCard({ circle, onJoin, alreadyIn }) {
  console.log("circle", circle)
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
    query: { enabled: !!address && !!circle.contractAddress && !!circle.tokenAddress }
  });

  const handleJoin = async (e) => {
    e.stopPropagation(); // Keep this to prevent card expansion
    console.log(`🚀 [JoinCirclePage] Attempting to join circle: "${circle.name}" at ${circle.contractAddress}`);
    console.log(`📊 Token: ${circle.tokenSymbol || 'USDC'} (${circle.tokenAddress})`);
    
    setLoading(true);
    try {
      const amountToApprove = parseUnits(circle.depositAmount.toString(), circle.tokenDecimals || 6);
      console.log(`💳 Allowance required: ${amountToApprove.toString()}`);

      // Need approval?
      if (!allowance || allowance < amountToApprove) {
        setStep('approving');
        console.log(`⏳ [JoinCirclePage] Approving ${circle.tokenSymbol || 'USDC'} for ${circle.contractAddress}...`);
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
      console.log(`⏳ [JoinCirclePage] Recording join in Factory: ${ADDRESSES.RotaFiFactory}`);
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
      console.error("❌ [JoinCirclePage] Error joining circle:", err);
      alert(err.shortMessage || 'Failed to join group.');
    } finally {
      setLoading(false);
      setStep('');
    }
  };

  return (
    <div style={{ background: T.card, border: `1px solid ${expanded ? T.pinkD + '60' : T.border}`, borderRadius: 12, overflow: 'hidden', transition: 'border-color .2s' }}>
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{circle.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ color: T.muted, fontSize: 12 }}>{$(circle.depositAmount, '')} {circle.tokenSymbol || 'USDC'}/{circle.cycleLabel.toLowerCase()}</span>
              <span style={{ color: T.dim }}>·</span>
              <span style={{ color: spots <= 2 ? T.warn : T.muted, fontSize: 12, fontWeight: spots <= 2 ? 500 : 400 }}>
                {spots} spot{spots !== 1 ? 's' : ''} left
              </span>
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 700, color: T.pink }}>{$(circle.pot, '')}</div>
            <div style={{ color: T.muted, fontSize: 11 }}>{circle.tokenSymbol || 'USDC'} pot</div>
          </div>
        </div>

        {/* Fill bar */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ color: T.muted, fontSize: 11 }}>{circle.memberCount}/{circle.memberCap} members</span>
            <span style={{ color: T.muted, fontSize: 11 }}>{Math.round(filled * 100)}% full</span>
          </div>
          <div style={{ height: 4, background: T.border, borderRadius: 4 }}>
            <div style={{ height: '100%', width: `${filled * 100}%`, background: `linear-gradient(90deg,${T.pink},${T.pinkL})`, borderRadius: 4, transition: 'width .4s' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {!alreadyIn ? (
            <GoldButton onClick={handleJoin} disabled={loading} style={{ flex: 1, padding: '9px 0', fontSize: 14, borderRadius: 8 }}>
              {loading && <Spinner size={14} color="#fff" />}
              {loading ? (step === 'approving' ? `Approving ${circle.tokenSymbol || 'USDC'}...` : 'Joining...') : 'Join Circle'}
            </GoldButton>
          ) : (
            <div style={{ flex: 1, padding: '9px 0', fontSize: 14, color: T.ok, border: `1px solid ${T.okBdr}`, borderRadius: 8, background: T.okBg, textAlign: 'center', fontFamily: sans }}>Joined</div>
          )}
          <button onClick={() => setExpanded(!expanded)}
            style={{ padding: '9px 14px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.muted, fontSize: 13, fontFamily: sans, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
            {expanded ? 'Less' : 'More'}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={expanded ? 'm18 15-6-6-6 6' : 'm6 9 6 6 6-6'} /></svg>
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: `1px solid ${T.border}`, padding: '14px 16px', animation: 'fadeUp .2s ease both', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ color: T.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>Contract</div>
              <div style={{ color: T.text, fontSize: 12, fontFamily: "'DM Mono',monospace", wordBreak: 'break-all' }}>{sh(circle.contractAddress)}</div>
            </div>
            <div>
              <div style={{ color: T.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>Your position</div>
              <div style={{ color: T.text, fontSize: 13 }}>#{circle.memberCount + 1}</div>
            </div>
          </div>
          <div style={{ background: T.warnBg, border: `1px solid ${T.warnBdr}`, borderRadius: 8, padding: '10px 12px', fontSize: 12, color: T.warn, lineHeight: 1.6 }}>
            Joining requires two transactions: 1. Approve {circle.tokenSymbol || 'USDC'}, 2. Join Circle. Make sure you have enough {circle.tokenSymbol || 'USDC'}.
          </div>
          <Link to={`/app/circle/${circle.id}`} style={{ color: T.pink, fontSize: 13, fontFamily: sans, display: 'flex', alignItems: 'center', gap: 5, textDecoration: 'none' }}>
            View full details
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
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
    .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortBy === 'pot' ? b.pot - a.pot : b.memberCount - a.memberCount);

  return (
    <div style={{ padding: '20px 16px', animation: 'fadeUp .3s ease both' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 700, color: T.text, marginBottom: 3 }}>Join a Circle</h1>
          <p style={{ color: T.muted, fontSize: 13 }}>{availableCircles.length} open to join</p>
        </div>
        <GoldButton onClick={onCreateCircle} variant="ghost" style={{ padding: '9px 14px', fontSize: 13, border: `1px solid ${T.border}`, color: T.text, background: T.card, borderRadius: 8 }}>
          Create
        </GoldButton>
      </div>

      {/* Search + sort */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ ...inputStyle, paddingLeft: 34 }} />
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ ...inputStyle, width: 'auto', flexShrink: 0 }}>
          <option value="pot">Pot</option>
          <option value="members">Members</option>
        </select>
      </div>

      <div style={{ background: T.pinkDim, border: `1px solid ${T.pinkD}50`, borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: T.muted }}>
        Approve ERC20 token spend on the contract before your first deposit.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 ? (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '40px 16px', textAlign: 'center' }}>
            <div style={{ color: T.muted, fontSize: 14, marginBottom: 14 }}>{search ? `No circles matching "${search}"` : 'No open circles right now.'}</div>
            <GoldButton onClick={onCreateCircle} style={{ fontSize: 13, padding: '9px 20px', margin: '0 auto' }}>Create a new circle</GoldButton>
          </div>
        ) : filtered.map(c => <CircleCard key={c.id} circle={c} onJoin={onJoin} alreadyIn={myCircleIds.includes(c.id)} />)}
      </div>
    </div>
  );
}
