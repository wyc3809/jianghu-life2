import { z } from 'zod';
import { getSkillDef } from '@data/skills/catalog';
import { ONLINE_TEST } from '@data/redesign/onlineTestParams';
import type { OnlineAccountId, OnlineWorld } from '@interfaces/online';
import { simulateOnlineBattle } from './combat';

const accountSchema = z.enum(['river', 'cloud']);
const requestId = z.string().min(8).max(100).regex(/^[a-zA-Z0-9_-]+$/);
const challengeSchema = z.object({ requestId, target: accountSchema }).strict();
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

/** 只修改交易內嘅權威世界；種子／戰報編號由伺服器提供。 */
export function applyOnlineCommand(world: OnlineWorld, now: number, id: OnlineAccountId, kind: OnlineCommand, raw: unknown, entropy: { seed: number; battleId: string }): unknown {
  if (kind === 'challenge') {
    const input = challengeSchema.parse(raw);
    if (input.target === id) throw new OnlineError(400, '不能挑戰自己。');
    const a = world.players[id], b = world.players[input.target];
    if (a.busy || b.busy) throw new OnlineError(409, '其中一方仍在交戰，請稍後再試。');
    if (b.protectedUntil > now) throw new OnlineError(409, '對手正受戰敗保護。');
    const result = simulateOnlineBattle(a.character, b.character, entropy.seed);
    const battleId = entropy.battleId;
    a.protectedUntil = 0; a.busy = battleId; b.busy = battleId;
    world.battles.push({ id: battleId, attacker: id, defender: b.id,
      winner: result.winner === 0 ? id : result.winner === 1 ? b.id : null,
      startedAt: now, endsAt: now + ONLINE_TEST.battleMs, settledAt: null,
      before: { river: world.players.river.rank, cloud: world.players.cloud.rank }, after: null,
      replays: { [id]: result.forward, [b.id]: result.reverse } as typeof world.battles[number]['replays'],
      characters: { river: structuredClone(world.players.river.character), cloud: structuredClone(world.players.cloud.character) },
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
    if (skill && (!c.skills.includes(skill) || getSkillDef(skill)?.kind !== kind)) throw new OnlineError(400, '未學識或武學類型不符。');
  };
  input.external.forEach(skill => validate(skill, 'external'));
  validate(input.internal, 'internal'); validate(input.qinggong, 'qinggong');
  c.equippedArts = [...input.external, ...Array<null>(5 - input.external.length).fill(null)];
  c.supportArts = { internal: input.internal, qinggong: input.qinggong };
  return { ok: true };
}
