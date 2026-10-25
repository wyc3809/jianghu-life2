import type { AncestryMeta, AccountEconomy } from '@interfaces/ancestry';
import type { LifeGameState } from '@interfaces/lifeEngine';
import { DAILY_TASK_JADE, DAILY_TASK_LIMIT, GUIDE_STEP_JADE, GUIDE_MAJOR_JADE, BREAKTHROUGH_FIRST_JADE, BREAKTHROUGH_JADE_STEP, LEGACY_TIER_RECEIPTS } from '@data/redesign/martialEconomyParams';
import { NEWBIE_TRIAL } from '@data/redesign/newbie';
import { ownedVolumes } from './volumes';
import { martialSlots, supportMartialSlots } from './martialLoadout';

export const DAILY_TASKS = [
  { id:'spar', name:'演武歷練', detail:'擊敗20名演武對手', target:20 },
  { id:'months', name:'行走江湖', detail:'推進3個月份', target:3 },
  { id:'practice', name:'勤修武學', detail:'完成3次有效修煉', target:3 },
  { id:'harvest', name:'收取所得', detail:'領取一次非零掛機收成', target:1 },
  { id:'wins', name:'交手取勝', detail:'贏得一場江湖交手', target:1 },
] as const;
export type DailyTaskId = typeof DAILY_TASKS[number]['id'];

/** 香港時間每日凌晨四時換日，與多人伺服器共用。 */
export function economyDay(now: number): string { return new Date(now + 4 * 3600_000).toISOString().slice(0,10); }

function counters(state: LifeGameState): Record<string,number> {
  const c=state.character;
  return { spar:Number(c.flags.spar_foes_total ?? 0), months:c.stats.monthsLived, practice:Number(c.flags.practice_actions ?? 0), harvest:Number(c.flags.harvest_claims ?? 0), wins:c.stats.combatsWon };
}
function lifeKey(s:LifeGameState) { return `${s.seed}:${s.character.flags.legacy_generation ?? 1}:${s.character.name}`; }

/** 帳戶層只記已知舊境界，不追發舊突破；新突破由最高紀錄一次入帳。 */
export function settleAccountEconomy(meta:AncestryMeta,state:LifeGameState,now:number):number {
  const c=state.character, current=counters(state), key=lifeKey(state);
  meta.economy ??= { highestTier:Math.max(Number(c.flags.economy_baseline_tier ?? c.cultivation.tier),...([...(meta.jadeAchv??[]),...(meta.milestones??[])].map(id=>LEGACY_TIER_RECEIPTS[id]??0))), guides:[], rewards:[], totals:{}, lifeKey:key, last:current };
  const e=meta.economy;
  if(e.lifeKey===key) for(const [id,v]of Object.entries(current)) e.totals[id]=(e.totals[id]??0)+Math.max(0,v-(e.last[id]??v));
  e.lifeKey=key;e.last=current;
  const day=economyDay(now);
  // 時鐘回撥不重開舊一天，避免已領項目被清空。
  if(!e.daily || day>e.daily.day)e.daily={day,selected:[],claimed:[],base:{...e.totals}};
  let jade=0;
  for(let tier=e.highestTier+1;tier<=c.cultivation.tier;tier++) jade+=BREAKTHROUGH_FIRST_JADE+(tier-1)*BREAKTHROUGH_JADE_STEP;
  e.highestTier=Math.max(e.highestTier,c.cultivation.tier);
  c.flags.account_highest_tier=e.highestTier;
  const queue=String(c.flags.account_reward_queue ?? '[]');
  try { for(const r of JSON.parse(queue) as {id:string;amount:number}[]) if(r.id.startsWith('huashan:')&&!e.rewards.includes(r.id)&&Number.isSafeInteger(r.amount)&&r.amount>0){e.rewards.push(r.id);jade+=r.amount;} } catch { /* 舊損壞旗標不派獎。 */ }
  delete c.flags.account_reward_queue;
  return jade;
}

/** 每個賽事輪次只排一次；帳戶結算另有跨代收據。 */
export function queueAccountReward(state:LifeGameState,id:string,amount:number):void {
  let list:{id:string;amount:number}[]=[];
  try { list=JSON.parse(String(state.character.flags.account_reward_queue ?? '[]')); }catch { /* 用空佇列後備。 */ }
  if(!list.some(r=>r.id===id))list.push({id,amount});
  state.character.flags.account_reward_queue=JSON.stringify(list);
}

