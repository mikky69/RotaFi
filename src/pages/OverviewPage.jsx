import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { T, sans } from '../theme.js';
import { Metric, Ring, GoldButton, Tag } from '../components/ui.jsx';

const $ = n => '$' + Number(n||0).toLocaleString('en', {minimumFractionDigits:2, maximumFractionDigits:2});
const sh = a => a ? a.slice(0,8)+'...'+a.slice(-4) : '';

function ActivityRow({ item }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 0', borderBottom:`1px solid ${T.border}` }}>
      <div style={{ width:32, height:32, borderRadius:9, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
        background:item.type==='payout' ? T.okBg : T.pinkDim,
        border:`1px solid ${item.type==='payout' ? T.okBdr : T.pinkD+'40'}` }}>
        {item.type==='payout'
          ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.ok} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.pink} strokeWidth="2.5"><path d="M12 5v14M5 12l7-7 7 7"/></svg>}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ color:T.text, fontSize:13, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.label}</div>
        <div style={{ color:T.muted, fontSize:12 }}>{item.date}</div>
      </div>
      <div style={{ textAlign:'right', flexShrink:0 }}>
        <div style={{ fontSize:14, fontWeight:600, color:item.type==='payout'?T.ok:T.text, fontFamily:"'Sora',sans-serif" }}>{item.amount}</div>
      </div>
    </div>
  );
}

function MiniCircleCard({ circle }) {
  const pct = circle.totalRounds > 0 ? circle.currentRound/circle.totalRounds : 0;
  return (
    <Link to={`/app/circle/${circle.id}`} style={{ textDecoration:'none', display:'block' }}>
      <div style={{ background:T.card, border:`1px solid ${circle.hasPaid ? T.border : T.errBdr}`, borderRadius:12, padding:'14px 16px', cursor:'pointer', transition:'all .15s' }}
        onMouseEnter={e=>{ e.currentTarget.style.borderColor=circle.hasPaid?T.borderH:T.err; e.currentTarget.style.background=T.cardH; }}
        onMouseLeave={e=>{ e.currentTarget.style.borderColor=circle.hasPaid?T.border:T.errBdr; e.currentTarget.style.background=T.card; }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
          <div style={{ position:'relative', flexShrink:0 }}>
            <Ring pct={pct} size={42} strokeWidth={3}/>
            <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontSize:10, fontWeight:700, color:T.text }}>{circle.currentRound}</span>
            </div>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:500, color:T.text, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{circle.name}</div>
            <div style={{ fontSize:11, color:T.muted }}>Round {circle.currentRound}/{circle.totalRounds}</div>
          </div>
          {!circle.hasPaid && <Tag color={T.err}>Due</Tag>}
        </div>
        <div style={{ fontFamily:"'Sora',sans-serif", fontSize:20, fontWeight:700, color:T.pink }}>
          {$(circle.pot)} <span style={{ fontSize:12, fontWeight:400, color:T.muted }}>pot</span>
        </div>
      </div>
    </Link>
  );
}

export default function OverviewPage({ account, circles }) {
  const navigate = useNavigate();
  const totalSaved  = circles.reduce((s,c) => s + (c.hasPaid ? c.depositAmount : 0), 0);
  const pending     = circles.filter(c => !c.hasPaid).length;
  const totalEarned = circles.flatMap(c=>c.payoutHistory||[]).reduce((s,h)=>s+h.amount, 0);
  const recentAct   = [
    ...circles.flatMap(c=>(c.payoutHistory||[]).map(h=>({ type:'payout', label:`Received from ${c.name}`, amount:$(h.amount), date:h.date }))),
    ...circles.filter(c=>c.hasPaid).map(c=>({ type:'deposit', label:`Deposited to ${c.name}`, amount:`-${$(c.depositAmount)}`, date:'This cycle' })),
  ].slice(0, 6);

  return (
    <div style={{ padding:'20px 16px', maxWidth:960, margin:'0 auto', animation:'fadeUp .3s ease both' }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontFamily:"'Sora',sans-serif", fontSize:20, fontWeight:700, color:T.text, marginBottom:3 }}>Overview</h1>
        <p style={{ color:T.muted, fontSize:13 }}>Welcome back, <span style={{ color:T.text }}>{account?.meta?.name || sh(account?.address)}</span></p>
      </div>

      {/* Metrics — 2 col on mobile, 4 on desktop */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginBottom:24 }}>
        <Metric label="Active Circles"    value={circles.length} />
        <Metric label="Deposited"         value={$(totalSaved)}  accent={T.pink} />
        <Metric label="Total Received"    value={$(totalEarned)} accent={T.ok} />
        <Metric label="Pending Deposits"  value={pending}         accent={pending>0 ? T.err : T.text} />
      </div>

      {/* Two-column layout on tablet+, stacked on mobile */}
      <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr)', gap:20 }}>
        {/* Circles */}
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <h2 style={{ fontFamily:"'Sora',sans-serif", fontSize:15, fontWeight:600, color:T.text }}>My Circles</h2>
            <Link to="/app/circles" style={{ color:T.pink, fontSize:13, fontFamily:sans }}>View all</Link>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {circles.length === 0 ? (
              <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:'24px 16px', textAlign:'center' }}>
                <div style={{ color:T.muted, fontSize:13, marginBottom:12 }}>No active circles</div>
                <GoldButton onClick={()=>navigate('/app/join')} style={{ fontSize:13, padding:'8px 16px', borderRadius:8, margin:'0 auto' }}>
                  Browse circles
                </GoldButton>
              </div>
            ) : circles.slice(0,3).map(c => <MiniCircleCard key={c.id} circle={c} />)}
          </div>
        </div>

        {/* Activity */}
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <h2 style={{ fontFamily:"'Sora',sans-serif", fontSize:15, fontWeight:600, color:T.text }}>Recent Activity</h2>
            <Link to="/app/history" style={{ color:T.pink, fontSize:13, fontFamily:sans }}>View all</Link>
          </div>
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:'4px 16px' }}>
            {recentAct.length === 0
              ? <div style={{ padding:'28px 0', textAlign:'center', color:T.muted, fontSize:13 }}>No activity yet</div>
              : recentAct.map((a,i) => <ActivityRow key={i} item={a} />)
            }
          </div>
        </div>
      </div>

      {/* Network bar */}
      <div style={{ marginTop:20, background:T.card, border:`1px solid ${T.border}`, borderRadius:10, padding:'11px 16px', display:'flex', alignItems:'center', gap:14, flexWrap:'wrap', fontSize:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:T.ok, boxShadow:`0 0 5px ${T.ok}` }}/>
          <span style={{ color:T.ok, fontWeight:500 }}>Connected</span>
        </div>
        <span style={{ color:T.muted }}>Polkadot Testnet</span>
        <span style={{ color:T.muted, fontFamily:"'DM Mono',monospace", fontSize:11 }}>{sh(account?.address)}</span>
        <span style={{ color:T.muted }}>sol <span style={{ color:T.pink }}>v0.8</span></span>
      </div>
    </div>
  );
}
