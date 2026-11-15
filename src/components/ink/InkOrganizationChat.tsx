import {useCallback,useEffect,useRef,useState} from 'react';
import type {LiveMessages} from '@interfaces/live';
import {organizationRequest} from '../../cloud/organizations';
import {watchLiveUpdates} from '../../cloud/live';
/** 組織專屬對話；正文只經資格驗證補讀，切換／離場不沿用上一組資料。 */
export function InkOrganizationChat({kind,group,title,userId}:{kind:'guild'|'sect';group:string;title:string;userId:string}){
 const [chat,setChat]=useState<LiveMessages&{blockedNames?:Record<string,string>}>({messages:[],blocked:[]}),[draft,setDraft]=useState(''),[error,setError]=useState(''),[network,setNetwork]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
 const active=useRef(true),reading=useRef(false),again=useRef(false),sending=useRef(false),log=useRef<HTMLDivElement>(null);
 const refresh=useCallback(async()=>{
  if(document.hidden)return;if(reading.current){again.current=true;return;}reading.current=true;
  try{do{again.current=false;const value=await organizationRequest<LiveMessages>('messages',{kind,group});if(active.current){setChat(value);setNetwork('');}}while(again.current&&active.current);}
  catch(e){if(active.current)setNetwork(e instanceof Error?e.message:'對話暫時未能連線。');}finally{reading.current=false;}
 },[kind,group]);
 useEffect(()=>{
  active.current=true;let stop=()=>{},disposed=false;void refresh();void watchLiveUpdates(()=>void refresh()).then(clean=>{if(disposed)clean();else stop=clean;}).catch(()=>{});
  const update=()=>{if(!document.hidden)void refresh();},timer=setInterval(update,15000);window.addEventListener('online',update);document.addEventListener('visibilitychange',update);
  return()=>{disposed=true;active.current=false;stop();clearInterval(timer);window.removeEventListener('online',update);document.removeEventListener('visibilitychange',update);};
 },[refresh]);
 useEffect(()=>{if(log.current)log.current.scrollTop=log.current.scrollHeight;},[chat.messages]);
 const run=async(action:string,data:Record<string,unknown>)=>{
  if(sending.current)return;sending.current=true;setBusy(true);setError('');setNotice('');
  try{await organizationRequest(action,{kind,group,...data});if(active.current){if(action==='send')setDraft('');if(action==='reportMessage')setNotice('舉報已收妥。');await refresh();}}
  catch(e){if(active.current)setError(e instanceof Error?e.message:'暫時未能處理。');}finally{sending.current=false;if(active.current)setBusy(false);}
 };
 return <section className="organization-chat" aria-label={title}><h3>{title}</h3>
  {(error||network)&&<p role="alert">{error||network} <button type="button" className="online-frame" onClick={()=>{setError('');void refresh();}}>重新連線</button></p>}{notice&&<p role="status">{notice}</p>}
  <div ref={log} className="organization-messages" role="log" aria-label={title+'紀錄'}>{!chat.messages.length&&<p>還未有人開口，先打個招呼。</p>}{chat.messages.map(m=><article key={m.id}><header><strong>{m.name}</strong><time>{new Date(m.created_at).toLocaleTimeString('zh-HK',{hour:'2-digit',minute:'2-digit',hour12:false})}</time>{m.sender!==userId&&<><button type="button" disabled={busy} onClick={()=>void run('reportMessage',{messageId:m.id,reason:'不當內容'})}>舉報</button><button type="button" disabled={busy} onClick={()=>void run('block',{target:m.sender,blocked:true})}>屏蔽</button></>}</header><p>{m.body}</p></article>)}</div>
  {!!chat.blocked.length&&<details><summary>已屏蔽對話 · {chat.blocked.length}人</summary>{chat.blocked.map(id=><button type="button" key={id} className="online-frame" disabled={busy} onClick={()=>void run('block',{target:id,blocked:false})}>解除屏蔽 · {chat.blockedNames?.[id]??'江湖俠客'}</button>)}</details>}
  <form onSubmit={e=>{e.preventDefault();if(draft.trim())void run('send',{body:draft});}}><label htmlFor={'org-message-'+kind}>寫給{kind==='guild'?'幫眾':'同門'}<small>{draft.length}／300</small></label><div><textarea id={'org-message-'+kind} value={draft} rows={2} maxLength={300} onChange={e=>setDraft(e.target.value)}/><button type="submit" className="ink-btn ink-btn--primary" disabled={busy||!draft.trim()}>送出</button></div></form>
 </section>;
}
