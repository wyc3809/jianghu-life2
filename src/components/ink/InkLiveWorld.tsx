import { motionReduced } from '../../ui/inkMotion';
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import type { OnlinePeer, OnlineSnapshot } from '@interfaces/online';
import type { LiveMessages, LiveWatch, LiveView } from '@interfaces/live';
import { liveCommand, liveRequest, watchLiveUpdates } from '../../cloud/live';
import { OnlineApiError } from '../../online/client';
import { useLifeStore } from '../../store/lifeStore';
import { AppearanceBadge } from './InkAppearance';
import { InkModal } from './InkModal';
import { usePrefersReducedMotion } from '../../hooks/useStillMode';
import './live-world.css';
const Battle=lazy(()=>import('./InkAutoBattle').then(m=>({default:m.InkAutoBattle})));

/** 同一人物、同一排名；畫面只發指令，不自行算傷害／保護或派獎。 */
export default function InkLiveWorld({onBack}:{onBack:()=>void}){
 const name=useLifeStore(s=>s.state?.character.name??'江湖旅人');
 const [snapshot,setSnapshot]=useState<OnlineSnapshot|null>(null),[chat,setChat]=useState<LiveMessages>({messages:[],blocked:[]});
 const [target,setTarget]=useState(''),[draft,setDraft]=useState(''),[error,setError]=useState(''),[networkError,setNetworkError]=useState(''),[notice,setNotice]=useState('');
 const [pending,setPending]=useState(false),[ready,setReady]=useState(false),[connected,setConnected]=useState(false);
 const [confirm,setConfirm]=useState<OnlinePeer|null>(null),[watch,setWatch]=useState<LiveWatch|null>(null),[now,setNow]=useState(Date.now());
 const busy=useRef(false),refreshing=useRef(false),refreshAgain=useRef(false),alive=useRef(true),targetRef=useRef(target),epoch=useRef(0),offset=useRef(0);
 const joinedRef=useRef(false),renewRequested=useRef(false);
 const watchId=useRef<string|null>(null),dismissed=useRef(new Set<string>()),logRef=useRef<HTMLDivElement>(null),inputRef=useRef<HTMLTextAreaElement>(null);
 const reduced=usePrefersReducedMotion();targetRef.current=target;
 const me=snapshot?.me,joined=Boolean(me?.live?.joined);
 joinedRef.current=joined;
 const refresh=useCallback(async(renew=false)=>{
  if(renew)renewRequested.current=true;
  if(document.hidden)return;
  if(refreshing.current){refreshAgain.current=true;return;}
  refreshing.current=true;
  try{
   do{
    refreshAgain.current=false;const sent=Date.now(),channel=targetRef.current,generation=epoch.current;
    const renewNow=renewRequested.current;renewRequested.current=false;
    const view=joinedRef.current?await liveRequest<LiveView>('view',{...channel?{target:channel}:{},...renewNow?{renew:true}:{}}):null;
    const s=view?.snapshot??await liveRequest<OnlineSnapshot>('world');if(!alive.current)break;
    if(generation!==epoch.current){refreshAgain.current=true;continue;}
    joinedRef.current=Boolean(s.me.live?.joined);
    offset.current=s.serverNow-(sent+Date.now())/2;setSnapshot(previous=>!previous||s.revision>=previous.revision?s:previous);setConnected(true);setReady(true);setNetworkError('');
    if(s.me.live?.joined){
     const messages=view?.chat??await liveRequest<LiveMessages>('messages',channel?{target:channel}:{});
     if(alive.current&&generation===epoch.current)setChat(messages);
     const current=s.liveBattles?.find(b=>b.attacker===s.me.id||b.defender===s.me.id);
     if(current&&!dismissed.current.has(current.id)&&watchId.current!==current.id){
      watchId.current=current.id;
      const value=await liveRequest<LiveWatch>('watch',{id:current.id});if(alive.current)setWatch(value);
     }
    }
   }while(refreshAgain.current&&alive.current);
  }catch(e){if(alive.current){setReady(true);setConnected(false);if(!(e instanceof Error&&'status'in e&&e.status===404))setNetworkError(e instanceof Error?e.message:'同遊暫時未能連線。');}}
  finally{refreshing.current=false;}
 },[]);
 useEffect(()=>{alive.current=true;void refresh();const timer=setInterval(()=>setNow(Date.now()+offset.current),1000);return()=>{alive.current=false;clearInterval(timer);};},[refresh]);
 useEffect(()=>{
  if(!joined)return;
  let disposed=false,stop=()=>{};
  void watchLiveUpdates(()=>void refresh()).then(clean=>{if(disposed)clean();else stop=clean;}).catch(()=>{});
  const heartbeat=()=>{if(!document.hidden)void refresh(true);};
  const timer=setInterval(heartbeat,5000),visibility=()=>{if(!document.hidden)heartbeat();};
  document.addEventListener('visibilitychange',visibility);window.addEventListener('online',heartbeat);
  return()=>{disposed=true;stop();clearInterval(timer);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('online',heartbeat);void liveRequest('leave').catch(()=>{});};
 },[joined,refresh]);
 useEffect(()=>{epoch.current++;setChat(previous=>({messages:[],blocked:previous.blocked}));if(joined)void refresh();},[target,joined,refresh]);
 useEffect(()=>{const el=logRef.current;if(el&&el.scrollHeight-el.scrollTop-el.clientHeight<180)el.scrollTop=el.scrollHeight;},[chat.messages]);
 const run=async(fn:()=>Promise<void>)=>{
  if(busy.current)return;busy.current=true;setPending(true);setError('');setNotice('');
  try{await fn();await refresh();}catch(e){if(alive.current){
   if(e instanceof OnlineApiError&&(!e.status||e.status>=500)){setNetworkError(e.message);setConnected(false);}
   else setError(e instanceof Error?e.message:'暫時未能處理。');
  }}
  finally{busy.current=false;if(alive.current)setPending(false);}
 };
 const peers=snapshot?.peers.filter(p=>p.live?.joined)??[];
 const protection=me?Math.max(0,Math.ceil((me.protectedUntil-now)/1000)):0;
 const closeWatch=()=>{if(watch)dismissed.current.add(watch.id);setWatch(null);watchId.current=null;void refresh();};
 return <section className="ink-panel ink-online ink-live" aria-label="同遊江湖">
  <button type="button" className="ink-jianghu-back" onClick={onBack}>‹ 返回江湖風雲</button>
  <header className="live-heading"><h2>同遊江湖</h2>{joined&&<small role="status">{connected?'已連線':'重新連線中'}</small>}</header>
  <div className="live-scene"><div><p>千燈鎮 · 水榭茶樓</p><small>{joined?`${peers.length}位俠客參與 · ${peers.filter(p=>p.online).length}人在線`:'同場對話 · 交鋒觀戰'}</small></div></div>
  {(error||networkError)&&<p role="alert" className="live-feedback">{error||networkError} <button type="button" onClick={()=>void refresh()}>重新連線</button></p>}
  {notice&&<p role="status" className="live-feedback">{notice}</p>}
  {!joined?<div className="live-intro"><p>以本世人物及對戰配搭加入。所有參與者均可互相交手，離線仍會自動應戰；主動退出後停止參與。</p><p>戰敗後保護30秒，主動出擊即解除。交手只論名次，不受傷、不死亡、不掉裝。</p><button type="button" className="ink-btn ink-btn--primary" disabled={pending||!ready} onClick={()=>void run(async()=>{const next=await liveRequest<OnlineSnapshot>('liveEnter',{name});setSnapshot(next);})}>{pending?'正在入席……':'加入同遊'}</button></div>:<>
   <div className="live-status"><strong>{me!.character.name} · 第{me!.rank}名</strong><span>{protection?`戰敗保護 ${protection}秒`:me!.busy?'交手中':me!.live?.red?'開紅中':'收刀中'}</span></div>
   <div className="live-actions"><button type="button" className="online-frame" aria-pressed={me!.live?.red} disabled={pending||Boolean(me!.busy)} onClick={()=>void run(async()=>{await liveCommand('red',{enabled:!me!.live?.red});})}>{me!.live?.red?'收刀':'開紅'}</button><button type="button" className="online-frame" disabled={pending||Boolean(me!.busy)} onClick={()=>void run(async()=>{await liveRequest('liveLeave');setChat({messages:[],blocked:[]});setSnapshot(null);})}>退出同遊</button></div>
   <p className="live-rule">開紅才能出手；收刀、屏蔽對話仍可被挑戰。</p>
   <details className="live-peers"><summary>同遊俠客 · {peers.length}人</summary>{peers.filter(p=>p.id!==me!.id).map(p=><article key={p.id} className="live-peer"><AppearanceBadge character={p} size={44}/><div><strong>{p.name}{p.live?.red?' · 紅名':''}</strong><small>第{p.rank}名 · {p.online?'在線':'離線應戰'}{p.protectedUntil>now?` · 保護${Math.ceil((p.protectedUntil-now)/1000)}秒`:p.busy?' · 交手中':''}</small></div><div className="live-peer-actions"><button type="button" className="online-frame" onClick={()=>{setTarget(p.id);inputRef.current?.focus();}}>私訊</button><button type="button" className="online-frame" disabled={pending||!me!.live?.red||Boolean(me!.busy)||Boolean(p.busy)||p.protectedUntil>now} onClick={()=>setConfirm(p)}>交手</button><button type="button" className="live-text-action" disabled={pending} onClick={()=>void run(async()=>{await liveRequest('block',{target:p.id,blocked:!chat.blocked.includes(p.id)});})}>{chat.blocked.includes(p.id)?'解除屏蔽':'屏蔽對話'}</button></div></article>)}{peers.length===1&&<p>暫無其他俠客入席。</p>}</details>
   <label className="live-channel">對話頻道<select aria-label="對話頻道" value={target} onChange={e=>setTarget(e.target.value)}><option value="">江湖公頻</option>{snapshot?.peers.filter(p=>p.id!==me!.id).map(p=><option value={p.id} key={p.id}>私訊 · {p.name}</option>)}</select></label>
   <div ref={logRef} className="live-chat" role="log" aria-label={target?'私訊紀錄':'江湖對話'} aria-relevant="additions text">{!chat.messages.length&&<p className="live-chat-empty">{target?'尚無往來書信。':'茶香正暖，向同遊俠客打個招呼。'}</p>}{chat.messages.map(m=><article key={m.id} className={m.sender===me!.id?'is-self':''}><header><b>{m.name}</b><time dateTime={m.created_at}>{new Date(m.created_at).toLocaleTimeString('zh-HK',{hour:'2-digit',minute:'2-digit',hour12:false})}</time>{m.sender!==me!.id&&<button type="button" className="live-text-action" disabled={pending} aria-label={`舉報${m.name}的訊息`} onClick={()=>void run(async()=>{await liveCommand('report',{messageId:m.id,reason:'不當內容'});setNotice('舉報已收妥。');})}>舉報</button>}</header><p>{m.body}</p></article>)}</div>
   <form className="live-compose" onSubmit={e=>{e.preventDefault();if(!draft.trim())return;const body=draft;void run(async()=>{await liveCommand('send',{body,...target?{target}:{}});setDraft('');inputRef.current?.focus();});}}><label htmlFor="live-message">{target?'傳書':'發言'}<small>{draft.length}／300</small></label><textarea ref={inputRef} id="live-message" maxLength={300} rows={2} value={draft} onChange={e=>setDraft(e.target.value)} placeholder={target?'寫下想說的話……':'向江湖說句話……'}/><button type="submit" className="ink-btn ink-btn--primary" disabled={pending||!draft.trim()||!connected}>送出</button></form>
   {!!snapshot?.liveBattles?.length&&<div className="live-battles"><h3>此刻交鋒</h3>{snapshot.liveBattles.map(b=><button type="button" key={b.id} className="online-frame" onClick={()=>void run(async()=>{const value=await liveRequest<LiveWatch>('watch',{id:b.id});watchId.current=b.id;setWatch(value);})}>{b.names.join(' 對 ')} · 觀戰</button>)}</div>}
  </>}
  {confirm&&<InkModal aria-label="確認同遊交手" onDismiss={()=>setConfirm(null)}><div className="ink-modal-card"><h3>與{confirm.name}交手？</h3><p>主動出擊會解除自己的戰敗保護。勝負只影響名次，不受傷或掉裝。</p><button type="button" className="ink-btn ink-btn--primary" disabled={pending} onClick={()=>void run(async()=>{await liveCommand('attack',{target:confirm.id});setConfirm(null);})}>確認交手</button><button type="button" className="ink-btn" onClick={()=>setConfirm(null)}>再想想</button></div></InkModal>}
  {watch&&<Suspense fallback={<p role="status">正在展開交鋒……</p>}><Battle key={watch.id} replay={watch.replay} actorLook={watch.look} rewardCoins={0} unified reduceMotion={reduced||motionReduced()} liveClock={{startedAt:watch.startedAt,endsAt:watch.endsAt,offsetMs:offset.current}} notice={<span>同遊交鋒 · 同步演出 · 離開演出不影響戰果</span>} onDone={closeWatch}/></Suspense>}
 </section>;
}
