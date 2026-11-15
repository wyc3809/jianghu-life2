import { z } from 'zod';
import { getSkillDef } from '@data/skills/catalog';
import { ONLINE_TEST } from '@data/redesign/onlineTestParams';
import type { OnlineAccountId, OnlineWorld } from '@interfaces/online';
import { simulateOnlineBattle } from './combat';
import { createRng } from '@core/random';
import { SAME_RANK_MATCH_WEIGHT } from '@data/redesign/martialEconomyParams';
import { jianghuRankTier } from '@core/life/jianghuRank';
import { characterForPreset, ensureCombatPreset } from '@core/life/loadoutPresets';
import { economyDay } from '@core/life/accountEconomy';

const requestId = z.string().min(8).max(100).regex(/^[a-zA-Z0-9_-]+$/);
// 舊客戶端會帶target；只接受作相容輸入，排程及收據一律移除。
const challengeSchema = z.object({ requestId, target:z.string().min(1).max(80).optional() }).strict().transform(({requestId})=>({requestId}));
const claimSchema = z.object({ requestId }).strict();
const loadoutSchema = z.object({ requestId,
  external: z.array(z.string().max(80)).max(5),
  internal: z.string().max(80).nullable(), qinggong: z.string().max(80).nullable(),
}).strict();
export class OnlineError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export type OnlineCommand = 'challenge' | 'claim' | 'loadout';

/** Node同雲端共用驗證，拒絕客戶端夾帶戰力、排名或結果。 */
export function parseOnlineCommand(kind: OnlineCommand, raw: unknown) {
  return { challenge: challengeSchema, claim: claimSchema, loadout: loadoutSchema }[kind].parse(raw);
}

/** 舊挑戰收據沿用原戰果；目標欄位不影響新版隨機指令身份。 */
export function compatibleReceiptInput(raw:string):string {
  try { const input=JSON.parse(raw);if((input.action??input.kind)==='challenge'){delete input.target;return JSON.stringify(input);} }catch { /* 損壞收據不視為相同。 */ }
  return raw;
}

/** 服務端按未領對手及同段權重抽選；不接受客戶端目標。 */
export function selectOnlineOpponent(world: OnlineWorld, now: number, id: string, seed: number) {
  const a = world.players[id];
  if(!a)throw new OnlineError(404,'尚未入籍江湖。');
  if(a.busy)throw new OnlineError(409,'其中一方仍在交戰，請稍後再試。');
  const candidates=Object.values(world.players).filter(p=>p.id!==id&&!p.busy&&p.protectedUntil<=now);
  const fresh=candidates.filter(p=>a.jadeDay?.day!==economyDay(now)||!a.jadeDay.opponents.includes(p.id));
  const pool=fresh.length?fresh:candidates;
  if(!pool.length)throw new OnlineError(409,Object.values(world.players).some(p=>p.id!==id&&p.protectedUntil>now)?'對手正受戰敗保護，暫無可配對的對手。':'暫無可配對的對手，請稍後再試。');
  const weights=pool.map(p=>jianghuRankTier(p.rank)===jianghuRankTier(a.rank)?SAME_RANK_MATCH_WEIGHT:1);
  let roll=createRng(seed ^ 0x75ab).nextFloat()*weights.reduce((n,v)=>n+v,0),index=0;
  for(;index<pool.length-1;index++){if(roll<weights[index])break;roll-=weights[index];}
  return pool[index];
}

/** 只修改交易內嘅權威世界；種子／戰報編號由伺服器提供。 */
export function applyOnlineCommand(world: OnlineWorld, now: number, id: OnlineAccountId, kind: OnlineCommand, raw: unknown, entropy: { seed: number; battleId: string }): unknown {
  if (kind === 'challenge') {
    challengeSchema.parse(raw);
    const a = world.players[id];
    const b = selectOnlineOpponent(world, now, id, entropy.seed);
    return startOnlineBattle(world, now, a.id, b.id, entropy);
  }
  if (kind === 'claim') {
    claimSchema.parse(raw);
    const p = world.players[id], online = p.pendingOnline, offline = p.pendingOffline;
    p.silver += online + offline; p.pendingOnline = 0; p.pendingOffline = 0;
    return { online, offline, total: online + offline };
  }
  const input = loadoutSchema.parse(raw);
  const p = world.players[id], c = p.character;
  if (p.busy) throw new OnlineError(409, '交戰期間不能調整武學。');
  if (new Set(input.external).size !== input.external.length) throw new OnlineError(400, '外功不能重複。');
  const validate = (skill: string | null, kind: string) => {
    if (skill && (!c.skills.includes(skill) || getSkillDef(skill)?.kind !== kind)) throw new OnlineError(400, '尚未習得此武學，或武學類型不符。');
  };
  input.external.forEach(skill => validate(skill, 'external'));
  validate(input.internal, 'internal'); validate(input.qinggong, 'qinggong');
  ensureCombatPreset(c);
  c.combatLoadout!.external = [...input.external, ...Array<null>(5 - input.external.length).fill(null)];
  c.combatLoadout!.internal = input.internal; c.combatLoadout!.qinggong = input.qinggong;
  c.flags.duel_loadout_saved = true;
  return { ok: true };
}


/** 指定目標只供同遊開紅使用；普通隨機挑戰仍由伺服器抽選。 */
export function startOnlineBattle(world: OnlineWorld, now: number, attacker: string, defender: string, entropy: { seed:number; battleId:string }, red = false) {
  const a=world.players[attacker], b=world.players[defender];
  if(!a||!b||a===b)throw new OnlineError(409,'此刻無法與這位俠客交手。');
  if(a.busy||b.busy)throw new OnlineError(409,'其中一方仍在交戰，請稍後再試。');
  if(b.protectedUntil>now)throw new OnlineError(409,'對方正受戰敗保護。');
  if(red&&(!a.live?.joined||!b.live?.joined||!a.live.red))throw new OnlineError(409,'雙方須已加入同遊，並由出手者開紅。');
  const result=simulateOnlineBattle(a.character,b.character,entropy.seed),battleId=entropy.battleId;
  const hitCount=result.forward.rounds.reduce((n,r)=>n+r.hits.length,0);
  const startedAt=red?now+1200:now;
  a.protectedUntil=0;a.busy=b.busy=battleId;
  world.battles.push({id:battleId,attacker,defender,winner:result.winner===0?attacker:result.winner===1?defender:null,
    startedAt,endsAt:startedAt+(red?Math.min(45000,6000+hitCount*1500):ONLINE_TEST.battleMs),settledAt:null,
    ...(red?{mode:'red' as const,hitMs:1500}:{}),before:{[attacker]:a.rank,[defender]:b.rank},after:null,
    replays:{[attacker]:{...result.forward,title:red?'同遊交鋒':result.forward.title},[defender]:{...result.reverse,title:red?'同遊交鋒':result.reverse.title}},
    characters:{[attacker]:characterForPreset(structuredClone(a.character),'duel'),[defender]:characterForPreset(structuredClone(b.character),'duel')}});
  return {battleId};
}
