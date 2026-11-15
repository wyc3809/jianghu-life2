import { z } from 'zod';
import { SharedWorldService } from '../../core/online/sharedWorld';
import { sharedRepository } from './sharedHttp';
import { createOnlineHandler } from './pairHttp';
import { OnlineError } from '../../core/online/commands';
import type { OnlineBattle, OnlineSnapshot } from '../../interfaces/online';

type Config={url:string;anonKey:string;serviceKey:string};
const uuid=z.string().uuid();
const request=z.object({action:z.enum(['send','messages','block','report','watch']),data:z.unknown(),clientId:uuid}).strict();
const schemas={
 send:z.object({requestId:uuid,body:z.string().trim().min(1).max(300),target:uuid.optional()}).strict(),
 messages:z.object({target:uuid.optional(),after:z.number().int().min(0).max(Number.MAX_SAFE_INTEGER).optional()}).strict(),
 block:z.object({target:uuid,blocked:z.boolean()}).strict(),
 report:z.object({requestId:uuid,messageId:uuid,reason:z.string().trim().min(1).max(200)}).strict(),
 watch:z.object({id:uuid}).strict(),
};
export function createLiveHandler(config:Config,fetcher:typeof fetch=fetch){
 const repo=sharedRepository(config,fetcher);
 const world=new SharedWorldService(repo,Date.now,()=>({seed:crypto.getRandomValues(new Uint32Array(1))[0],battleId:crypto.randomUUID()}));
 const headers={apikey:config.serviceKey,Authorization:`Bearer ${config.serviceKey}`,'Content-Type':'application/json'};
 return createOnlineHandler(config,{execute:async(user,raw)=>{
  if(typeof raw==='object'&&raw!==null&&'action'in raw&&['send','messages','block','report','watch'].includes(String(raw.action))){
   const input=request.parse(raw),data=schemas[input.action].parse(input.data);
   if(input.action==='watch'){
    const state=await repo.load();
    if(!state.payload.world.players[user]?.live?.joined)throw new OnlineError(403,'請先加入同遊江湖。');
    const response=await fetcher(`${config.url}/rest/v1/jianghu_world_battles?id=eq.${(data as {id:string}).id}&select=payload`,{headers,signal:AbortSignal.timeout(8000)});
    if(!response.ok)throw new OnlineError(503,'暫時未能取得交鋒。');
    const b=((await response.json()) as {payload:OnlineBattle}[])[0]?.payload;
    if(!b||b.mode!=='red')throw new OnlineError(404,'找不到這場同遊交鋒。');
    const c=b.characters[b.attacker];
    return {id:b.id,startedAt:b.startedAt,endsAt:b.endsAt,serverNow:Date.now(),replay:b.replays[b.attacker],look:{sectId:c.sectId??null,weaponId:c.equipment.weapon??null}};
   }
   const response=await fetcher(`${config.url}/rest/v1/rpc/jianghu_live_social`,{method:'POST',headers,body:JSON.stringify({p_user:user,p_action:input.action,p_data:data}),signal:AbortSignal.timeout(8000)});
   if(!response.ok){const error=await response.json().catch(()=>null);throw new OnlineError(response.status>=500?503:409,error?.code==='P0001'?error.message:'同遊消息暫時未能處理，請重試。');}
   return response.json();
  }
  // 同一權威世界：開紅、舊隨機挑戰及敗方保護共用鎖與收據。
  return world.execute(user,raw) as Promise<OnlineSnapshot>;
 }},fetcher);
}
