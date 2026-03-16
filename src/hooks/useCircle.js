import { useMemo } from 'react';
import { useReadContract, useReadContracts, useAccount } from 'wagmi';
import { RotaFiFactoryABI, RotaFiCircleABI, ADDRESSES } from '../contracts/index.js';

const toCycleLabel = s => {
  const n = Number(s);
  if (n === 604800) return 'Weekly';
  if (n === 2592000) return 'Monthly';
  return 'Custom';
};

/** Build a normalised circle object from on-chain data */
function buildCircle(circleAddress, info, members = [], memberStatuses = [], userAddress, historyRecords = [], isPaused = false, currentRoundInfo = null) {
  if (!info) return null;
  const cap = Number(info.memberCap);
  const mc = Number(info.memberCount ?? members.length);
  const dep = Number(info.depositAmount) / 1_000_000;
  const currentRound = Number(info.currentRound);

  // memberStatuses is flat: [hasPaid_0, position_0, isPenalized_0, hasPaid_1, position_1, isPenalized_1, ...]
  const roster = members.map((addr, idx) => {
    const isMe = addr?.toLowerCase() === userAddress?.toLowerCase();
    const hasPaid = memberStatuses[idx * 3]?.result ?? false;
    const position = Number(memberStatuses[idx * 3 + 1]?.result ?? idx + 1);
    const isPenalized = memberStatuses[idx * 3 + 2]?.result ?? false;
    return {
      memberAddress: addr,
      name: isMe ? 'You' : addr?.slice(0, 6) + '...',
      position,
      hasPaid,
      hasReceived: position < currentRound,
      isPenalized,
      isMe,
    };
  });

  const myMember = roster.find(m => m.isMe);

  const payoutHistory = (historyRecords || []).map(h => ({
    round: Number(h.round),
    recipientName: roster.find(r => r.memberAddress?.toLowerCase() === h.recipient?.toLowerCase())?.name || (h.recipient ? h.recipient.slice(0, 6) + '...' : 'Unknown'),
    amount: Number(h.amount) / 1_000_000,
    date: new Date(Number(h.timestamp) * 1000).toLocaleDateString(),
    txHash: null, // The contract doesn't store the transaction hash, so we omit it
  })).reverse(); // Show newest first

  return {
    id: circleAddress,
    contractAddress: circleAddress,
    name: info.name,
    memberCount: mc,
    memberCap: cap,
    depositAmount: dep,
    cycleLabel: toCycleLabel(info.cycleSeconds),
    currentRound: currentRound === 0 ? 1 : currentRound,
    totalRounds: Number(info.totalRounds) || cap,
    pot: dep * mc,
    isAdmin: info.admin?.toLowerCase() === userAddress?.toLowerCase(),
    myPosition: myMember?.position ?? 0,
    myTurnLabel: myMember ? `Round ${myMember.position}` : '—',
    hasPaid: myMember?.hasPaid ?? false,
    isActive: info.isActive,
    isPaused,
    deadline: currentRoundInfo ? Number(currentRoundInfo.deadline) : 0,
    roster,
    payoutHistory,
  };
}

