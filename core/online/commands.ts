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
    const result = simulateOnlineBattle(a.character, b.character, entropy.seed);
    const battleId = entropy.battleId;
    a.protectedUntil = 0; a.busy = battleId; b.busy = battleId;
    world.battles.push({ id: battleId, attacker: id, defender: b.id,
      winner: result.winner === 0 ? id : result.winner === 1 ? b.id : null,
      startedAt: now, endsAt: now + ONLINE_TEST.battleMs, settledAt: null,
      before: { [id]: a.rank, [b.id]: b.rank }, after: null,
      replays: { [id]: result.forward, [b.id]: result.reverse } as typeof world.battles[number]['replays'],
      characters: { [id]: characterForPreset(structuredClone(a.character),'duel'), [b.id]: characterForPreset(structuredClone(b.character),'duel') },
    });
    return { battleId };
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
