import { cloudAccess, cloudRealtimeClient } from './cloud';
import { saveProfileForOnline } from './sync';
import { useLifeStore } from '../store/lifeStore';
import { OnlineApiError } from '../online/client';
const clientId=crypto.randomUUID();
export async function liveRequest<T>(action:string,data:unknown={}):Promise<T>{
 if(action==='liveEnter'||action==='attack'){
  const state=useLifeStore.getState().state;
  if(!state||!await saveProfileForOnline(state))throw new Error('對戰配搭尚未保存，請待連線恢復後再試。');
 }
 const access=await cloudAccess();if(!access)throw new Error('暫時無法驗證雲端身份。');
 let response:Response;
 try{response=await fetch(`${access.url}/functions/v1/jianghu-live`,{method:'POST',headers:{Authorization:`Bearer ${access.token}`,apikey:access.key,'Content-Type':'application/json'},body:JSON.stringify({action,clientId,data}),signal:AbortSignal.timeout(15000)});}catch{throw new OnlineApiError('同遊暫時未能連線，恢復後可再試。');}
 const body=await response.json().catch(()=>null);
 if(!response.ok)throw new OnlineApiError(body?.error??'同遊暫時未能回覆。',response.status);
 return body as T;
}
/** 回覆遺失重試同一個ID，成功或確定拒絕才清除。 */
export async function liveCommand<T>(action:string,data:Record<string,unknown>):Promise<T>{
 const key='jianghu-live-pending:'+action,signature=JSON.stringify(data);let requestId:string;
 try {const old=JSON.parse(sessionStorage.getItem(key)??'null');requestId=old?.signature===signature?old.requestId:crypto.randomUUID();sessionStorage.setItem(key,JSON.stringify({signature,requestId}));}catch{requestId=crypto.randomUUID();}
 try{const result=await liveRequest<T>(action,{...data,requestId});sessionStorage.removeItem(key);return result;}catch(e){if(e instanceof OnlineApiError&&e.status&&e.status<500&&e.status!==429)sessionStorage.removeItem(key);throw e;}
}
/** 通知只有自己的版本號，私訊正文由已驗證服務補讀，不放公共廣播。 */
export async function watchLiveUpdates(refresh:()=>void):Promise<()=>void>{
 const access=await cloudAccess();if(!access)return()=>{};
 const sb=await cloudRealtimeClient();
 const {data}=await sb.auth.getSession();const user=data.session?.user.id;
 if(!user)return()=>{};
 const channel=sb.channel('live-'+crypto.randomUUID()).on('postgres_changes',{event:'*',schema:'public',table:'jianghu_live_notifications',filter:`user_id=eq.${user}`},refresh).subscribe(status=>{if(status==='SUBSCRIBED')refresh();});
 return()=>{void sb.removeChannel(channel);};
}
