import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { T, sans } from '../theme.js';
import { Ring, Tag, GoldButton, Empty } from '../components/ui.jsx';

const $ = (n, sym = '$') => sym + Number(n||0).toLocaleString('en', {minimumFractionDigits:2, maximumFractionDigits:2});

// Card view for mobile / compact display
function CircleCard({ circle }) {
  const pct  = circle.totalRounds > 0 ? circle.currentRound/circle.totalRounds : 0;
  const paid = circle.roster?.filter(m=>m.hasPaid).length || 0;
  return (
    <Link to={`/app/circle/${circle.id}`} style={{ textDecoration:'none', display:'block' }}>
      <div style={{ background:T.card, border:`1px solid ${!circle.hasPaid ? T.errBdr : T.border}`, borderRadius:12, padding:'16px', transition:'all .15s' }}
        onMouseEnter={e=>{ e.currentTarget.style.background=T.cardH; e.currentTarget.style.borderColor=!circle.hasPaid?T.err:T.borderH; }}
        onMouseLeave={e=>{ e.currentTarget.style.background=T.card; e.currentTarget.style.borderColor=!circle.hasPaid?T.errBdr:T.border; }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:12 }}>
          <div style={{ position:'relative', flexShrink:0 }}>
            <Ring pct={pct} size={48} strokeWidth={3.5}/>
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontSize:11, fontWeight:700, color:T.text, lineHeight:1 }}>{circle.currentRound}</span>
              <span style={{ fontSize:8, color:T.muted }}>/{circle.totalRounds}</span>
            </div>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:"'Sora',sans-serif", fontSize:14, fontWeight:600, color:T.text, marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{circle.name}</div>
            <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
              {circle.isAdmin && <Tag color={T.pink}>Admin</Tag>}
              <span style={{ color:T.muted, fontSize:12 }}>{circle.cycleLabel} · {$(circle.depositAmount, '')} {circle.tokenSymbol || 'USDC'}</span>
            </div>
          </div>
          <div style={{ flexShrink:0 }}>
            {!circle.hasPaid ? <Tag color={T.err}>Due</Tag> : <Tag color={T.ok}>Paid</Tag>}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ color:T.muted, fontSize:11, marginBottom:3 }}>Pot ({circle.tokenSymbol || 'USDC'})</div>
            <div style={{ fontFamily:"'Sora',sans-serif", fontSize:18, fontWeight:700, color:T.pink }}>{$(circle.pot, '')}</div>
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ color:T.muted, fontSize:11, marginBottom:3 }}>Deposits</div>
            <div style={{ fontSize:13, fontWeight:500, color:T.text }}>{paid}/{circle.memberCount}</div>
            <div style={{ marginTop:4, height:3, background:T.border, borderRadius:3, width:48 }}>
              <div style={{ height:'100%', width:`${(paid/circle.memberCount)*100}%`, background:paid===circle.memberCount?T.ok:T.pink, borderRadius:3 }}/>
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ color:T.muted, fontSize:11, marginBottom:3 }}>My turn</div>
            <div style={{ fontSize:13, color:T.text }}>{circle.myTurnLabel}</div>
            <div style={{ fontSize:11, color:T.muted }}>Pos. #{circle.myPosition}</div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function MyCirclesPage({ circles, onCreateCircle }) {
  const [filter, setFilter] = useState('all');
  const pending  = circles.filter(c => !c.hasPaid).length;
  const filtered = circles.filter(c => {
    if (filter==='pending') return !c.hasPaid;
    if (filter==='active')  return c.hasPaid;
    return true;
  });

  return (
    <div style={{ padding:'20px 16px', animation:'fadeUp .3s ease both' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
        <div>
          <h1 style={{ fontFamily:"'Sora',sans-serif", fontSize:20, fontWeight:700, color:T.text, marginBottom:3 }}>My Circles</h1>
          <p style={{ color:T.muted, fontSize:13 }}>
            {circles.length} circle{circles.length!==1?'s':''}
            {pending > 0 && <span style={{ color:T.err, marginLeft:8 }}>{pending} due</span>}
          </p>
        </div>
        <GoldButton onClick={onCreateCircle} style={{ padding:'9px 16px', fontSize:13, borderRadius:8 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          New
        </GoldButton>
      </div>

      {/* Filter */}
      <div style={{ display:'flex', gap:4, marginBottom:16, background:T.card, border:`1px solid ${T.border}`, borderRadius:9, padding:4, width:'fit-content' }}>
        {[['all','All'],['pending','Due'],['active','Paid']].map(([val,lbl]) => (
          <button key={val} onClick={() => setFilter(val)}
            style={{ padding:'6px 14px', borderRadius:6, fontSize:13, fontWeight:500, fontFamily:sans, cursor:'pointer', transition:'all .15s',
              background: filter===val ? T.pinkDim : 'transparent',
              color:      filter===val ? T.pink : T.muted,
              border:     filter===val ? `1px solid ${T.pinkD}50` : '1px solid transparent' }}>
            {lbl}
            {val==='pending' && pending>0 && (
              <span style={{ marginLeft:5, background:T.err, color:'#fff', fontSize:10, fontWeight:700, padding:'1px 5px', borderRadius:10 }}>{pending}</span>
            )}
          </button>
        ))}
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {filtered.length === 0
          ? <Empty message={filter==='all' ? 'No circles yet. Create or join one.' : 'Nothing here.'} cta={filter==='all'
              ? <GoldButton onClick={onCreateCircle} style={{ fontSize:13, padding:'9px 18px', margin:'0 auto' }}>Create your first circle</GoldButton>
              : null} />
          : filtered.map(c => <CircleCard key={c.id} circle={c} />)
        }
      </div>
    </div>
  );
}