// ── Main hook ────────────────────────────────────────────────────────────────
export function useCirclesData() {
  const { address } = useAccount();

  // 1. Member circles from factory registry
  const { data: memberCircleAddresses = [], refetch: refetchMemberCircles } = useReadContract({
    address: ADDRESSES.RotaFiFactory,
    abi: RotaFiFactoryABI,
    functionName: 'getCirclesByMember',
    args: [address],
    query: { enabled: !!address && !!ADDRESSES.RotaFiFactory },
  });

  // 2. Open circles — factory returns full CircleEntry structs, no second read needed
  const { data: openEntries = [], refetch: refetchOpenCircles } = useReadContract({
    address: ADDRESSES.RotaFiFactory,
    abi: RotaFiFactoryABI,
    functionName: 'getOpenCircles',
    query: { enabled: !!ADDRESSES.RotaFiFactory },
  });

  // 3. For member circles: batch-read params
  const infoAndMembersCalls = useMemo(() =>
    (memberCircleAddresses || []).flatMap(addr => [
      { address: addr, abi: RotaFiCircleABI, functionName: 'getInfo' },
      { address: addr, abi: RotaFiCircleABI, functionName: 'getMembers' },
      { address: addr, abi: RotaFiCircleABI, functionName: 'getPayoutHistory' },
      { address: addr, abi: RotaFiCircleABI, functionName: 'paused' },
      { address: addr, abi: RotaFiCircleABI, functionName: 'getCurrentRound' },
    ]),
    [memberCircleAddresses]);

  const { data: infoAndMembersResults, refetch: refetchInfo } = useReadContracts({
    contracts: infoAndMembersCalls,
    query: { enabled: infoAndMembersCalls.length > 0 },
  });

  // 4. Once we have the member lists, batch-read hasDeposited + getMemberPosition per member
  const perMemberCalls = useMemo(() => {
    if (!infoAndMembersResults) return [];
    const calls = [];
    for (let i = 0; i < (memberCircleAddresses || []).length; i++) {
      const addr = memberCircleAddresses[i];
      const members = infoAndMembersResults[i * 5 + 1]?.result || [];
      for (const member of members) {
        calls.push({ address: addr, abi: RotaFiCircleABI, functionName: 'hasDeposited', args: [member] });
        calls.push({ address: addr, abi: RotaFiCircleABI, functionName: 'getMemberPosition', args: [member] });
        calls.push({ address: addr, abi: RotaFiCircleABI, functionName: 'isPenalized', args: [member] });
      }
    }
    return calls;
  }, [infoAndMembersResults, memberCircleAddresses]);

  const { data: perMemberResults, refetch: refetchPerMember } = useReadContracts({
    contracts: perMemberCalls,
    query: { enabled: perMemberCalls.length > 0 },
  });

  // 5. Parse my circles
  const myCircles = useMemo(() => {
    if (!infoAndMembersResults || !memberCircleAddresses?.length) return [];
    const out = [];
    let memberStatusOffset = 0;

    for (let i = 0; i < memberCircleAddresses.length; i++) {
      const idx = i * 5;
      const info = infoAndMembersResults[idx]?.result;
      const members = infoAndMembersResults[idx + 1]?.result || [];
      const history = infoAndMembersResults[idx + 2]?.result || [];
      const isPaused = infoAndMembersResults[idx + 3]?.result || false;
      const currentRoundInfo = infoAndMembersResults[idx + 4]?.result;

      const memberCount = members.length;
      const statuses = perMemberResults
        ? perMemberResults.slice(memberStatusOffset, memberStatusOffset + memberCount * 3)
        : [];
      memberStatusOffset += memberCount * 3;

      const circle = buildCircle(memberCircleAddresses[i], info, members, statuses, address, history, isPaused, currentRoundInfo);
      if (circle) out.push(circle);
    }
    return out;
  }, [infoAndMembersResults, perMemberResults, memberCircleAddresses, address]);

  // 6. Parse open circles from CircleEntry structs — no extra reads needed
  const memberAddrSet = useMemo(
    () => new Set((memberCircleAddresses || []).map(a => a.toLowerCase())),
    [memberCircleAddresses]
  );

  const availableCircles = useMemo(() => {
    if (!openEntries?.length) return [];
    return openEntries
      .filter(e => e?.circleAddress && !memberAddrSet.has(e.circleAddress.toLowerCase()))
      .map(entry => buildCircle(entry.circleAddress, {
        name: entry.name,
        admin: entry.admin,
        memberCap: entry.memberCap,
        memberCount: entry.memberCount,
        depositAmount: entry.depositAmount,
        cycleSeconds: entry.cycleSeconds,
        currentRound: entry.currentRound,
        totalRounds: entry.totalRounds,
        isActive: entry.isActive,
        usdcAddress: entry.usdcAddress,
      }, [], [], address, [], false, null))
      .filter(Boolean);
  }, [openEntries, address, memberAddrSet]);

  return {
    circles: myCircles,
    available: availableCircles,
    refetch: async () => {
      await Promise.all([
        refetchMemberCircles?.(),
        refetchOpenCircles?.(),
        refetchInfo?.(),
        refetchPerMember?.()
      ]);
    },
  };
}
