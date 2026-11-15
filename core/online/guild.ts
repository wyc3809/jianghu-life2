import {z} from 'zod';
import {GUILD_TEST as P,GUILD_CITIES,guildDay} from '@data/redesign/guildTestParams';
import {appearanceOf} from '@interfaces/appearance';
import type {Guild,GuildWorld,GuildRepository,GuildSnapshot,GuildReport} from '@interfaces/guild';
import type {LifeGameState} from '@interfaces/lifeEngine';
import {OnlineError} from './commands';
import {simulateOnlineBattle} from './combat';
import {sectCombatSnapshot} from './sectWar';
const uuid=z.string().uuid(),empty=z.object({}).strict(),target=z.object({target:uuid}).strict(),city=z.object({city:z.enum(GUILD_CITIES.map(c=>c.id))}).strict();
const schemas={overview:empty,report:z.object({id:uuid}).strict(),create:z.object({name:z.string().trim().min(2).max(12).regex(/^[\p{L}\p{N}·]+$/u),intro:z.string().trim().max(140).default('')}).strict(),apply:target,cancel:empty,accept:target,reject:target,kick:target,transfer:target,role:z.object({target:uuid,role:z.enum(['elder','member'])}).strict(),leave:empty,disband:empty,upgrade:empty,station:city,attack:city,edit:z.object({intro:z.string().trim().max(140)}).strict()};
const envelope=z.object({action:z.enum(Object.keys(schemas) as [keyof typeof schemas,...(keyof typeof schemas)[]]),data:z.unknown().default({}),requestId:uuid.optional()}).strict();
/** 獨立幫會世界；不改私人排名、門派身份、裝備或錢包。 */
export function emptyGuildWorld(now:number):GuildWorld{return {revision:0,payload:{guilds:{},members:{},activity:{},applications:{},cities:Object.fromEntries(GUILD_CITIES.map(c=>[c.id,{id:c.id,guildId:null,defenderId:null,defender:null,heldSince:0,accruedAt:now,protectedUntil:0}])),reports:[]}};}
/** 只按持有期間累積幫庫資材；易手前結清舊幫，讀取只投影。 */
export function accrueGuildCities(world:GuildWorld,now:number){
 const p=world.payload;
 for(const c of Object.values(p.cities)){
  const guild=c.guildId?p.guilds[c.guildId]:null;if(!guild)continue;
  const elapsed=Math.max(0,now-c.accruedAt),hours=Math.floor(Math.min(elapsed,P.incomeCapMs)/3600000);
  if(hours){guild.materials+=hours*P.cityMaterialsPerHour;c.accruedAt=elapsed>P.incomeCapMs?now-elapsed%3600000:c.accruedAt+hours*3600000;}
 }
 for(const [id,a] of Object.entries(p.applications))if(now-a.at>P.applicationMs||!p.guilds[a.guildId])delete p.applications[id];
}
const capacity=(g:Guild)=>P.baseCapacity+(g.level-1)*P.capacityPerLevel;
const membersOf=(w:GuildWorld,id:string)=>Object.values(w.payload.members).filter(m=>m.guildId===id);
function log(g:Guild,now:number,text:string){g.log=[{at:now,text},...g.log].slice(0,40);}
function snapshot(w:GuildWorld,user:string,now:number):GuildSnapshot{
 const p=w.payload,me=p.members[user]??null,guild=me?p.guilds[me.guildId]:null;
 const activity=p.activity[user];
 return structuredClone({revision:w.revision,serverNow:now,me,guild:guild??null,capacity:guild?capacity(guild):0,attackRemaining:me?P.attacksPerDay-(activity?.day===guildDay(now)?activity.attacks:0):0,members:me?membersOf(w,me.guildId):[],applications:me&&me.role!=='member'?Object.values(p.applications).filter(a=>a.guildId===me.guildId):[],application:p.applications[user]??null,guilds:Object.values(p.guilds).map(g=>({id:g.id,name:g.name,intro:g.intro,level:g.level,count:membersOf(w,g.id).length,capacity:capacity(g)})),cities:Object.values(p.cities).map(c=>({id:c.id,guildId:c.guildId,defenderName:c.defender?.name??null,heldSince:c.heldSince,protectedUntil:c.protectedUntil})),reports:p.reports.slice(-30).reverse()});
}
function valid(s:LifeGameState|undefined):s is LifeGameState{return !!s&&s.phase==='playing'&&s.character.alive;}
/** 已驗身份服務：成員唯一、管理權、城池／資材及收據共用同一CAS。 */
export class GuildService{
 constructor(private repo:GuildRepository,private now:()=>number,private entropy:()=>{id:string;seed:number}){}
 async execute(user:string,raw:unknown):Promise<unknown>{
  const input=envelope.parse(raw),data=schemas[input.action].parse(input.data),mutation=!['overview','report'].includes(input.action),signature=JSON.stringify({action:input.action,data}),entropy=this.entropy();
  if(input.action==='report'){const r=await this.repo.report((data as {id:string}).id);if(!r)throw new OnlineError(404,'未找到這場城戰。');return r;}
  if(mutation&&!input.requestId)throw new OnlineError(400,'欠缺操作編號，請重試。');
  for(let attempt=0;attempt<10;attempt++){
   if(mutation){const prior=await this.repo.receipt(user,input.requestId!);if(prior){if(prior.input!==signature)throw new OnlineError(409,'同一指令不可更改內容。');return prior.result;}}
   const world=await this.repo.load(),expected=world.revision,now=this.now(),p=world.payload;accrueGuildCities(world,now);
   if(input.action==='overview')return snapshot(world,user,now);
   const own=(await this.repo.profiles([user]))[user];if(!valid(own))throw new OnlineError(409,'請先保存本世人物及對戰配搭。');
   let me=p.members[user],guild=me?p.guilds[me.guildId]:undefined,report:GuildReport|null=null,result:unknown;
   const requireMember=()=>{if(!me||!guild)throw new OnlineError(403,'請先加入幫會。');};
   const manage=()=>{requireMember();if(me.role==='member')throw new OnlineError(403,'幫主或長老才可處理此事。');};
   const lead=()=>{requireMember();if(me.role!=='leader')throw new OnlineError(403,'只有幫主可處理此事。');};
   const member=(id:string)=>{const m=p.members[id];if(!m||m.guildId!==me?.guildId)throw new OnlineError(409,'對方已不在本幫。');return m;};
   if(input.action==='create'){
    if(me)throw new OnlineError(409,'每人只可加入一個幫會。');
    if(Object.keys(p.guilds).length>=P.maxGuilds||Object.keys(p.members).length>=P.maxMembers)throw new OnlineError(429,'本輪幫會名額已滿。');
    const d=data as {name:string;intro:string},name=d.name.normalize('NFKC');
    if(Object.values(p.guilds).some(g=>g.name.toLocaleLowerCase()===name.toLocaleLowerCase()))throw new OnlineError(409,'已有同名幫會，請換個名字。');
    guild=p.guilds[entropy.id]={id:entropy.id,name,intro:d.intro,leader:user,level:1,materials:0,createdAt:now,log:[]};
    me=p.members[user]={id:user,guildId:guild.id,name:own.character.name,appearance:appearanceOf(own.character),role:'leader',joinedAt:now,lastAttackAt:0,day:guildDay(now),attacks:0};delete p.applications[user];log(guild,now,`${me.name}創立${name}。`);
   }else if(input.action==='apply'){
    if(me)throw new OnlineError(409,'每人只可加入一個幫會。');const id=(data as {target:string}).target,g=p.guilds[id];if(!g)throw new OnlineError(404,'此幫會已不存在。');if(membersOf(world,id).length>=capacity(g))throw new OnlineError(409,'這個幫會暫時滿員。');
    p.applications[user]={user,guildId:id,name:own.character.name,appearance:appearanceOf(own.character),at:now};
   }else if(input.action==='cancel'){delete p.applications[user];
   }else if(input.action==='accept'||input.action==='reject'){
    manage();const id=(data as {target:string}).target,a=p.applications[id];if(!a||a.guildId!==guild!.id)throw new OnlineError(409,'此申請已失效。');
    if(input.action==='accept'){
     if(p.members[id]||Object.keys(p.members).length>=P.maxMembers||membersOf(world,guild!.id).length>=capacity(guild!))throw new OnlineError(409,'名冊已更新或幫會已滿。');
     const s=(await this.repo.profiles([id]))[id];if(!valid(s))throw new OnlineError(409,'對方目前無法入幫。');
     p.members[id]={id,guildId:guild!.id,name:s.character.name,appearance:appearanceOf(s.character),role:'member',joinedAt:now,lastAttackAt:0,day:guildDay(now),attacks:0};log(guild!,now,`${s.character.name}加入本幫。`);
    }delete p.applications[id];
   }else if(['kick','role','transfer'].includes(input.action)){
    manage();const d=data as {target:string;role?:'elder'|'member'},m=member(d.target);if(m.id===user||m.role==='leader')throw new OnlineError(409,'請從其他幫眾選擇。');
    if(input.action==='kick'){if(me.role!=='leader'&&m.role!=='member')throw new OnlineError(403,'只有幫主可請長老離幫。');delete p.members[m.id];log(guild!,now,`${m.name}離開本幫。`);}
    else {lead();if(input.action==='transfer'){me.role='elder';m.role='leader';guild!.leader=m.id;log(guild!,now,`${m.name}接任幫主。`);}else m.role=d.role!;}
   }else if(input.action==='leave'){
    requireMember();if(me.role==='leader')throw new OnlineError(409,'請先傳位；若只餘自己，可解散幫會。');delete p.members[user];log(guild!,now,`${me.name}離開本幫。`);
   }else if(input.action==='disband'){
    lead();if(membersOf(world,guild!.id).length!==1)throw new OnlineError(409,'請先安頓其他幫眾，才可解散。');delete p.members[user];delete p.guilds[guild!.id];
    for(const c of Object.values(p.cities))if(c.guildId===guild!.id)Object.assign(c,{guildId:null,defenderId:null,defender:null,heldSince:0,accruedAt:now,protectedUntil:0});
    for(const [id,a] of Object.entries(p.applications))if(a.guildId===guild!.id)delete p.applications[id];
   }else if(input.action==='edit'){manage();guild!.intro=(data as {intro:string}).intro;
   }else if(input.action==='upgrade'){
    lead();const cost=P.upgradeBase*guild!.level;if(guild!.level>=P.maxLevel)throw new OnlineError(409,'總堂已達本輪上限。');if(guild!.materials<cost)throw new OnlineError(409,'幫庫資材不足。');guild!.materials-=cost;guild!.level++;log(guild!,now,`總堂升至${guild!.level}級。`);
   }else if(input.action==='station'||input.action==='attack'){
    requireMember();const c=p.cities[(data as {city:string}).city],name=GUILD_CITIES.find(v=>v.id===c.id)!.name;
    if(input.action==='station'){
     manage();if(c.guildId!==guild!.id)throw new OnlineError(409,'只有本幫城池可更換守將。');c.defender=sectCombatSnapshot(own).character;c.defenderId=user;log(guild!,now,`${own.character.name}駐守${name}。`);
    }else{
     if(c.guildId===guild!.id)throw new OnlineError(409,'這座城已屬本幫。');if(c.protectedUntil>now)throw new OnlineError(409,'城池整備中，稍後才可再戰。');
     const activity=p.activity[user]??={day:guildDay(now),attacks:0,lastAttackAt:0};
     if(now-activity.lastAttackAt<P.attackCooldownMs)throw new OnlineError(429,'剛完成城戰，請稍候再戰。');
     if(activity.day!==guildDay(now)){activity.day=guildDay(now);activity.attacks=0;}if(activity.attacks>=P.attacksPerDay)throw new OnlineError(429,'今日出戰次數已用盡。');
     activity.lastAttackAt=now;activity.attacks++;Object.assign(me,activity);let captured=true;
     if(c.guildId&&c.defender){
      const battle=simulateOnlineBattle(own.character,c.defender,entropy.seed);captured=battle.winner===0;
      report={id:entropy.id,city:c.id,at:now,guilds:[guild!.id,c.guildId],names:[guild!.name,p.guilds[c.guildId].name],captured,replay:{...battle.forward,title:`${name}爭奪`},look:{sectId:own.character.sectId??null,weaponId:own.character.equipment.weapon??null}};
      const {replay:_replay,look:_look,...summary}=report;p.reports=[...p.reports,summary].slice(-100);
     }
     if(captured){if(c.guildId)log(p.guilds[c.guildId],now,`${name}失守。`);Object.assign(c,{guildId:guild!.id,defenderId:user,defender:sectCombatSnapshot(own).character,heldSince:now,accruedAt:now,protectedUntil:now+P.cityProtectionMs});log(guild!,now,`${own.character.name}奪得${name}。`);}
     result={captured,reportId:report?.id??null};
    }
   }
   world.revision=expected+1;
   if(result===undefined)result=snapshot(world,user,now);
   if(await this.repo.save(world,expected,report,{user_id:user,request_id:input.requestId!,input:signature,result}))return result;
  }
  throw new OnlineError(503,'幫會名冊正在更新，請用原操作重試。');
 }
}
