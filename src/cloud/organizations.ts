import {cloudAccess} from './cloud';
import {saveProfileForOnline} from './sync';
import {useLifeStore} from '../store/lifeStore';
import {OnlineApiError} from '../online/client';
/** 只傳操作意圖；所有未確認及限頻指令保留原ID，組織身份由服務端判斷。 */
export async function organizationRequest<T>(action:string,data:Record<string,unknown>={}):Promise<T>{
 const access=await cloudAccess();if(!access)throw new Error('暫時未能驗證雲端身份。');
 const mutation=!['overview','report','messages'].includes(action);
 if(['create','apply','accept','attack','station'].includes(action)){
  const s=useLifeStore.getState().state;if(!s||!await saveProfileForOnline(s))throw new Error('本世人物尚未保存，請恢復連線後再試。');
 }
 let identity='current';try{const part=access.token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');identity=JSON.parse(atob(part)).sub;}catch{/* 測試／本機身份後備，只作重試索引，唔作權限判斷。 */}
 const key=`jianghu-organization-pending:${access.url}:${identity}:${action}`,signature=JSON.stringify(data);let requestId:string|undefined;
 if(mutation){try{const old=JSON.parse(sessionStorage.getItem(key)??'null');requestId=old?.signature===signature?old.requestId:crypto.randomUUID();sessionStorage.setItem(key,JSON.stringify({signature,requestId}));}catch{requestId=crypto.randomUUID();}}
 try{
  let response:Response;
  try{response=await fetch(`${access.url}/functions/v1/jianghu-organizations`,{method:'POST',headers:{apikey:access.key,Authorization:`Bearer ${access.token}`,'Content-Type':'application/json'},body:JSON.stringify({action,data,...requestId?{requestId}:{}}),signal:AbortSignal.timeout(15000)});}catch{throw new OnlineApiError('幫會暫時未能連線，恢復後可再試。');}
  const result=await response.json().catch(()=>null);if(!response.ok||!result)throw new OnlineApiError(result?.error??'幫會暫時未能回覆。',response.status);
  if(mutation)sessionStorage.removeItem(key);return result as T;
 }catch(e){if(mutation&&e instanceof OnlineApiError&&e.status&&e.status<500&&e.status!==429)sessionStorage.removeItem(key);throw e;}
}
