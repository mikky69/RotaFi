import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { COLORS, cls, cn } from '../theme.js';
import { Ring, Tag, GoldButton, Empty } from '../components/ui.jsx';

const $ = (n, sym = '$') => sym + Number(n||0).toLocaleString('en', {minimumFractionDigits:2, maximumFractionDigits:2});


function CircleCard({ circle }) {
  const pct  = circle.totalRounds > 0 ? circle.currentRound/circle.totalRounds : 0;
  const paid = circle.roster?.filter(m=>m.hasPaid).length || 0;
  
  return (
    <Link to={`/app/circle/${circle.id}`} className="block">
      <div
        className={cn(cls.card, "p-4 cursor-pointer transition-all")}
        style={{ borderColor: !circle.hasPaid ? COLORS.errBdr : undefined }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--card-h)'; e.currentTarget.style.borderColor = !circle.hasPaid ? COLORS.err : 'var(--border-h)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--card)'; e.currentTarget.style.borderColor = !circle.hasPaid ? COLORS.errBdr : 'var(--border)'; }}
      >
        <div className="flex items-start gap-3 mb-3">
          <div className="relative shrink-0">
            <Ring pct={pct} size={48} strokeWidth={3.5}/>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[11px] font-bold text-ink leading-none">{circle.currentRound}</span>
              <span className="text-[8px] text-muted">/{circle.totalRounds}</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-sora text-[14px] font-semibold text-ink truncate mb-1">{circle.name}</div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {circle.isAdmin && <Tag color={COLORS.pink}>Admin</Tag>}
              <span className="text-muted text-xs">{circle.cycleLabel} · {$(circle.depositAmount,'')} {circle.tokenSymbol||'USDC'}</span>
            </div>
          </div>
          <div className="shrink-0">
            {!circle.hasPaid ? <Tag color={COLORS.err}>Due</Tag> : <Tag color={COLORS.ok}>Paid</Tag>}
          </div>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-muted text-[11px] mb-1">Pot ({circle.tokenSymbol||'USDC'})</div>
            <div className="font-sora text-lg font-bold text-pink">{$(circle.pot,'')}</div>
          </div>
          <div className="text-center">
            <div className="text-muted text-[11px] mb-1">Deposits</div>
            <div className="text-[13px] font-medium text-ink mb-1.5">{paid}/{circle.memberCount}</div>
            <div className="h-[3px] w-12 bg-border rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all"
                style={{ width: `${(paid/circle.memberCount)*100}%`, background: paid===circle.memberCount ? COLORS.ok : COLORS.pink }} />
            </div>
          </div>
          <div className="text-right">
            <div className="text-muted text-[11px] mb-1">My turn</div>
            <div className="text-[13px] text-ink">{circle.myTurnLabel}</div>
            <div className="text-[11px] text-muted">Pos. #{circle.myPosition}</div>
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
    <div className="p-4 sm:p-8" style={{ animation: 'fadeUp .3s ease both' }}>
      <div className="flex justify-between items-start mb-5">
        <div>
          <h1 className="font-sora text-xl font-bold text-ink mb-1">My Circles</h1>
          <p className="text-muted text-[13px]">
            {circles.length} circle{circles.length!==1?'s':''}
            {pending > 0 && <span className="text-err ml-2">{pending} due</span>}
          </p>
        </div>
        <GoldButton onClick={onCreateCircle} style={{ padding: '9px 16px', fontSize: 13 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          New
        </GoldButton>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-card border border-border rounded-xl p-1 w-fit mb-4">
        {[['all','All'],['pending','Due'],['active','Paid']].map(([val,lbl]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-[13px] font-medium cursor-pointer transition-all',
              filter===val
                ? 'text-pink font-semibold'
                : 'text-muted hover:text-ink'
            )}
            style={filter===val ? { background:'var(--pink-dim)', borderColor:'var(--pink-d)50' } : undefined}
          >
            {lbl}
            {val==='pending' && pending > 0 && (
              <span className="ml-1.5 bg-err text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{pending}</span>
            )}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2.5">
        {filtered.length === 0
          ? <Empty
              message={filter==='all' ? 'No circles yet. Create or join one.' : 'Nothing here.'}
              cta={filter==='all'
                ? <GoldButton onClick={onCreateCircle} style={{ fontSize:13, padding:'9px 18px', margin:'0 auto' }}>Create your first circle</GoldButton>
                : null}
            />
          : filtered.map(c => <CircleCard key={c.id} circle={c} />)
        }
      </div>
    </div>
  );
}
