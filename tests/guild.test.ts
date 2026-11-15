import {expect,it} from 'vitest';
import {GuildService,emptyGuildWorld} from '../core/online/guild';
import type {GuildRepository,GuildReceipt,GuildReport,GuildSnapshot} from '../interfaces/guild';
import {createNewLife} from '../core/life/gameState';
import {GUILD_CITIES,GUILD_TEST as P} from '../data/redesign/guildTestParams';
const id=(n:number)=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const req=(n:number)=>`10000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
function fixture(){
 let now=Date.parse('2026-11-15T12:00:00Z'),world=emptyGuildWorld(now),counter=0,requests=0,commits=0;
 const profiles=Object.fromEntries([1,2,3,4].map(i=>[id(i),createNewLife({seed:40+i,name:'測試幫眾'+i,skipCoach:true})]));profiles[id(1)].character.martial=5000;profiles[id(3)].character.martial=1;
 const receipts=new Map<string,GuildReceipt>(),reports=new Map<string,GuildReport>();
 const repo:GuildRepository={load:async()=>structuredClone(world),profiles:async ids=>structuredClone(Object.fromEntries(ids.filter(i=>profiles[i]).map(i=>[i,profiles[i]]))),receipt:async(u,r)=>structuredClone(receipts.get(u+r)??null),report:async r=>structuredClone(reports.get(r)??null),save:async(w,expected,report,receipt)=>{if(world.revision!==expected)return false;world=structuredClone(w);commits++;if(report)reports.set(report.id,structuredClone(report));receipts.set(receipt.user_id+receipt.request_id,structuredClone(receipt));return true;}};
 const service=new GuildService(repo,()=>now,()=>({id:`20000000-0000-4000-8000-${String(++counter).padStart(12,'0')}`,seed:42}));
 const call=(n:number,action:string,data:unknown={},requestId=req(++requests))=>service.execute(id(n),{action,data,...['overview','report'].includes(action)?{}:{requestId}});
 const create=async(n:number)=>(await call(n,'create',{name:'測試幫會'+n}) as GuildSnapshot).guild!.id;
 const join=async(n:number,guild:string,leader=1)=>{await call(n,'apply',{target:guild});await call(leader,'accept',{target:id(n)});};
 return {call,create,join,profiles,reports,world:()=>world,advance:(ms:number)=>{now+=ms;},commits:()=>commits};
}
it('test_guild_成員唯一及管理權_不靠前端職位或跨幫越權',async()=>{
 const f=fixture(),a=await f.create(1),b=await f.create(3);await f.call(2,'apply',{target:a});
 await expect(f.call(3,'accept',{target:id(2)})).rejects.toMatchObject({status:409});
 await expect(f.call(2,'accept',{target:id(2)})).rejects.toMatchObject({status:403});
 await f.call(1,'accept',{target:id(2)});await expect(f.call(2,'apply',{target:b})).rejects.toMatchObject({status:409});
 await f.call(1,'transfer',{target:id(2)});await f.join(4,a,2);await f.call(2,'role',{target:id(4),role:'elder'});
 await expect(f.call(1,'kick',{target:id(4)})).rejects.toMatchObject({status:403});
 await expect(f.call(1,'transfer',{target:id(4)})).rejects.toMatchObject({status:403});
 expect(f.world().payload.guilds[a].leader).toBe(id(2));expect(Object.values(f.world().payload.members).filter(m=>m.id===id(2))).toHaveLength(1);
 expect((await f.call(3,'overview') as GuildSnapshot).members.map(m=>m.id)).toEqual([id(3)]);
});
it('test_guild_同時接納與重送_只有一名成員且編號鎖定內容',async()=>{
 const f=fixture(),a=await f.create(1);await f.call(2,'apply',{target:a});const before=f.commits(),requestId=req(900);
 const results=await Promise.all([f.call(1,'accept',{target:id(2)},requestId),f.call(1,'accept',{target:id(2)},requestId)]);
 expect(results[0]).toEqual(results[1]);expect(f.commits()).toBe(before+1);expect(Object.keys(f.world().payload.members)).toHaveLength(2);
 await expect(f.call(1,'accept',{target:id(4)},requestId)).rejects.toMatchObject({status:409});
 await expect(f.call(3,'create',{name:'測試幫會1'})).rejects.toMatchObject({status:409});
});
it('test_guild_城戰沿真數值及離線守將_易手前結清舊幫且只扣一次',async()=>{
 const f=fixture(),a=await f.create(1),b=await f.create(3),before=structuredClone(f.profiles);
 await f.call(3,'attack',{city:'luoyang'});f.advance(3600000);const revision=f.world().revision;
 const views=await Promise.all(Array.from({length:100},()=>f.call(3,'overview') as Promise<GuildSnapshot>));
 expect(views.every(s=>s.guild!.materials===P.cityMaterialsPerHour)).toBe(true);expect(f.world().revision).toBe(revision);
 const command=req(901),result=await f.call(1,'attack',{city:'luoyang'},command) as {captured:boolean;reportId:string};expect(result.captured).toBe(true);
 expect(await f.call(1,'attack',{city:'luoyang'},command)).toEqual(result);expect(f.world().payload.activity[id(1)].attacks).toBe(1);
 expect(f.world().payload.guilds[b].materials).toBe(P.cityMaterialsPerHour);expect(f.world().payload.guilds[a].materials).toBe(0);
 expect(f.world().payload.cities.luoyang.guildId).toBe(a);expect(f.reports.size).toBe(1);expect(f.profiles).toEqual(before);
 const s=await f.call(3,'overview') as GuildSnapshot;expect(s.cities[0]).not.toHaveProperty('defender');expect(s.cities[0]).not.toHaveProperty('defenderId');
 await expect(f.call(3,'attack',{city:'luoyang'})).rejects.toMatchObject({status:409});
});
it('test_guild_並發搶同一城_只有一幫佔領且敗請求不扣次數',async()=>{
 const f=fixture();await f.create(1);await f.create(3);
 const result=await Promise.allSettled([f.call(1,'attack',{city:'gusu'}),f.call(3,'attack',{city:'gusu'})]);
 expect(result.filter(r=>r.status==='fulfilled')).toHaveLength(1);expect(Object.values(f.world().payload.activity).reduce((s,a)=>s+a.attacks,0)).toBe(1);
});
it('test_guild_資材建設與重送_只消耗一次而且不改私人錢包',async()=>{
 const f=fixture();await f.create(1);await f.call(1,'attack',{city:'luoyang'});f.advance(P.attackCooldownMs);await f.call(1,'attack',{city:'gusu'});f.advance(10*3600000);const profiles=structuredClone(f.profiles),requestId=req(902);
 const result=await Promise.all([f.call(1,'upgrade',{},requestId),f.call(1,'upgrade',{},requestId)]) as GuildSnapshot[];
 expect(result[0]).toEqual(result[1]);expect(result[0].guild!.level).toBe(2);expect(result[0].guild!.materials).toBe(100);expect(result[0].capacity).toBe(P.baseCapacity+P.capacityPerLevel);expect(f.profiles).toEqual(profiles);
 await expect(f.call(1,'upgrade')).rejects.toMatchObject({status:409});
});
it('test_guild_退幫重建_不可洗出戰次數且每日按服務端重置',async()=>{
 const f=fixture(),a=await f.create(1);await f.join(2,a);
 for(const city of GUILD_CITIES.slice(0,P.attacksPerDay)){await f.call(1,'attack',{city:city.id});f.advance(P.attackCooldownMs);}
 await f.call(1,'transfer',{target:id(2)});await f.call(1,'leave');await f.call(1,'create',{name:'再起新幫'});
 expect((await f.call(1,'overview') as GuildSnapshot).attackRemaining).toBe(0);await expect(f.call(1,'attack',{city:'yangzhou'})).rejects.toMatchObject({status:429});
 f.advance(86400000);await f.call(1,'attack',{city:'yangzhou'});expect(f.world().payload.activity[id(1)].attacks).toBe(1);
});
it('test_guild_解散及非法輸入_釋放城池申請但不信任外送戰果',async()=>{
 const f=fixture(),a=await f.create(1);await f.call(2,'apply',{target:a});await f.call(1,'attack',{city:'luoyang'});
 await expect(f.call(1,'attack',{city:'gusu',winner:true})).rejects.toThrow();await expect(f.call(1,'role',{target:id(2),role:'leader'})).rejects.toThrow();
 await f.call(1,'disband');expect(f.world().payload.guilds).toEqual({});expect(f.world().payload.applications).toEqual({});expect(f.world().payload.cities.luoyang.guildId).toBeNull();
});
it('test_guild_離線資材上限及失效申請_補讀不寫入亦不重複累積',async()=>{
 const f=fixture(),a=await f.create(1);await f.call(1,'attack',{city:'luoyang'});await f.call(2,'apply',{target:a});f.advance(8*86400000);const before=f.commits();
 const result=await f.call(1,'overview') as GuildSnapshot;expect(result.guild!.materials).toBe(48*P.cityMaterialsPerHour);expect(result.applications).toEqual([]);expect(f.commits()).toBe(before);
 await f.call(1,'edit',{intro:'同心護城'});expect((await f.call(1,'overview') as GuildSnapshot).guild!.materials).toBe(48*P.cityMaterialsPerHour);
});
