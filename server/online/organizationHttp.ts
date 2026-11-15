import {z} from 'zod';
import type {GuildRepository,GuildWorld,GuildReceipt,GuildReport} from '../../interfaces/guild';
import {GuildService} from '../../core/online/guild';
import {sectWarRepository} from './sectHttp';
import {createOnlineHandler} from './pairHttp';
import {OnlineError} from '../../core/online/commands';
type Config={url:string;anonKey:string;serviceKey:string};
const uuid=z.string().uuid(),scope={kind:z.enum(['guild','sect']),group:z.string().min(1).max(100)};
const social={messages:z.object({...scope}).strict(),send:z.object({...scope,body:z.string().trim().min(1).max(300)}).strict(),block:z.object({...scope,target:uuid,blocked:z.boolean()}).strict(),reportMessage:z.object({...scope,messageId:uuid,reason:z.string().trim().min(1).max(200)}).strict()};
/** 幫會資料與私人存檔分開；以同一CAS提交城池、資材、戰報及指令收據。 */
export function guildRepository(config:Config,fetcher:typeof fetch=fetch):GuildRepository{
 const headers={apikey:config.serviceKey,Authorization:`Bearer ${config.serviceKey}`,'Content-Type':'application/json'};
 const request=async<T>(path:string,data?:unknown):Promise<T>=>{
  const r=await fetcher(`${config.url}/rest/v1/${path}`,{method:data===undefined?'GET':'POST',headers,body:data===undefined?undefined:JSON.stringify(data),signal:AbortSignal.timeout(10000)});
  if(!r.ok)throw new OnlineError(503,'幫會資料暫時未能儲存，請用原指令重試。');return r.json() as Promise<T>;
 };
 return {profiles:sectWarRepository(config,fetcher).profiles,load:async()=>(await request<GuildWorld[]>('jianghu_guild_world?id=eq.1&select=revision,payload'))[0],receipt:async(user,id)=>(await request<GuildReceipt[]>(`jianghu_guild_receipts?user_id=eq.${user}&request_id=eq.${id}&select=user_id,request_id,input,result`))[0]??null,report:async id=>(await request<{payload:GuildReport}[]>(`jianghu_guild_reports?id=eq.${id}&select=payload`))[0]?.payload??null,save:(w,expected,report,receipt)=>request<boolean>('rpc/commit_jianghu_guild',{p_expected:expected,p_payload:w.payload,p_report:report,p_receipt:receipt})};
}
/** 同一驗身份入口；組織對話資格由資料庫當下名冊驗證，不信任前端職位。 */
export function createOrganizationHandler(config:Config,fetcher:typeof fetch=fetch){
 const guild=new GuildService(guildRepository(config,fetcher),Date.now,()=>({id:crypto.randomUUID(),seed:crypto.getRandomValues(new Uint32Array(1))[0]}));
 return createOnlineHandler(config,{execute:async(user,raw)=>{
  if(raw&&typeof raw==='object'&&'action'in raw&&Object.hasOwn(social,String(raw.action))){
   const input=z.object({action:z.enum(['messages','send','block','reportMessage']),data:z.unknown(),requestId:uuid.optional()}).strict().parse(raw),data=social[input.action].parse(input.data);
   if(input.action!=='messages'&&!input.requestId)throw new OnlineError(400,'欠缺操作編號。');
   const r=await fetcher(`${config.url}/rest/v1/rpc/jianghu_organization_social`,{method:'POST',headers:{apikey:config.serviceKey,Authorization:`Bearer ${config.serviceKey}`,'Content-Type':'application/json'},body:JSON.stringify({p_user:user,p_action:input.action,p_data:{...data,...input.requestId?{requestId:input.requestId}:{}}}),signal:AbortSignal.timeout(10000)});
   if(!r.ok){const e=await r.json().catch(()=>null);throw new OnlineError(e?.code==='P0429'?429:r.status>=500?503:409,['P0001','P0429'].includes(e?.code)?e.message:'對話暫時未能處理。');}return r.json();
  }
  return guild.execute(user,raw);
 }},fetcher);
}
