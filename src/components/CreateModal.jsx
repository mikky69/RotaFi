import React, { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { COLORS, cls, cn } from '../theme.js';
import { Spinner, GoldButton } from './ui.jsx';
import { RotaFiFactoryABI, ADDRESSES, PolUSDCABI } from '../contracts/index.js';

const $ = (n, sym = '$') => sym + Number(n || 0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function CreateModal({ onClose, onCreate }) {
  const [tokenType, setTokenType] = useState('USDC'); // 'USDC', 'DOT', 'Custom'
  const [form, setForm] = useState({ name: '', memberCap: '8', depositAmount: '100', frequency: 'Monthly', tokenAddress: ADDRESSES.PolUSDC || '' });
  const [errorInfo, setErrorInfo] = useState('');
  const [txHash, setTxHash] = useState(null);
  const [createdData, setCreatedData] = useState(null);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const { writeContractAsync, isPending: isWriting } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  // ── Token Metadata Fetching ────────────────────────────────────────────────
  const { data: fetchedDecimals } = useReadContract({
    address: form.tokenAddress,
    abi: PolUSDCABI,
    functionName: 'decimals',
    query: { enabled: /^0x[a-fA-F0-9]{40}$/.test(form.tokenAddress) }
  });

  const { data: fetchedSymbol } = useReadContract({
    address: form.tokenAddress,
    abi: PolUSDCABI,
    functionName: 'symbol',
    query: { enabled: /^0x[a-fA-F0-9]{40}$/.test(form.tokenAddress) }
  });

  const decimals = tokenType === 'USDC' ? 6 : (tokenType === 'DOT' ? 10 : (fetchedDecimals || 18));
  const symbol = tokenType === 'USDC' ? 'USDC' : (tokenType === 'DOT' ? 'DOT' : (fetchedSymbol || 'TOKENS'));

  const cap = parseInt(form.memberCap) || 0;
  const amt = parseFloat(form.depositAmount) || 0;
  const pot = cap * amt;
  const valid = form.name.trim().length > 0 && amt > 0 && cap >= 3 && /^0x[a-fA-F0-9]{40}$/.test(form.tokenAddress);

  // Watch for transaction success and trigger completion
  useEffect(() => {
    if (isSuccess && createdData) {
      onCreate(createdData);
    }
  }, [isSuccess, createdData, onCreate]);

  const submit = async () => {
    if (!valid) return;
    setErrorInfo('');
    try {
      const depositAmountScaled = BigInt(Math.floor(amt * (10 ** decimals)));
      const cycleSeconds = form.frequency === 'Weekly' ? 604800 : 2592000;

      console.log(`🚀 [CreateModal] Starting circle creation: "${form.name.trim()}" at Factory ${ADDRESSES.RotaFiFactory}`);
      console.log(`📊 Parameters: cap=${cap}, amount=${depositAmountScaled}, cycle=${cycleSeconds}, token=${form.tokenAddress.trim()}`);
      
      const hash = await writeContractAsync({
        address: ADDRESSES.RotaFiFactory,
        abi: RotaFiFactoryABI,
        functionName: 'createCircle',
        args: [
          form.name.trim(),
          cap,
          depositAmountScaled,
          cycleSeconds,
          form.tokenAddress.trim()
        ],
      });

      console.log(`✅ [CreateModal] Transaction submitted: ${hash}. Waiting for confirmation...`);
      setTxHash(hash);
      setCreatedData({
        name: form.name.trim(),
        memberCap: cap,
        depositAmountDisplay: amt,
        cycleLabel: form.frequency,
        tokenSymbol: symbol,
        txHash: hash
      });
    } catch (err) {
      console.error(err);
      setErrorInfo(err.shortMessage || err.message || 'Transaction failed.');
    }
  };

  const isBusy = isWriting || isConfirming;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9000] p-6"
      onClick={e => e.target === e.currentTarget && !isBusy && onClose()}
      style={{ animation: 'fadeIn .2s ease' }}
    >
      <div
        className={cn(cls.card, 'w-full max-w-[460px] max-h-[90vh] overflow-y-auto')}
        style={{ animation: 'fadeUp .2s ease' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div>
            <div className="font-sora text-lg font-bold text-ink">Create New Circle</div>
            <div className="text-muted text-[13px] mt-0.5">Deploy a Solidity EVM contract</div>
          </div>
          <button
            onClick={onClose} disabled={isBusy}
            className={cn(cls.card, 'w-[30px] h-[30px] rounded-lg text-muted flex items-center justify-center cursor-pointer hover:text-ink transition-colors disabled:cursor-not-allowed')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="px-6 py-6">
          {/* Name */}
          <label className={cls.label}>Circle name</label>
          <input
            disabled={isBusy}
            className={cn(cls.input, 'mb-4')}
            placeholder="e.g. Lagos Tech Circle"
            value={form.name} onChange={set('name')} maxLength={60}
          />

          {/* Members + Frequency */}
          <div className="grid grid-cols-2 gap-3.5 mb-4">
            <div>
              <label className={cls.label}>Members</label>
              <select disabled={isBusy} className={cls.input} value={form.memberCap} onChange={set('memberCap')}>
                {[3,4,5,6,8,10,12].map(n => <option key={n} value={n}>{n} members</option>)}
              </select>
            </div>
            <div>
              <label className={cls.label}>Frequency</label>
              <select disabled={isBusy} className={cls.input} value={form.frequency} onChange={set('frequency')}>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>
          </div>

          {/* Token Type + Amount */}
          <div className="grid grid-cols-2 gap-3.5 mb-4">
            <div>
              <label className={cls.label}>Token Type</label>
              <select disabled={isBusy} className={cls.input} value={tokenType} onChange={e => {
                const type = e.target.value;
                setTokenType(type);
                if (type === 'USDC')     setForm(f => ({ ...f, tokenAddress: ADDRESSES.PolUSDC }));
                else if (type === 'DOT') setForm(f => ({ ...f, tokenAddress: ADDRESSES.PolDOT }));
                else                     setForm(f => ({ ...f, tokenAddress: '' }));
              }}>
                <option value="USDC">PolUSDC (6 dec)</option>
                <option value="DOT">PolDOT (10 dec)</option>
                <option value="Custom">Custom ERC20</option>
              </select>
            </div>
            <div>
              <label className={cls.label}>Amount per cycle ({symbol})</label>
              <input
                disabled={isBusy}
                className={cls.input}
                type="number" min="1" step="0.01" placeholder="100"
                value={form.depositAmount} onChange={set('depositAmount')}
              />
            </div>
          </div>

          {/* Token address */}
          <label className={cls.label}>
            {tokenType === 'Custom' ? 'Token contract address' : `${tokenType} Address`}
          </label>
          <input
            disabled={isBusy || tokenType !== 'Custom'}
            className={cn(cls.input, 'mb-5 font-mono text-[13px]', tokenType !== 'Custom' && 'opacity-60')}
            placeholder="0x..."
            value={form.tokenAddress} onChange={set('tokenAddress')}
          />

          {/* Pot preview */}
          <div
            className="rounded-xl p-4 mb-5"
            style={{ background: 'var(--pink-dim)', borderColor: 'var(--pink-d)50' }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-muted text-[13px]">Total pot per cycle</span>
              <span className="font-sora text-2xl font-bold text-pink">
                {$(pot, '')} <span className="text-sm font-normal">{symbol}</span>
              </span>
            </div>
            <div className="text-muted text-xs">{form.memberCap} members × {$(amt, '')} {symbol} — each member wins once</div>
          </div>

          {errorInfo && (
            <div className="bg-err-bg border border-err-bdr text-err rounded-lg px-3.5 py-2.5 text-[13px] mb-4">
              {errorInfo}
            </div>
          )}

          <div className="flex gap-2.5">
            <button
              onClick={onClose} disabled={isBusy}
              className={cn(cls.btnGhost, 'flex-1 py-3 rounded-lg text-sm')}
            >
              Cancel
            </button>
            <GoldButton onClick={submit} disabled={!valid || isBusy} style={{ flex: 2, padding: '12px' }}>
              {isBusy && <Spinner size={14} color="#fff" />}
              {isWriting ? 'Confirm in Wallet...' : isConfirming ? 'Deploying...' : 'Create Circle'}
            </GoldButton>
          </div>
        </div>
      </div>
    </div>
  );
}
