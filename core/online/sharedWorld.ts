import { appearanceOf } from '../../interfaces/appearance';
import { duelPreset } from '../life/loadoutPresets';
import { z } from 'zod';
import type { OnlineBattle, OnlineSnapshot, OnlineWorld } from '@interfaces/online';
import { ONLINE_TEST } from '@data/redesign/onlineTestParams';
import { applyOnlineCommand, parseOnlineCommand, compatibleReceiptInput, OnlineError, selectOnlineOpponent } from './commands';
import { createOnlineFixture } from './fixtures';
import { settleOnlineWorld } from './rules';
import type { LifeCharacter } from '@interfaces/lifeEngine';

export interface SharedWorld {
  revision: number;
  payload: { world: OnlineWorld; presence: Record<string, { user: string; until: number }> };
}
export interface WorldReceipt { user_id: string; request_id: string; input: string; result: unknown }
export interface SharedRepository {
  /** 從已驗證身份的遊戲存檔讀人物，唔接受挑戰請求夾帶戰力。 */
  profile?(user:string):Promise<LifeCharacter|null>;
  load(): Promise<SharedWorld>;
  receipt(user: string, request: string): Promise<WorldReceipt | null>;
  history(user: string): Promise<OnlineBattle[]>;
  confirmed(user: string): Promise<string[]>;
  /** 世界、戰報及收據喺同一Postgres交易CAS提交。 */
  save(state: SharedWorld, expected: number, battles: OnlineBattle[], receipt: WorldReceipt | null): Promise<boolean>;
}
const envelope = z.object({ action: z.enum(['register', 'world', 'heartbeat', 'leave', 'logout', 'challenge', 'claim', 'loadout']), clientId: z.uuid(), data: z.unknown().optional() }).strict();
const empty = z.object({}).strict();
const registration = z.object({ name: z.string().trim().min(1).max(12).regex(/^[\p{L}\p{N}·]+$/u) }).strict();

/** 舊版尚無人物頁雙配搭時，保留經合法欄位指令保存的對戰套。 */
function refreshedProfile(profile:LifeCharacter,prior:LifeCharacter|undefined):LifeCharacter {
  if(profile.flags.cloud_has_duel_preset===false&&prior?.flags.duel_loadout_saved){
    profile.combatLoadout=duelPreset({...profile,combatLoadout:prior.combatLoadout});
    profile.flags.duel_loadout_saved=true;
  }
  return profile;
}