/** 已選日常可以取消，但已領項目保留名額；每日最多三項。 */
export function selectDailyTask(meta:AncestryMeta,id:string):boolean {
  const d=meta.economy?.daily;
  if(!d||!DAILY_TASKS.some(t=>t.id===id)||d.claimed.includes(id))return false;
  if(d.selected.includes(id)){d.selected=d.selected.filter(x=>x!==id);return true;}
  if(d.selected.length>=DAILY_TASK_LIMIT)return false;
  d.selected.push(id);return true;
}

/** 純讀取當日進度，跨代改角色不重置帳戶已領記錄。 */
export function dailyProgress(e:AccountEconomy|undefined,id:string):number {
  return Math.max(0,(e?.totals[id]??0)-(e?.daily?.base[id]??0));
}

/** 每項每日只領一次，重送／連點不再入帳。 */
export function claimDailyTask(meta:AncestryMeta,id:string):boolean {
  const d=meta.economy?.daily,t=DAILY_TASKS.find(t=>t.id===id);
  if(!d||!t||!d.selected.includes(id)||d.claimed.includes(id)||d.claimed.length>=DAILY_TASK_LIMIT||dailyProgress(meta.economy,id)<t.target)return false;
  d.claimed.push(id);meta.jade??={free:0,paidTest:0};meta.jade.free+=DAILY_TASK_JADE;return true;
}

export const GROWTH_GUIDES = [
  {id:'trial',name:'初試身手',detail:'完成新手試煉',major:false,done:(s:LifeGameState)=>Boolean(s.character.flags.newbie_trial_won)},
  {id:'equip',name:'整裝出發',detail:'裝備試煉所得兵器',major:false,done:(s:LifeGameState)=>Boolean(s.character.flags.newbie_trial_won)&&s.character.equipment.weapon===NEWBIE_TRIAL.rewardGearId},
  {id:'support',name:'內外兼修',detail:'裝備內功及身法',major:false,done:(s:LifeGameState)=>Object.values(supportMartialSlots(s.character)).every(Boolean)},
  {id:'duel_set',name:'整備對戰',detail:'在人物頁保存對戰配搭',major:false,done:(s:LifeGameState)=>Boolean(s.character.flags.duel_loadout_saved)},
  {id:'volumes3',name:'三式成章',detail:'任一外功學得三卷',major:true,done:(s:LifeGameState)=>s.character.skills.some(id=>ownedVolumes(s.character,id).length>=3)},
  {id:'volumes7',name:'七卷合璧',detail:'任一外功集齊七卷並學習',major:true,done:(s:LifeGameState)=>s.character.skills.some(id=>ownedVolumes(s.character,id).length===7)},
  {id:'first_boss',name:'首戰告捷',detail:'通過演武台第一關',major:true,done:(s:LifeGameState)=>Number(s.character.flags.spar_stage??1)>1},
  {id:'breakthrough',name:'內息初成',detail:'首次突破境界',major:true,done:(s:LifeGameState)=>s.character.cultivation.tier>=1},
  {id:'five_arts',name:'五藝在身',detail:'裝備五門外功',major:true,done:(s:LifeGameState)=>martialSlots(s.character).every(Boolean)},
] as const;

/** 成長引導按帳戶目標收據派一次；唔佔日常三項額度。 */
export function claimGrowthGuide(meta:AncestryMeta,state:LifeGameState,id:string):boolean {
  const e=meta.economy,g=GROWTH_GUIDES.find(g=>g.id===id);
  if(!e||!g||e.guides.includes(id)||!g.done(state))return false;
  e.guides.push(id);meta.jade??={free:0,paidTest:0};meta.jade.free+=g.major?GUIDE_MAJOR_JADE:GUIDE_STEP_JADE;return true;
}

/** 服務端累計派獎的來源高水位，重播／輪詢／重新登入不重複入帳。 */
export function receiveOnlineJade(meta:AncestryMeta,source:string,total:number):number {
  const e=meta.economy;
  if(!e||!source||!Number.isSafeInteger(total)||total<0)return 0;
  e.onlineCredited??={};
  const before=e.onlineCredited[source]??0;
  if(total<=before)return 0;
  const gain=total-before;e.onlineCredited[source]=total;
  meta.jade??={free:0,paidTest:0};meta.jade.free+=gain;return gain;
}
