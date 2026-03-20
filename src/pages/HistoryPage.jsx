import React from 'react';
import { Link } from 'react-router-dom';
import { T, sans } from '../theme.js';
import { Tag } from '../components/ui.jsx';

const $ = (n, sym = '$') => sym + Number(n||0).toLocaleString('en', {minimumFractionDigits:2, maximumFractionDigits:2});
const sh = a => a ? a.slice(0,8)+'...'+a.slice(-4) : '';

export default function HistoryPage({ circles }) {
  const allHistory  = circles.flatMap(c => 
    (c.payoutHistory||[])
      .filter(h => h.recipientName === 'You')
      .map(h => ({ ...h, type:'payout',  circleName:c.name, circleId:c.id, symbol:c.tokenSymbol || 'USDC' }))
  ).sort((a,b) => new Date(b.date)-new Date(a.date));

  const allDeposits = circles.filter(c=>c.hasPaid).map(c => ({ type:'deposit', circleName:c.name, circleId:c.id, amount:c.depositAmount, round:c.currentRound, date:'This cycle', txHash:null, recipientName:null, symbol:c.tokenSymbol || 'USDC' }));
  const rows = [...allHistory, ...allDeposits];

  const totalReceived  = allHistory.reduce((s,h)=>s+h.amount,0);
  const totalDeposited = circles.reduce((s,c)=>s+(c.hasPaid?c.depositAmount:0),0);
  
  // For the summary, we'll use USDC as the default symbol if most are USDC, or just showing 'Value'
  const mainSym = circles[0]?.tokenSymbol || '$';

  return (
    <div style={{ padding:'20px 16px', animation:'fadeUp .3s ease both' }}>
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontFamily:"'Sora',sans-serif", fontSize:20, fontWeight:700, color:T.text, marginBottom:3 }}>Payout History</h1>
        <p style={{ color:T.muted, fontSize:13 }}>Full on-chain record</p>
      </div>

      {/* Summary */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:24 }}>
        {[
          { label:'Received',   value:$(totalReceived, ''),  color:T.ok,  sym: mainSym },
          { label:'Deposited',  value:$(totalDeposited, ''), color:T.pink, sym: mainSym },
          { label:'Payouts',    value:allHistory.length, color:T.text, sym: '' },
        ].map((s,i) => (
          <div key={i} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:10, padding:'14px 12px' }}>
            <div style={{ color:T.muted, fontSize:11, fontWeight:500, marginBottom:6, textTransform:'uppercase', letterSpacing:'.05em' }}>{s.label}</div>
            <div style={{ fontFamily:"'Sora',sans-serif", fontSize:20, fontWeight:700, color:s.color }}>{s.value} <span style={{fontSize:12}}>{s.sym}</span></div>
          </div>
        ))}
      </div>

      {/* Transaction list — card-based on all screen sizes */}
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {rows.length === 0 ? (
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:'40px 16px', textAlign:'center', color:T.muted, fontSize:14 }}>
            No transactions yet.
          </div>
        ) : rows.map((row, i) => (
          <div key={i} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:10, padding:'13px 14px', display:'flex', alignItems:'center', gap:12, transition:'background .1s' }}
            onMouseEnter={e=>e.currentTarget.style.background=T.cardH}
            onMouseLeave={e=>e.currentTarget.style.background=T.card}>

            <div style={{ width:36, height:36, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
              background:row.type==='payout'?T.okBg:T.pinkDim,
              border:`1px solid ${row.type==='payout'?T.okBdr:T.pinkD+'40'}` }}>
              {row.type==='payout'
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.ok} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.pink} strokeWidth="2.5"><path d="M12 5v14M5 12l7-7 7 7"/></svg>}
            </div>

            <div style={{ flex:1, minWidth:0 }}>
              <Link to={`/app/circle/${row.circleId}`}
                style={{ color:T.text, fontSize:13, fontWeight:500, display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', textDecoration:'none' }}
                onMouseEnter={e=>e.currentTarget.style.color=T.pink}
                onMouseLeave={e=>e.currentTarget.style.color=T.text}>
                {row.circleName}
              </Link>
              <div style={{ color:T.muted, fontSize:11, marginTop:2 }}>
                Round {row.round} · {row.date}
                {row.txHash && <span style={{ marginLeft:6, color:T.pink, fontFamily:"'DM Mono',monospace" }}>{sh(row.txHash)}</span>}
              </div>
            </div>

            <div style={{ fontFamily:"'Sora',sans-serif", fontSize:15, fontWeight:700, color:row.type==='payout'?T.ok:T.text, flexShrink:0 }}>
              {row.type==='payout' ? '+' : '-'}{$(row.amount, '')} <span style={{fontSize:11, fontWeight:400}}>{row.symbol || 'USDC'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
