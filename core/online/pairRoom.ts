import { z } from 'zod';
import type { OnlineAccountId, OnlineSnapshot, OnlineWorld } from '@interfaces/online';
import { ONLINE_TEST } from '@data/redesign/onlineTestParams';
import { createOnlineFixture } from './fixtures';
import { settleOnlineWorld } from './rules';
import { applyOnlineCommand, OnlineError, parseOnlineCommand } from './commands';

export interface PairRoom {
  id: string;
  host_id: string;
  guest_id: string | null;
  invite: string;
  revision: number;
  payload: {
    world: OnlineWorld;
    presence: Record<string, { seat: OnlineAccountId; until: number }>;
    receipts: Record<string, { input: string; result: unknown }>;
  };
}
export interface PairRepository {
  load(id: string): Promise<PairRoom | null>;
  byInvite(invite: string): Promise<PairRoom | null>;
  byHost(user: string): Promise<PairRoom | null>;
  insert(room: PairRoom): Promise<boolean>;
  /** 比較revision再寫入，同時請求只會有一個成功。 */
  save(room: PairRoom, expected: number): Promise<boolean>;
}
const actions = ['create', 'join', 'resume', 'heartbeat', 'world', 'leave', 'logout', 'challenge', 'claim', 'loadout'] as const;
const envelopeSchema = z.object({ action: z.enum(actions), roomId: z.uuid().nullable().optional(), clientId: z.uuid(), data: z.unknown().optional() }).strict();
const joinSchema = z.object({ invite: z.uuid() }).strict();
const empty = z.object({}).strict();

/** 二人試場權威服務；身份由入口驗證，唔信客戶端指定角色。 */
export class PairService {
  constructor(private repo: PairRepository, private now: () => number, private entropy: () => { seed: number; battleId: string; invite: string }) {}

  /** 驗房間席位及指令，再以CAS連同收據一次提交。 */
  async execute(user: string, raw: unknown): Promise<unknown> {
    const input = envelopeSchema.parse(raw), data = input.data ?? {};
    let room: PairRoom | null;
    if (input.action === 'create') {
      empty.parse(data);
      room = await this.repo.byHost(user);
      if (!room) {
        const now = this.now();
        room = { id: user, host_id: user, guest_id: null, invite: this.entropy().invite, revision: 0,
          payload: { world: createOnlineFixture(now), presence: {}, receipts: {} } };
        if (!await this.repo.insert(room)) room = await this.repo.byHost(user);
      }
    } else if (input.action === 'join') room = await this.repo.byInvite(joinSchema.parse(data).invite);
    else {
      if (!input.roomId) throw new OnlineError(400, '請先開房或用邀請連結加入。');
      room = await this.repo.load(input.roomId);
    }
    if (!room) throw new OnlineError(404, '找不到此試場，請核對邀請連結。');
    // 同一次請求喺CAS重試期間，始終沿用同一組種子與戰報編號。
    const entropy = this.entropy();
    for (let attempt = 0; attempt < 10; attempt++) {
      const expected = room.revision, now = this.now();
      if (input.action === 'join' && room.host_id !== user && room.guest_id !== user) {
        if (room.guest_id) throw new OnlineError(409, '此二人試場已滿。');
        room.guest_id = user;
        room.payload.world.players.cloud = createOnlineFixture(now).players.cloud;
      }
      const seat: OnlineAccountId = room.host_id === user ? 'river' : room.guest_id === user ? 'cloud' : (() => { throw new OnlineError(403, '你並非此試場的玩家。'); })();
      const { world, presence, receipts } = room.payload;
      settleOnlineWorld(world, now);
      for (const [key, value] of Object.entries(presence)) if (value.until <= now) delete presence[key];
      // 一個頁只能撤回自己嘅租約，唔可以踢走另一位或同身份其他頁。
      const presenceKey = `${seat}:${input.clientId}`;
      if (['create', 'join', 'resume', 'heartbeat'].includes(input.action)) {
        if (input.action !== 'join') empty.parse(data);
        if (world.players[seat].onlineUntil <= now) world.players[seat].offlineAccruedMs = 0;
        if (!presence[presenceKey] && Object.keys(presence).length >= 20) throw new OnlineError(429, '開啟的試場分頁過多，請先關閉其他分頁。');
        presence[presenceKey] = { seat, until: now + ONLINE_TEST.presenceLeaseMs };
      } else if (input.action === 'leave' || input.action === 'logout') {
        empty.parse(data); delete presence[presenceKey];
      } else if (input.action === 'world') empty.parse(data);
      for (const id of ['river', 'cloud'] as const) world.players[id].onlineUntil = Math.max(now, ...Object.values(presence).filter(p => p.seat === id).map(p => p.until));
      let result: unknown;
      if (input.action === 'challenge' || input.action === 'claim' || input.action === 'loadout') {
        const command = parseOnlineCommand(input.action, data);
        const key = `${seat}:${command.requestId}`, signature = JSON.stringify({ action: input.action, ...command });
        const old = receipts[key];
        if (old) {
          if (old.input !== signature) throw new OnlineError(409, '同一指令編號不可變更內容。');
          result = old.result;
        } else {
          if (Object.keys(receipts).length >= 500 || (input.action === 'challenge' && world.battles.length >= 100)) throw new OnlineError(429, '此試場已達封測操作上限。');
          if (input.action === 'challenge' && !room.guest_id) throw new OnlineError(409, '等朋友入場先可以挑戰。');
          result = applyOnlineCommand(world, now, seat, input.action, command, entropy);
          receipts[key] = { input: signature, result };
        }
      }
      world.revision = room.revision = expected + 1;
      if (await this.repo.save(room, expected)) {
        if (input.action === 'leave' || input.action === 'logout') return { ok: true };
        if (result !== undefined) return result;
        return pairSnapshot(room, seat, now);
      }
      room = await this.repo.load(room.id);
      if (!room) throw new OnlineError(404, '試場已關閉。');
    }
    throw new OnlineError(503, '江湖消息繁忙，請稍後用同一指令重試。');
  }
}

/** 回傳所屬試場及自己嘅收據，隱藏身份UUID與其他分頁租約。 */
export function pairSnapshot(room: PairRoom, seat: OnlineAccountId, now: number): OnlineSnapshot {
  const { world, receipts } = room.payload;
  return structuredClone({ serverNow: now, revision: world.revision, me: world.players[seat],
    room: { id: room.id, invite: room.host_id && seat === 'river' ? room.invite : undefined, waiting: !room.guest_id },
    peers: Object.values(world.players).filter(p => p.id === 'river' || room.guest_id).map(p => ({ id: p.id, name: p.character.name, rank: p.rank, online: p.onlineUntil > now, protectedUntil: p.protectedUntil, busy: p.busy })),
    battles: world.battles.slice(-10).reverse(),
    confirmedRequests: Object.keys(receipts).filter(k => k.startsWith(seat + ':')).map(k => k.slice(seat.length + 1)).slice(-20),
    params: { protectionMs: ONLINE_TEST.protectionMs, onlineSilverPerMinute: ONLINE_TEST.onlineSilverPerMinute, offlineSilverPerMinute: ONLINE_TEST.offlineSilverPerMinute, offlineCapMs: ONLINE_TEST.offlineCapMs },
  });
}
