import React, { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { T, sans, inputStyle, labelStyle } from '../theme.js';
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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000, padding: 24 }}
      onClick={e => e.target === e.currentTarget && !isBusy && onClose()}>
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, width: '100%', maxWidth: 460, animation: 'fadeUp .2s ease', maxHeight: '90vh', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ padding: '20px 26px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 700, color: T.text }}>Create New Circle</div>
            <div style={{ color: T.muted, fontSize: 13, marginTop: 2 }}>Deploy a Solidity EVM contract</div>
          </div>
          <button onClick={onClose} disabled={isBusy} style={{ width: 30, height: 30, borderRadius: 7, border: `1px solid ${T.border}`, background: T.card, color: T.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isBusy ? 'not-allowed' : 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div style={{ padding: '24px 26px' }}>
          <label style={labelStyle}>Circle name</label>
          <input disabled={isBusy} style={{ ...inputStyle, marginBottom: 18 }} placeholder="e.g. Lagos Tech Circle" value={form.name} onChange={set('name')} maxLength={60} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
            <div>
              <label style={labelStyle}>Members</label>
              <select disabled={isBusy} style={inputStyle} value={form.memberCap} onChange={set('memberCap')}>
                {[3, 4, 5, 6, 8, 10, 12].map(n => <option key={n} value={n}>{n} members</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Frequency</label>
              <select disabled={isBusy} style={inputStyle} value={form.frequency} onChange={set('frequency')}>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
            <div>
              <label style={labelStyle}>Token Type</label>
              <select disabled={isBusy} style={inputStyle} value={tokenType} onChange={e => {
                const type = e.target.value;
                setTokenType(type);
                if (type === 'USDC') setForm(f => ({ ...f, tokenAddress: ADDRESSES.PolUSDC }));
                else if (type === 'DOT') setForm(f => ({ ...f, tokenAddress: ADDRESSES.PolDOT }));
                else setForm(f => ({ ...f, tokenAddress: '' }));
              }}>
                <option value="USDC">PolUSDC (6 dec)</option>
                <option value="DOT">PolDOT (10 dec)</option>
                <option value="Custom">Custom ERC20</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Amount per cycle ({symbol})</label>
              <input disabled={isBusy} style={inputStyle} type="number" min="1" step="0.01" placeholder="100" value={form.depositAmount} onChange={set('depositAmount')} />
            </div>
          </div>

          <label style={labelStyle}>{tokenType === 'Custom' ? 'Token contract address' : `${tokenType} Address`}</label>
          <input disabled={isBusy || tokenType !== 'Custom'} style={{ ...inputStyle, marginBottom: 20, fontFamily: "'DM Mono',monospace", fontSize: 13, opacity: tokenType !== 'Custom' ? 0.6 : 1 }} placeholder="0x..." value={form.tokenAddress} onChange={set('tokenAddress')} />

          {/* Pot preview */}
          <div style={{ background: T.pinkDim, border: `1px solid ${T.pinkD}50`, borderRadius: 10, padding: '16px 18px', marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ color: T.muted, fontSize: 13 }}>Total pot per cycle</span>
              <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 28, fontWeight: 700, color: T.pink }}>{$(pot, '')} <span style={{fontSize: 14}}>{symbol}</span></span>
            </div>
            <div style={{ color: T.muted, fontSize: 12 }}>{form.memberCap} members × {$(amt, '')} {symbol} — each member wins once</div>
          </div>

          {errorInfo && <div style={{ background: T.errBg, border: `1px solid ${T.errBdr}`, color: T.err, borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>{errorInfo}</div>}

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} disabled={isBusy} style={{ flex: 1, padding: 12, borderRadius: 8, border: `1px solid ${T.border}`, color: T.muted, fontSize: 14, background: 'none', cursor: isBusy ? 'not-allowed' : 'pointer', fontFamily: sans, transition: 'background .15s' }}
              onMouseEnter={e => !isBusy && (e.currentTarget.style.background = T.card)}
              onMouseLeave={e => !isBusy && (e.currentTarget.style.background = 'none')}>
              Cancel
            </button>
            <GoldButton onClick={submit} disabled={!valid || isBusy} style={{ flex: 2, padding: 12, fontSize: 14 }}>
              {isBusy && <Spinner size={14} color="#fff" />}
              {isWriting ? 'Confirm in Wallet...' : isConfirming ? 'Deploying...' : 'Create Circle'}
            </GoldButton>
          </div>
        </div>
      </div>
    </div>
  );
}