/** 全部玩家共用一個非同步江湖；任何身份可入籍，唔需要開房或等對手在線。 */
export class SharedWorldService {
  constructor(private repo: SharedRepository, private now: () => number, private entropy: () => { seed: number; battleId: string }) {}
  /** 按可信身份取自己角色；CAS競爭重試，戰報／收據同時入帳。 */
  async execute(user: string, raw: unknown): Promise<unknown> {
    const input = envelope.parse(raw), data = input.data ?? {}, entropy = this.entropy();
    for (let attempt = 0; attempt < 10; attempt++) {
      const state = await this.repo.load(), expected = state.revision, now = this.now();
      const { world, presence } = state.payload;
      settleOnlineWorld(world, now);
      if (input.action === 'register') {
        const { name } = registration.parse(data);
        const profile=this.repo.profile ? await this.repo.profile(user) : undefined;
        if(this.repo.profile && !profile)throw new OnlineError(409,'請先建立並保存人物，再踏入江湖。');
        if (!world.players[user]) {
          const players = Object.values(world.players);
          if (players.length >= ONLINE_TEST.maxPublicPlayers) throw new OnlineError(429, '共用江湖已達今輪封測人數上限。');
          const player = createOnlineFixture(now).players.river;
          player.id = user; player.rank = Math.max(0, ...players.map(p => p.rank)) + 1;
          player.character.name = name; player.character.martial = 80;
          player.character.maxHealth = player.character.health = 360;
          player.character.skillRanks = Object.fromEntries(player.character.skills.map(id => [id, 3]));
          world.players[user] = player;
        }
        if(profile && !world.players[user].busy)world.players[user].character=refreshedProfile(profile,world.players[user].character);
      }
      const me = world.players[user];
      if (!me) throw new OnlineError(404, '未有江湖身份，請先入籍。');
      for (const [key, value] of Object.entries(presence)) if (value.until <= now) delete presence[key];
      const key = `${user}:${input.clientId}`;
      if (input.action === 'register' || input.action === 'heartbeat') {
        if (input.action !== 'register') empty.parse(data);
        if (me.onlineUntil <= now) me.offlineAccruedMs = 0;
        if (!presence[key] && Object.values(presence).filter(p => p.user === user).length >= 10) throw new OnlineError(429, '請先關閉其他江湖分頁。');
        presence[key] = { user, until: now + ONLINE_TEST.presenceLeaseMs };
      } else if (input.action === 'leave' || input.action === 'logout') { empty.parse(data); delete presence[key]; }
      else if (input.action === 'world') empty.parse(data);
      for (const p of Object.values(world.players)) p.onlineUntil = Math.max(now, ...Object.values(presence).filter(v => v.user === p.id).map(v => v.until));
      let result: unknown, receipt: WorldReceipt | null = null;
      if (input.action === 'challenge' || input.action === 'claim' || input.action === 'loadout') {
        const command = parseOnlineCommand(input.action, data), signature = JSON.stringify({ action: input.action, ...command });
        const old = await this.repo.receipt(user, command.requestId);
        if (old) {
          if (compatibleReceiptInput(old.input) !== signature) throw new OnlineError(409, '同一指令編號不可變更內容。');
          result = old.result;
        } else {
          if(input.action==='challenge' && this.repo.profile) {
            if(me.busy)throw new OnlineError(409,'交手仍在結算。');
            const profile=await this.repo.profile(user);
            if(!profile)throw new OnlineError(409,'尚未取得已保存的對戰配搭，請稍後再試。');
            me.character=refreshedProfile(profile,me.character);
            const opponent=selectOnlineOpponent(world,now,user,entropy.seed);
            const defense=await this.repo.profile(opponent.id);
            if(defense)opponent.character=refreshedProfile(defense,opponent.character);
          }
          result = applyOnlineCommand(world, now, user, input.action, command, entropy);
          receipt = { user_id: user, request_id: command.requestId, input: signature, result };
        }
      }
      const battles = world.battles;
      // 完成戰報另表保存，世界只保留待結算場次，唔隨歷史戰鬥無限變大。
      world.battles = battles.filter(b => b.settledAt === null);
      world.revision = state.revision = expected + 1;
      if (!await this.repo.save(state, expected, battles, receipt)) continue;
      if (input.action === 'leave' || input.action === 'logout') return { ok: true };
      if (result !== undefined) return result;
      const history = await this.repo.history(user), confirmed = await this.repo.confirmed(user);
      return sharedSnapshot(world, user, now, history, confirmed);
    }
    throw new OnlineError(503, '江湖消息繁忙，稍後可用同一指令重試。');
  }
}

/** 只回傳自己戰報／收據及其他玩家可公開嘅身份與排名。 */
export function sharedSnapshot(world: OnlineWorld, user: string, now: number, battles: OnlineBattle[], confirmedRequests: string[]): OnlineSnapshot {
  return structuredClone({ serverNow: now, revision: world.revision, me: world.players[user], population: Object.keys(world.players).length,
    peers: Object.values(world.players).sort((a, b) => a.rank - b.rank).map(p => ({ id: p.id, name: p.character.name, appearance: appearanceOf(p.character), rank: p.rank, online: p.onlineUntil > now, protectedUntil: p.protectedUntil, busy: p.busy })),
    battles, confirmedRequests, params: { protectionMs: ONLINE_TEST.protectionMs, onlineSilverPerMinute: ONLINE_TEST.onlineSilverPerMinute, offlineSilverPerMinute: ONLINE_TEST.offlineSilverPerMinute, offlineCapMs: ONLINE_TEST.offlineCapMs },
  });
}
