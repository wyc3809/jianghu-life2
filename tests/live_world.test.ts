import {expect,it} from 'vitest';
import {SharedWorldService,type SharedWorld,type SharedRepository,type WorldReceipt} from '../core/online/sharedWorld';
import {createNewLife} from '../core/life/gameState';
import type {OnlineBattle,OnlineSnapshot} from '../interfaces/online';
import {ONLINE_TEST} from '../data/redesign/onlineTestParams';
const ids=[1,2,3].map(n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`),client='10000000-0000-4000-8000-000000000001';
const req=(n:number)=>`20000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
function fixture(){
 let state:SharedWorld={revision:0,payload:{world:{version:1,revision:0,players:{},battles:[]},presence:{}}},now=100000,counter=0;
 const receipts=new Map<string,WorldReceipt>(),battles=new Map<string,OnlineBattle>();
 const profiles=Object.fromEntries(ids.map((id,i)=>[id,createNewLife({seed:42+i,name:['測甲','測乙','測丙'][i],skipCoach:true}).character]));
 profiles[ids[0]].martial=5000;profiles[ids[1]].martial=1;
 const repo:SharedRepository={profile:async id=>structuredClone(profiles[id]??null),load:async()=>structuredClone(state),receipt:async(u,r)=>structuredClone(receipts.get(u+r)??null),history:async u=>structuredClone([...battles.values()].filter(b=>b.attacker===u||b.defender===u)),confirmed:async u=>[...receipts.values()].filter(r=>r.user_id===u).map(r=>r.request_id),save:async(next,expected,updates,receipt)=>{if(state.revision!==expected)return false;state=structuredClone(next);updates.forEach(b=>battles.set(b.id,structuredClone(b)));if(receipt)receipts.set(receipt.user_id+receipt.request_id,structuredClone(receipt));return true;}};
 const service=new SharedWorldService(repo,()=>now,()=>({seed:42,battleId:`30000000-0000-4000-8000-${String(++counter).padStart(12,'0')}`}));
 const call=(i:number,action:string,data:unknown={})=>service.execute(ids[i],{action,clientId:client,data});
 const join=async(i:number)=>call(i,'liveEnter',{name:profiles[ids[i]].name});
 return {call,join,profiles,battles,receipts,state:()=>state,advance:(ms:number)=>{now+=ms;},setNow:(n:number)=>{now=n;}};
}
it('test_live_同一人物參與及離線應戰_不影響未參與玩家',async()=>{
 const f=fixture();await f.join(0);await f.join(1);await f.call(2,'register',{name:'測丙'});await f.call(1,'leave');
 await f.call(0,'red',{requestId:req(1),enabled:true});
 await expect(f.call(0,'attack',{requestId:req(2),target:ids[2]})).rejects.toMatchObject({status:409});
 await f.call(0,'attack',{requestId:req(3),target:ids[1]});
 const b=[...f.battles.values()][0];expect(b.defender).toBe(ids[1]);expect(b.mode).toBe('red');expect(b.characters[ids[0]].martial).toBe(5000);
 expect(f.state().payload.world.players[ids[2]].busy).toBe(null);
});
it('test_live_戰敗保護及重新加入_到期依伺服器時間且不重派獎',async()=>{
 const f=fixture();await f.join(1);await f.join(0);await f.call(0,'red',{requestId:req(1),enabled:true});
 const before=structuredClone(f.profiles);await f.call(0,'attack',{requestId:req(2),target:ids[1]});const b=[...f.battles.values()][0];
 f.setNow(b.endsAt);const s=await f.call(1,'world') as OnlineSnapshot;
 const champion=await f.call(0,'world') as OnlineSnapshot;
 expect(s.me.rank).toBe(2);expect(champion.me.rank).toBe(1);
 expect(champion.me.rankOneEarned).toBe(true);expect(s.me.rankOneEarned).toBe(false);
 expect(s.me.protectedUntil).toBe(b.endsAt+ONLINE_TEST.protectionMs);expect(s.battles[0].jadeAwards).toBeUndefined();
 await f.join(1);expect((await f.call(1,'world') as OnlineSnapshot).me.protectedUntil).toBe(s.me.protectedUntil);
 await expect(f.call(0,'attack',{requestId:req(3),target:ids[1]})).rejects.toMatchObject({status:409});
 f.setNow(s.me.protectedUntil);await f.call(0,'attack',{requestId:req(3),target:ids[1]});expect(f.battles.size).toBe(2);
 expect(f.profiles).toEqual(before);expect(f.state().payload.world.players[ids[0]].jadeEarnedTotal??0).toBe(0);
});
it('test_live_多人同時挑戰及重送_只開一場且收據鎖定目標',async()=>{
 const f=fixture();for(let i=0;i<3;i++)await f.join(i);await f.call(0,'red',{requestId:req(1),enabled:true});await f.call(2,'red',{requestId:req(2),enabled:true});
 const input={requestId:req(3),target:ids[1]};const pair=await Promise.all([f.call(0,'attack',input),f.call(0,'attack',input)]);
 expect(pair[0]).toEqual(pair[1]);expect(f.battles.size).toBe(1);
 await expect(f.call(2,'attack',{requestId:req(4),target:ids[1]})).rejects.toMatchObject({status:409});
 await expect(f.call(0,'attack',{...input,target:ids[2]})).rejects.toMatchObject({status:409});
 const a=await f.call(0,'world') as OnlineSnapshot,b=await f.call(1,'world') as OnlineSnapshot;
 expect(a.battles[0].id).toBe(b.battles[0].id);expect(a.battles[0].startedAt).toBe(b.battles[0].startedAt);
 expect(a.liveBattles).toEqual(b.liveBattles);
});
it('test_live_收刀及退出_不冒充免戰或清除敗方保護',async()=>{
 const f=fixture();await f.join(0);await f.join(1);await f.call(0,'red',{requestId:req(1),enabled:true});
 await f.call(0,'attack',{requestId:req(2),target:ids[1]});
 await expect(f.call(1,'liveLeave')).rejects.toMatchObject({status:409});
 await expect(f.call(0,'loadout',{requestId:'normal-loadout-1',external:[],internal:null,qinggong:null})).rejects.toMatchObject({status:409});
 const battle=[...f.battles.values()][0];f.setNow(battle.endsAt);await f.call(1,'world');await f.call(1,'liveLeave');
 await expect(f.call(0,'attack',{requestId:req(3),target:ids[1]})).rejects.toMatchObject({status:409});
 await f.join(1);await f.call(1,'red',{requestId:req(4),enabled:true});
 await f.call(1,'attack',{requestId:req(5),target:ids[0]});expect(f.state().payload.world.players[ids[1]].protectedUntil).toBe(0);
});
it('test_live_篡改傷害排名及非參與者_在交易前拒絕',async()=>{
 const f=fixture();await f.join(0);await f.join(1);
 await expect(f.call(0,'attack',{requestId:req(1),target:ids[1],damage:999999})).rejects.toThrow();
 await expect(f.call(0,'attack',{requestId:req(2),target:ids[1]})).rejects.toMatchObject({status:409});
 await f.call(0,'red',{requestId:req(3),enabled:true});await expect(f.call(0,'attack',{requestId:req(4),target:ids[0]})).rejects.toMatchObject({status:409});
 expect(f.battles.size).toBe(0);
});
it('test_live_直接重入_保留開紅名次銀兩及敗方保護',async()=>{
 const f=fixture();await f.join(0);await f.join(1);
 await f.call(0,'red',{requestId:req(1),enabled:true});
 await f.call(0,'attack',{requestId:req(2),target:ids[1]});
 const battle=[...f.battles.values()][0];f.setNow(battle.endsAt);
 const before=await f.call(1,'world') as OnlineSnapshot;
 const redBefore=await f.call(0,'world') as OnlineSnapshot;
 const joined=await f.join(1) as OnlineSnapshot;
 const redJoined=await f.join(0) as OnlineSnapshot;
 for(const [old,next]of [[before,joined],[redBefore,redJoined]]){
  expect(next.me.protectedUntil).toBe(old.me.protectedUntil);
  expect(next.me.rank).toBe(old.me.rank);expect(next.me.silver).toBe(old.me.silver);
  expect(next.me.live).toEqual(old.me.live);expect(next.me.character).toEqual(old.me.character);
 }
 expect(redJoined.me.live?.red).toBe(true);expect(joined.me.protectedUntil).toBeGreaterThan(joined.serverNow);
});
