import {afterEach,expect,it,vi} from 'vitest';

vi.mock('../src/cloud/sync',()=>({saveProfileForOnline:vi.fn(async()=>true)}));
vi.mock('../src/store/lifeStore',()=>({useLifeStore:{getState:()=>({state:{}})}}));
vi.mock('../src/cloud/cloud',()=>({cloudAccess:async()=>({url:'https://test.invalid',key:'test-public',token:'test-session'})}));
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();vi.resetModules();});

function transport(statuses:(number|'offline')[]){
 let counter=0;
 vi.spyOn(crypto,'randomUUID').mockImplementation(()=>`00000000-0000-4000-8000-${String(++counter).padStart(12,'0')}`);
 const saved=new Map<string,string>(),ids:string[]=[];
 vi.stubGlobal('sessionStorage',{getItem:(k:string)=>saved.get(k)??null,setItem:(k:string,v:string)=>saved.set(k,v),removeItem:(k:string)=>saved.delete(k)});
 vi.stubGlobal('fetch',async(_url:string,init:RequestInit)=>{
  ids.push(JSON.parse(init.body as string).data.requestId);
  const status=statuses.shift()!;
  if(status==='offline')throw new TypeError('Failed to fetch');
  return new Response(JSON.stringify(status===200?{ok:true}:{error:'請稍候再試。'}),{status});
 });
 return {saved,ids};
}

it('test_live_retry_斷線及繁忙限頻後重送_沿用原ID避免重複發言',async()=>{
 const t=transport(['offline',503,429,200]);
 const {liveCommand}=await import('../src/cloud/live');
 const data={body:'茶樓見。'};
 await expect(liveCommand('send',data)).rejects.toThrow('同遊暫時未能連線');
 await expect(liveCommand('send',data)).rejects.toMatchObject({status:503});
 await expect(liveCommand('send',data)).rejects.toMatchObject({status:429});
 expect(t.saved.has('jianghu-live-pending:send')).toBe(true);
 await expect(liveCommand('send',data)).resolves.toEqual({ok:true});
 expect(new Set(t.ids).size).toBe(1);expect(t.saved.size).toBe(0);
});

it('test_live_retry_確定拒絕及內容改變_下次指令重新編號',async()=>{
 const t=transport([400,503,200]);const {liveCommand}=await import('../src/cloud/live');
 await expect(liveCommand('send',{body:'第一句'})).rejects.toMatchObject({status:400});
 expect(t.saved.size).toBe(0);
 await expect(liveCommand('send',{body:'第一句'})).rejects.toMatchObject({status:503});
 await liveCommand('send',{body:'第二句'});
 expect(new Set(t.ids).size).toBe(3);
});

it('test_online_retry_共用對戰收到限頻_保留原指令編號',async()=>{
 const t=transport([429,200]);const {onlineCommand}=await import('../src/online/client');
 await expect(onlineCommand('claim','test-session',{})).rejects.toMatchObject({status:429});
 await onlineCommand('claim','test-session',{});
 expect(new Set(t.ids).size).toBe(1);expect(t.saved.size).toBe(0);
});
