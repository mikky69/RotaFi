import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { T, sans } from '../theme.js';
import { Ring, Tag, GoldButton, Spinner, Avatar } from '../components/ui.jsx';

const $ = n => '$' + Number(n||0).toLocaleString('en', {minimumFractionDigits:2, maximumFractionDigits:2});
const sh = a => a ? a.slice(0,8)+'...'+a.slice(-4) : '';

export default function CircleDetailPage({ circle, isMember, connected, onBack, onDeposit, onTriggerPayout, onJoin }) {
  const navigate = useNavigate();
  const [depositing, setDepositing] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [joining,    setJoining]    = useState(false);
  const [addrCopied, setAddrCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [tab, setTab] = useState('rotation');

  const pct          = circle.totalRounds > 0 ? circle.currentRound/circle.totalRounds : 0;
  const paid         = circle.roster?.filter(m=>m.hasPaid).length || 0;
  const allDeposited = paid === circle.memberCount;
  const recipient    = circle.roster?.find(m => m.position === circle.currentRound);
  const spots        = circle.memberCap - circle.memberCount;

  const doDeposit = async () => { setDepositing(true); try { await onDeposit(circle.id); } finally { setDepositing(false); } };
  const doTrigger = async () => { setTriggering(true); try { await onTriggerPayout(circle.id); } finally { setTriggering(false); } };
  const doJoin    = async () => { setJoining(true);    try { await onJoin(circle.id); } finally { setJoining(false); } };

  const copyAddr = () => { navigator.clipboard?.writeText(circle.contractAddress||''); setAddrCopied(true); setTimeout(()=>setAddrCopied(false),2000); };
  const copyLink = () => { navigator.clipboard?.writeText(window.location.href); setLinkCopied(true); setTimeout(()=>setLinkCopied(false),2500); };

  return (
    <div style={{ animation:'fadeUp .3s ease both', minHeight:'100%' }}>

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div style={{ background:T.surface, borderBottom:`1px solid ${T.border}`, padding:'12px 16px', display:'flex', alignItems:'center', gap:10, position:'sticky', top:0, zIndex:10 }}>
        <button onClick={onBack}
          style={{ width:32, height:32, borderRadius:8, border:`1px solid ${T.border}`, background:T.card, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:T.muted, flexShrink:0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <h1 style={{ fontFamily:"'Sora',sans-serif", fontSize:15, fontWeight:700, color:T.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{circle.name}</h1>
            {circle.isAdmin && <Tag color={T.pink}>Admin</Tag>}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:2 }}>
            <span style={{ color:T.muted, fontSize:11, fontFamily:"'DM Mono',monospace" }}>{sh(circle.contractAddress)}</span>
            <button onClick={copyAddr} style={{ color:addrCopied?T.ok:T.muted, cursor:'pointer', display:'flex', flexShrink:0 }}>
              {addrCopied ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>}
            </button>
          </div>
        </div>
        <button onClick={copyLink}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 12px', borderRadius:7, border:`1px solid ${linkCopied?T.okBdr:T.border}`, background:linkCopied?T.okBg:T.card, color:linkCopied?T.ok:T.muted, fontSize:12, fontFamily:sans, cursor:'pointer', transition:'all .2s', flexShrink:0 }}>
          {linkCopied
            ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>}
          {linkCopied ? 'Copied!' : 'Share'}
        </button>
      </div>

      <div style={{ padding:'16px 16px 60px' }}>

        {/* ── Stats hero ──────────────────────────────────────────────── */}
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:'18px 16px', marginBottom:14 }}>
          <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:16 }}>
            <div style={{ position:'relative', flexShrink:0 }}>
              <Ring pct={pct} size={88} strokeWidth={6}/>
              <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontFamily:"'Sora',sans-serif", fontSize:18, fontWeight:700, color:T.text, lineHeight:1 }}>{circle.currentRound}</span>
                <span style={{ fontSize:11, color:T.muted, marginTop:2 }}>of {circle.totalRounds}</span>
              </div>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ color:T.muted, fontSize:11, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6 }}>Pot this cycle</div>
              <div style={{ fontFamily:"'Sora',sans-serif", fontSize:30, fontWeight:700, color:T.pink, lineHeight:1 }}>{$(circle.pot)}</div>
              <div style={{ color:T.muted, fontSize:12, marginTop:6 }}>{$(circle.depositAmount)}/member · {circle.memberCount} members</div>
              {recipient && <div style={{ color:T.muted, fontSize:12, marginTop:4 }}>Receiving: <span style={{ color:T.text }}>{recipient.name}</span></div>}
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
            {[
              { label:'Members paid', val:`${paid}/${circle.memberCount}`, col:allDeposited?T.ok:T.text },
              { label:isMember?'My position':'Spots left', val:isMember?`#${circle.myPosition}`:`${spots}`, col:T.text },
              { label:isMember?'My turn':'Frequency', val:isMember?circle.myTurnLabel:circle.cycleLabel, col:T.text },
            ].map((s,i) => (
              <div key={i} style={{ background:T.surface, borderRadius:9, padding:'10px 12px', border:`1px solid ${T.border}` }}>
                <div style={{ color:T.muted, fontSize:10, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:5 }}>{s.label}</div>
                <div style={{ fontFamily:"'Sora',sans-serif", fontSize:15, fontWeight:700, color:s.col }}>{s.val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}
        {isMember && !circle.hasPaid && (
          <div style={{ background:T.errBg, border:`1px solid ${T.errBdr}`, borderRadius:10, padding:'13px 16px', marginBottom:12, display:'flex', alignItems:'flex-start', gap:12 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.err} strokeWidth="2" style={{ flexShrink:0, marginTop:1 }}><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
            <div style={{ flex:1 }}>
              <div style={{ color:T.text, fontWeight:500, fontSize:14, marginBottom:3 }}>Deposit required</div>
              <div style={{ color:T.muted, fontSize:13, marginBottom:10 }}>{$(circle.depositAmount)} USDC due for round {circle.currentRound}</div>
              <GoldButton onClick={doDeposit} disabled={depositing} style={{ padding:'9px 16px', fontSize:13 }}>
                {depositing && <Spinner size={13} color="#fff"/>}
                {depositing ? 'Confirming...' : 'Deposit now'}
              </GoldButton>
            </div>
          </div>
        )}

        {circle.isAdmin && allDeposited && circle.hasPaid && (
          <div style={{ background:T.okBg, border:`1px solid ${T.okBdr}`, borderRadius:10, padding:'13px 16px', marginBottom:12, display:'flex', alignItems:'flex-start', gap:12 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.ok} strokeWidth="2" style={{ flexShrink:0, marginTop:1 }}><polyline points="20 6 9 17 4 12"/></svg>
            <div style={{ flex:1 }}>
              <div style={{ color:T.text, fontWeight:500, fontSize:14, marginBottom:3 }}>All deposits received</div>
              <div style={{ color:T.muted, fontSize:13, marginBottom:10 }}>Ready to pay {$(circle.pot)} to {recipient?.name}.</div>
              <GoldButton onClick={doTrigger} disabled={triggering} style={{ padding:'9px 16px', fontSize:13 }}>
                {triggering && <Spinner size={13} color="#fff"/>}
                {triggering ? 'Sending...' : 'Trigger Payout'}
              </GoldButton>
            </div>
          </div>
        )}

        {!isMember && spots > 0 && (
          <div style={{ background:T.pinkDim, border:`1px solid ${T.pinkD}50`, borderRadius:10, padding:'13px 16px', marginBottom:12, display:'flex', alignItems:'flex-start', gap:12 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.pink} strokeWidth="2" style={{ flexShrink:0, marginTop:1 }}><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
            <div style={{ flex:1 }}>
              <div style={{ color:T.text, fontWeight:500, fontSize:14, marginBottom:3 }}>{spots} spot{spots!==1?'s':''} open</div>
              <div style={{ color:T.muted, fontSize:13, marginBottom:10 }}>
                {connected ? `Approve ${$(circle.depositAmount)} USDC spend on the PSP22 contract before joining.` : 'Connect your wallet to join.'}
              </div>
              {connected ? (
                <GoldButton onClick={doJoin} disabled={joining} style={{ padding:'9px 16px', fontSize:13 }}>
                  {joining && <Spinner size={13} color="#fff"/>}
                  {joining ? 'Joining...' : 'Join Circle'}
                </GoldButton>
              ) : (
                <button onClick={()=>navigate('/')} style={{ padding:'9px 16px', fontSize:13, borderRadius:8, background:T.pink, color:'#fff', border:'none', fontFamily:sans, cursor:'pointer' }}>
                  Connect wallet
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Tabs ────────────────────────────────────────────────────── */}
        <div style={{ display:'flex', gap:3, background:T.card, border:`1px solid ${T.border}`, borderRadius:9, padding:4, marginBottom:16 }}>
          {[['rotation','Rotation'],['history','History']].map(([val,lbl]) => (
            <button key={val} onClick={()=>setTab(val)} style={{ flex:1, padding:'7px 12px', borderRadius:6, fontSize:13, fontWeight:500, fontFamily:sans, cursor:'pointer', transition:'all .15s',
              background: tab===val ? T.pinkDim : 'transparent',
              color:      tab===val ? T.pink : T.muted,
              border:     tab===val ? `1px solid ${T.pinkD}50` : '1px solid transparent' }}>
              {lbl}
            </button>
          ))}
        </div>

        {/* ── Rotation ─────────────────────────────────────────────────── */}
        {tab==='rotation' && (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {(circle.roster||[]).map((member, idx) => {
              const isCur = member.position === circle.currentRound;
              return (
                <div key={idx} style={{ background: isCur ? T.pinkDim : T.card, border:`1px solid ${isCur ? T.pinkD+'50' : T.border}`, borderRadius:10, padding:'12px 14px', display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:26, height:26, borderRadius:'50%', background:isCur?T.pink:T.surface, border:`1px solid ${isCur?T.pink:T.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:isCur?'#fff':T.muted, flexShrink:0 }}>
                    {member.position}
                  </div>
                  <Avatar name={member.name} size={28} active={member.isMe}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ color:member.isMe?T.pink:T.text, fontSize:13, fontWeight:member.isMe?600:400, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {member.name}{member.isMe?' (you)':''}
                    </div>
                    {isCur && <div style={{ fontSize:11, color:T.pink, fontWeight:500 }}>Receiving now</div>}
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0 }}>
                    {member.hasPaid ? <Tag color={T.ok}>Paid</Tag> : <Tag color={T.muted}>Pending</Tag>}
                    {member.hasReceived && <Tag color={T.ok}>Received</Tag>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── History ──────────────────────────────────────────────────── */}
        {tab==='history' && (
          <div>
            {(circle.payoutHistory||[]).length === 0 ? (
              <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:'36px 16px', textAlign:'center', color:T.muted, fontSize:14 }}>
                No payouts yet.
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {circle.payoutHistory.map((h,i) => (
                  <div key={i} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:10, padding:'13px 16px', display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:34, height:34, borderRadius:10, background:T.okBg, border:`1px solid ${T.okBdr}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.ok} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ color:T.text, fontSize:13, fontWeight:500 }}>Round {h.round} → {h.recipientName}</div>
                      <div style={{ color:T.muted, fontSize:11, marginTop:2 }}>{h.date} · {sh(h.txHash)}</div>
                    </div>
                    <div style={{ fontFamily:"'Sora',sans-serif", fontSize:16, fontWeight:700, color:T.ok, flexShrink:0 }}>{$(h.amount)}</div>
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
