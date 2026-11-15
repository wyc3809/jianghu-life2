import {lazy,Suspense,useCallback,useEffect,useRef,useState} from 'react';
import type {GuildSnapshot,GuildReport,GuildRole} from '@interfaces/guild';
import {GUILD_CITIES,GUILD_TEST as P} from '@data/redesign/guildTestParams';
import {watchLiveUpdates} from '../../cloud/live';
import {organizationRequest} from '../../cloud/organizations';
import {OnlineApiError} from '../../online/client';
import {AppearanceBadge} from './InkAppearance';
import {InkModal} from './InkModal';
import {InkOrganizationChat} from './InkOrganizationChat';
import './organizations.css';
const Battle=lazy(()=>import('./InkAutoBattle').then(m=>({default:m.InkAutoBattle})));
const roles:Record<GuildRole,string>={leader:'幫主',elder:'長老',member:'幫眾'};
type Tab='hall'|'cities'|'treasury'|'chat';
/** 真人幫會及十城；只展示服務端名冊／戰果，操作不修改私人數值。 */
export default function InkGuildWorld({onBack,backLabel='返回江湖風雲'}:{onBack:()=>void;backLabel?:string}){
 const [view,setView]=useState<GuildSnapshot|null>(null),[tab,setTab]=useState<Tab>('hall'),[name,setName]=useState(''),[intro,setIntro]=useState(''),[error,setError]=useState(''),[network,setNetwork]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[report,setReport]=useState<GuildReport|null>(null),[now,setNow]=useState(Date.now());
 const [confirm,setConfirm]=useState<{text:string;action:string;data:Record<string,unknown>}|null>(null);
 const alive=useRef(true),gate=useRef(false),loading=useRef(false),again=useRef(false),offset=useRef(0);
 const refresh=useCallback(async()=>{
  if(document.hidden)return;if(loading.current){again.current=true;return;}loading.current=true;
  try{do{again.current=false;const value=await organizationRequest<GuildSnapshot>('overview');if(alive.current){offset.current=value.serverNow-Date.now();setView(previous=>!previous||value.revision>=previous.revision?value:previous);setNetwork('');}}while(again.current&&alive.current);}
  catch(e){if(alive.current)setNetwork(e instanceof Error?e.message:'幫會暫時未能連線。');}finally{loading.current=false;}
 },[]);
 useEffect(()=>{alive.current=true;void refresh();const update=()=>void refresh(),poll=setInterval(update,15000),clock=setInterval(()=>setNow(Date.now()+offset.current),1000);window.addEventListener('online',update);document.addEventListener('visibilitychange',update);return()=>{alive.current=false;clearInterval(poll);clearInterval(clock);window.removeEventListener('online',update);document.removeEventListener('visibilitychange',update);};},[refresh]);
 useEffect(()=>{let disposed=false,stop=()=>{};void watchLiveUpdates(()=>void refresh()).then(clean=>{if(disposed)clean();else stop=clean;}).catch(()=>{});return()=>{disposed=true;stop();};},[refresh]);
 const run=async(action:string,data:Record<string,unknown>={})=>{
  if(gate.current)return;gate.current=true;setBusy(true);setError('');setNotice('');
  try{
   const result=await organizationRequest<{captured?:boolean;reportId?:string}>(action,data);
   if(!alive.current)return;setConfirm(null);
   if(action==='attack'){
    setNotice(result.captured?'城池已歸本幫。':'本次未能攻下城池。');
    if(result.reportId)setReport(await organizationRequest<GuildReport>('report',{id:result.reportId}));
   }
   if(action==='create'){setName('');setIntro('');}await refresh();
  }catch(e){if(alive.current){const message=e instanceof Error?e.message:'暫時未能處理。';if(e instanceof OnlineApiError&&(!e.status||e.status>=500))setNetwork(message);else setError(message);}}
  finally{gate.current=false;if(alive.current)setBusy(false);}
 };
 const ask=(text:string,action:string,data:Record<string,unknown>={})=>setConfirm({text,action,data});
 const me=view?.me,guild=view?.guild,manage=me&&me.role!=='member',leader=me?.role==='leader';
 const actionButton=(label:string,action:string,data:Record<string,unknown>,question?:string)=><button type="button" className="online-frame" disabled={busy} onClick={()=>question?ask(question,action,data):void run(action,data)}>{label}</button>;
 return <section className="ink-panel ink-online ink-guild" aria-label="江湖幫會">
  <button type="button" className="ink-jianghu-back" onClick={onBack}>‹ {backLabel}</button>
  <h2>江湖幫會</h2><div className="guild-scene"><p>{guild?.name??'四海同心'}</p><small>{guild?`總堂${guild.level}級 · ${view!.members.length}／${view!.capacity}人`:'聚義結盟，共守十城。'}</small></div>
  {(error||network)&&<p role="alert" className="guild-feedback">{error||network} {network&&actionButton('重新連線','overview',{})}</p>}{notice&&<p role="status" className="guild-feedback">{notice}</p>}
  {!view?<p role="status">正在展開幫會名冊……</p>:!guild?<>
   {view.application&&<div className="guild-strip"><p>已向{view.guilds.find(g=>g.id===view.application?.guildId)?.name??'幫會'}遞交入幫帖。</p>{actionButton('撤回申請','cancel',{})}</div>}
   <details className="guild-create"><summary>自立幫會</summary><form onSubmit={e=>{e.preventDefault();void run('create',{name,intro});}}><label>幫會名<input aria-label="幫會名" value={name} minLength={2} maxLength={12} required onChange={e=>setName(e.target.value)} placeholder="二至十二字"/></label><label>宗旨<textarea aria-label="幫會宗旨" value={intro} maxLength={140} rows={2} onChange={e=>setIntro(e.target.value)}/></label><button className="ink-btn ink-btn--primary" type="submit" disabled={busy||name.trim().length<2}>創立幫會</button></form></details>
   <h3>江湖招募</h3>{!view.guilds.length&&<p>尚無幫會，可先邀知己一同創立。</p>}{view.guilds.map(g=><article className="guild-recruit" key={g.id}><div><h3>{g.name}</h3><p>{g.intro||'廣結同道，共赴江湖。'}</p><small>總堂{g.level}級 · {g.count}／{g.capacity}人</small></div><button type="button" className="online-frame" disabled={busy||g.count>=g.capacity||view.application?.guildId===g.id} onClick={()=>void run('apply',{target:g.id})}>{view.application?.guildId===g.id?'待回覆':'申請加入'}</button></article>)}
  </>:<>
   <nav className="guild-tabs" aria-label="幫會分頁">{([['hall','聚義堂'],['cities','十城'],['treasury','幫庫'],['chat','幫會對話']] as const).map(([id,label])=><button key={id} type="button" className="online-frame" aria-pressed={tab===id} onClick={()=>setTab(id)}>{label}</button>)}</nav>
   {tab==='hall'&&<><p className="guild-intro">{guild.intro||'廣結同道，共赴江湖。'}</p><p>你係本幫{roles[me!.role]}。</p>
    {manage&&<details><summary>修改宗旨</summary><form onSubmit={e=>{e.preventDefault();void run('edit',{intro});}}><label>新宗旨<textarea maxLength={140} value={intro} onChange={e=>setIntro(e.target.value)}/></label><button className="online-frame" disabled={busy} type="submit">保存宗旨</button></form></details>}
    {!!view.applications.length&&<section aria-label="入幫申請"><h3>入幫帖 · {view.applications.length}</h3>{view.applications.map(a=><article className="guild-person" key={a.user}><AppearanceBadge character={a} size={42}/><strong>{a.name}</strong><div>{actionButton('接納','accept',{target:a.user})}{actionButton('婉拒','reject',{target:a.user})}</div></article>)}</section>}
    <h3>幫眾名冊</h3>{view.members.map(m=><article className="guild-person" key={m.id}><AppearanceBadge character={m} size={44}/><div><strong>{m.name}</strong><small>{roles[m.role]}{m.id===me!.id?' · 你':''}</small></div>{m.id!==me!.id&&manage&&m.role!=='leader'&&<details><summary>管理</summary><div className="guild-person-actions">{leader&&actionButton(m.role==='elder'?'卸任長老':'任命長老','role',{target:m.id,role:m.role==='elder'?'member':'elder'})}{leader&&actionButton('傳位','transfer',{target:m.id},`將幫主之位傳給${m.name}？`)}{(leader||m.role==='member')&&actionButton('請離幫會','kick',{target:m.id},`請${m.name}離開幫會？`)}</div></details>}</article>)}
    <div className="guild-leave">{leader?actionButton('解散幫會','disband',{},'只餘你一人先可解散；幫庫及城池會一併交還江湖。確定解散？'):actionButton('退出幫會','leave',{},'離開目前幫會？本幫城池仍按鎖定守將防守。')}</div>
   </>}
   {tab==='cities'&&<><p>今日尚可出戰 {view.attackRemaining}／{P.attacksPerDay}次。守將離線亦可守城。</p><p className="guild-rule">新佔城整備{P.cityProtectionMs/60000}分鐘；城戰不傷亡、不掉裝、不改個人排名。守城沿用進駐時的對戰配搭。</p><div className="guild-cities">{GUILD_CITIES.map(c=>{const state=view.cities.find(v=>v.id===c.id)!,owner=view.guilds.find(g=>g.id===state.guildId),ours=state.guildId===guild.id,seconds=Math.max(0,Math.ceil((state.protectedUntil-now)/1000));return <article key={c.id} data-owned={ours}><h3>{c.name}</h3><small>{c.scene}</small><strong>{owner?.name??'無人佔領'}</strong><p>{state.defenderName?`守將 ${state.defenderName}`:'靜候江湖豪傑'}{seconds>0?` · 整備${seconds}秒`:''}</p>{ours?manage&&actionButton('我來守城','station',{city:c.id}):<button type="button" className="online-frame" disabled={busy||seconds>0||view.attackRemaining<=0} onClick={()=>ask(`出戰${c.name}？會消耗今日一次出戰機會。`,'attack',{city:c.id})}>{owner?'出戰':'進駐'}</button>}</article>;})}</div>
    {!!view.reports.length&&<><h3>近期城戰</h3>{view.reports.map(r=><button key={r.id} type="button" className="guild-history online-frame" disabled={busy} onClick={()=>void organizationRequest<GuildReport>('report',{id:r.id}).then(setReport).catch(e=>setError(e.message))}>{GUILD_CITIES.find(c=>c.id===r.city)?.name} · {r.names.join(' 對 ')} · {r.captured?'易主':'守住'}</button>)}</>}
   </>}
   {tab==='treasury'&&<><div className="guild-vault"><h3>幫庫資材</h3><strong>{Math.floor(guild.materials)}</strong><p>每座城每小時產{P.cityMaterialsPerHour}份資材，最多補計48小時。入幫庫供總堂建設。</p></div><h3>總堂 · {guild.level}級</h3><p>可容納{view.capacity}人{guild.level<P.maxLevel?`；升級後可容納${view.capacity+P.capacityPerLevel}人。`:'。'}</p>{leader&&guild.level<P.maxLevel&&actionButton(`建設總堂 · ${guild.level*P.upgradeBase}資材`,'upgrade',{},`使用${guild.level*P.upgradeBase}份幫會資材建設總堂？`)}<h3>幫會記事</h3>{guild.log.map((l,i)=><p className="guild-ledger" key={l.at+'-'+i}>{l.text}<small>{new Date(l.at).toLocaleDateString('zh-HK')}</small></p>)}</>}
   {tab==='chat'&&<InkOrganizationChat key={guild.id} kind="guild" group={guild.id} userId={me!.id} title="幫會對話"/>}
  </>}
  {confirm&&<InkModal aria-label="確認幫會操作" onDismiss={()=>setConfirm(null)}><div className="ink-modal-card"><h3>{confirm.text}</h3><button type="button" className="ink-btn ink-btn--primary" disabled={busy} onClick={()=>void run(confirm.action,confirm.data)}>確認</button><button type="button" className="ink-btn" disabled={busy} onClick={()=>setConfirm(null)}>再想想</button>{error&&<p role="alert">{error}</p>}</div></InkModal>}
  {report&&<Suspense fallback={<p role="status">正在展開城戰……</p>}><Battle replay={report.replay} actorLook={report.look} rewardCoins={0} unified onDone={()=>setReport(null)}/></Suspense>}
 </section>;
}
