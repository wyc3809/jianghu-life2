import { expect, it } from 'vitest';
import { SharedWorldService, type SharedRepository, type SharedWorld, type WorldReceipt } from '../core/online/sharedWorld';
import type { OnlineBattle, OnlineSnapshot } from '../interfaces/online';
const a='00000000-0000-4000-8000-000000000001', b='00000000-0000-4000-8000-000000000002', c='00000000-0000-4000-8000-000000000003';
const client='10000000-0000-4000-8000-000000000001', second='10000000-0000-4000-8000-000000000002';
function fixture() {
 let state:SharedWorld={ revision:0,payload:{world:{version:1,revision:0,players:{},battles:[]},presence:{}} }, now=100_000, fails=0;
 const receipts=new Map<string,WorldReceipt>(),battles=new Map<string,OnlineBattle>();
 const repo:SharedRepository={
  load:async()=>structuredClone(state),
  receipt:async(user,id)=>structuredClone(receipts.get(user+':'+id)??null),
  history:async user=>structuredClone([...battles.values()].filter(x=>x.attacker===user||x.defender===user).reverse().slice(0,10)),
  confirmed:async user=>[...receipts.values()].filter(r=>r.user_id===user).map(r=>r.request_id),
  save:async(next,expected,updates,receipt)=>{
   if(fails>0){fails--;return false;}
   if(state.revision!==expected)return false;
   state=structuredClone(next);
   for(const battle of updates)battles.set(battle.id,structuredClone(battle));
   if(receipt)receipts.set(receipt.user_id+':'+receipt.request_id,structuredClone(receipt));
   return true;
  },
 };
 const service=new SharedWorldService(repo,()=>now,()=>({seed:42,battleId:'battle-'+now}));
 const call=(user:string,action:string,data:unknown={},clientId=client)=>service.execute(user,{action,clientId,data});
 const setup=async()=>{await call(a,'register',{name:'甲俠客'});await call(b,'register',{name:'乙俠客'});await call(c,'register',{name:'丙俠客'});};
 return{call,setup,receipts,battles,state:()=>state,advance:(ms:number)=>{now+=ms;},fail:(n:number)=>{fails=n;}};
}
it('test_shared_三人各自入籍_同一世界唔需要房間邀請',async()=>{
 const f=fixture();await Promise.all([f.call(a,'register',{name:'甲俠客'}),f.call(b,'register',{name:'乙俠客'}),f.call(c,'register',{name:'丙俠客'})]);
 const s=await f.call(a,'world') as OnlineSnapshot;
 expect(s.population).toBe(3);expect(s.peers).toHaveLength(3);expect(s).not.toHaveProperty('room');
 expect(new Set(s.peers.map(x=>x.rank)).size).toBe(3);
 const before=structuredClone(s.me);
 await f.call(a,'register',{name:'改名唔生效'});
 const again=await f.call(a,'world') as OnlineSnapshot;
 expect(again.me.character).toEqual(before.character);expect(again.me.rank).toBe(before.rank);
});
it('test_shared_未入籍及冒認身份_拒絕多餘欄位',async()=>{
 const f=fixture();await expect(f.call(a,'heartbeat')).rejects.toMatchObject({status:404});
 await expect(f.call(a,'register',{name:'甲俠客',account:b})).rejects.toThrow();
 await f.call(a,'register',{name:'甲俠客'});
 await expect(f.call(a,'challenge',{requestId:'missing-001',target:b})).rejects.toMatchObject({status:404});
});
it('test_shared_離線防守動態玩家_互換只影響雙方且同一戰報',async()=>{
 const f=fixture();await f.setup();
 const p=f.state().payload.world.players;
 p[b].character.martial=500;p[b].character.skillRanks={...p[b].character.skillRanks,art_river_fist:7};p[a].character.martial=1;
 await f.call(a,'leave');
 const input={requestId:'challenge-001',target:a};
 const result=await Promise.all([f.call(b,'challenge',input),f.call(b,'challenge',input)]);
 expect(result[0]).toEqual(result[1]);expect(f.battles.size).toBe(1);
 f.advance(2000);
 const sa=await f.call(a,'world') as OnlineSnapshot,sb=await f.call(b,'world') as OnlineSnapshot,sc=await f.call(c,'world') as OnlineSnapshot;
 expect(sa.me.rank).toBe(2);expect(sb.me.rank).toBe(1);expect(sc.me.rank).toBe(3);
 expect(sa.battles[0].after).toEqual({[a]:2,[b]:1});expect(sa.battles[0].id).toBe(sb.battles[0].id);expect(sc.battles).toHaveLength(0);
 expect(f.state().payload.world.battles).toHaveLength(0);expect(f.battles.size).toBe(1);
 const character=structuredClone(sb.me.character);await f.call(b,'challenge',input);
 expect(f.battles.size).toBe(1);expect((await f.call(b,'world') as OnlineSnapshot).me.character).toEqual(character);
});
it('test_shared_離線領取重送_收據及世界同時一次入帳',async()=>{
 const f=fixture();await f.setup();await f.call(a,'leave');f.advance(60_000);
 const before=await f.call(a,'world') as OnlineSnapshot;expect(before.me.pendingOffline).toBe(1);
 const data={requestId:'claim-00001'};const result=await Promise.all([f.call(a,'claim',data),f.call(a,'claim',data)]);
 expect(result[0]).toEqual(result[1]);expect((await f.call(a,'world') as OnlineSnapshot).me.silver).toBe(1);expect(f.receipts.size).toBe(1);
 await expect(f.call(a,'challenge',{...data,target:b})).rejects.toMatchObject({status:409});
});
it('test_shared_多頁離場_其他租約及離線上限保留',async()=>{
 const f=fixture();await f.setup();await f.call(a,'heartbeat',{},second);await f.call(a,'leave');
 expect((await f.call(b,'world') as OnlineSnapshot).peers.find(p=>p.id===a)?.online).toBe(true);
 await f.call(a,'leave',{},second);f.advance(72*60*60*1000);
 let s=await f.call(a,'world') as OnlineSnapshot;expect(s.me.pendingOffline).toBe(48*60);
 f.advance(60_000);s=await f.call(a,'world') as OnlineSnapshot;expect(s.me.pendingOffline).toBe(48*60);
});
it('test_shared_CAS繁忙_唔提前派獎或保存戰報',async()=>{
 const f=fixture();await f.setup();f.fail(10);
 await expect(f.call(a,'challenge',{requestId:'retry-00001',target:b})).rejects.toMatchObject({status:503});
 expect(f.battles.size).toBe(0);expect(f.receipts.size).toBe(0);
 await f.call(a,'challenge',{requestId:'retry-00001',target:b});expect(f.battles.size).toBe(1);
});
