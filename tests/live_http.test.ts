import {afterEach,expect,it,vi} from 'vitest';
import {createLiveHandler} from '../server/online/liveHttp';
import {SharedWorldService} from '../core/online/sharedWorld';
import {OnlineError} from '../core/online/commands';
const user='00000000-0000-4000-8000-000000000001',target='00000000-0000-4000-8000-000000000002';
afterEach(()=>vi.restoreAllMocks());
function fixture(result:unknown={messages:[],blocked:[]},status=200){
 const calls:{url:string;body:Record<string,unknown>|null}[]=[];
 const handler=createLiveHandler({url:'https://test.invalid',anonKey:'test-public',serviceKey:'test-service'},async(url,init)=>{
  calls.push({url:String(url),body:init?.body?JSON.parse(init.body as string):null});
  return new Response(JSON.stringify(String(url).endsWith('/auth/v1/user')?{id:user}:result),{status:String(url).endsWith('/auth/v1/user')?200:status});
 });
 const call=(action:string,data:unknown={})=>handler(new Request('https://test.invalid/live',{method:'POST',headers:{Authorization:'Bearer test-session'},body:JSON.stringify({action,clientId:target,data})}));
 return {calls,call};
}
it('test_live_view_合併私訊名冊及心跳_只採已驗證身份',async()=>{
 const snapshot={me:{live:{joined:true}},revision:9};const world=vi.spyOn(SharedWorldService.prototype,'execute').mockResolvedValue(snapshot);
 const f=fixture({messages:[{body:'兩人書信'}],blocked:[]});const response=await f.call('view',{target,renew:true});
 expect(response.status).toBe(200);expect(await response.json()).toEqual({snapshot,chat:{messages:[{body:'兩人書信'}],blocked:[]}});
 expect(world).toHaveBeenCalledExactlyOnceWith(user,{action:'liveHeartbeat',clientId:target,data:{}});
 expect(f.calls[1].body).toEqual({p_user:user,p_action:'messages',p_data:{target}});
});
it('test_live_view_另一分頁退出_補讀未參與快照並停止讀訊息',async()=>{
 const snapshot={me:{live:{joined:false}}};const world=vi.spyOn(SharedWorldService.prototype,'execute').mockRejectedValueOnce(new OnlineError(409,'請先加入同遊江湖。')).mockResolvedValue(snapshot);
 const f=fixture();const response=await f.call('view',{renew:true});
 expect(response.status).toBe(200);expect(await response.json()).toEqual({snapshot,chat:{messages:[],blocked:[]}});
 expect(world).toHaveBeenLastCalledWith(user,{action:'world',clientId:target,data:{}});expect(f.calls).toHaveLength(1);
});
it('test_live_http_發言限頻_轉429並保持其他錯誤不洩漏',async()=>{
 const f=fixture({code:'P0429',message:'請稍候再發言。'},400);
 const response=await f.call('send',{requestId:target,body:'再見'});
 expect(response.status).toBe(429);expect(await response.json()).toEqual({error:'請稍候再發言。'});
 const denied=await f.call('view',{target,user});expect(denied.status).toBe(400);
});
