import { z } from "zod";
import { SECT_CONTENT } from "@data/content/packs";
import { SECT_WAR_TEST as P } from "@data/redesign/sectWarTestParams";
import { appearanceOf } from "@interfaces/appearance";
import type { LifeGameState } from "@interfaces/lifeEngine";
import type {
  SectWarWorld,
  SectWarReport,
  SectWarRepository,
  SectWarReceipt,
  SectWarSnapshot,
  SectSelectionResult,
} from "@interfaces/sectWar";
import type {
  SectBattleEntrant,
  SectBattleReplay,
} from "@interfaces/sectBattle";
import { createNewLife } from "../life/gameState";
import { createRng, withRng } from "../random";
import { buildPlayerFighter } from "../life/combat";
import { characterForPreset } from "../life/loadoutPresets";
import { simulateOnlineBattle } from "./combat";
import { simulateSectBattle } from "./sectBattle";
import { packSectReplay } from "./sectTape";
import { OnlineError } from "./commands";

const envelope = z
  .object({
    action: z.enum(["overview", "join", "selection", "challenge", "report"]),
    requestId: z.string().min(8).max(100).optional(),
    data: z.record(z.string(), z.unknown()).default({}),
  })
  .strict();
const empty = z.object({}).strict(),
  target = z.object({ target: z.string().min(1).max(100) }).strict();
/** 香港每週一04:00作封測換屆，不採用裝置時鐘。 */
export const sectWarTerm = (now: number) =>
  Math.floor((now - P.epoch) / P.weekMs);
/** 戰報驗證包括全部事件；重播不再結算、派獎或更新排名。 */
export function sectReplayFingerprint(
  replay: Pick<
    SectBattleReplay,
    "duration" | "winner" | "remaining" | "events"
  >,
): string {
  const str = JSON.stringify([
    replay.duration,
    replay.winner,
    replay.remaining,
    replay.events.map((e) => [
      e.at,
      e.actor,
      e.target,
      e.skillId,
      e.vol ?? null,
      e.name,
      e.damage,
      e.splash,
      e.miss ?? false,
      e.x,
      e.y,
    ]),
  ]);
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}
/** 對外只帶戰鬥需要的武學及能力；不公開玉石、年譜、任務、社交或事件旗標。 */
export function sectCombatSnapshot(state: LifeGameState): LifeGameState {
  const view = characterForPreset(structuredClone(state.character), "duel");
  const out = withRng(createRng(1), () =>
    createNewLife({ seed: 1, name: view.name, skipCoach: true }),
  );
  const keys = [
    "alive",
    "name",
    "appearance",
    "martial",
    "health",
    "maxHealth",
    "qi",
    "maxQi",
    "attributes",
    "skills",
    "skillRanks",
    "volumes",
    "gear",
    "equipment",
    "manualStars",
    "mainArts",
    "equippedArts",
    "supportArts",
    "injuries",
    "weaponMastery",
  ] as const;
  for (const key of keys)
    if (key in view)
      (out.character as unknown as Record<string, unknown>)[key] =
        structuredClone((view as unknown as Record<string, unknown>)[key]);
  out.character.flags = { caps_include_internal: true };
  out.character.sectId = view.sectId;
  out.character.family = {};
  out.character.money = 0;
  out.character.reputation = 0;
  out.npcs = {};
  out.lifeLog = [];
  out.completedEvents = [];
  out.recentEvents = [];
  out.pending = null;
  out.phase = "playing";
  return out;
}
/** 空門派名冊，與舊共用江湖及單機門派地位分開。 */
export function emptySectWar(now: number): SectWarWorld {
  return {
    revision: 0,
    payload: {
      term: sectWarTerm(now),
      members: {},
      ranks: {},
      teams: {},
      matches: [],
    },
  };
}
async function rotate(
  world: SectWarWorld,
  now: number,
  repo: SectWarRepository,
): Promise<boolean> {
  const p = world.payload,
    term = sectWarTerm(now);
  if (term <= p.term) return false;
  p.term = term;
  p.teams = {};
  const ids = Object.keys(p.members),
    profiles: Record<string, LifeGameState> = {};
  for (let offset = 0; offset < ids.length; offset += 40)
    Object.assign(
      profiles,
      await repo.profiles(ids.slice(offset, offset + 40)),
    );
  for (const id of ids) {
    const state = profiles[id],
      member = p.members[id];
    if (!validProfile(state) || state.character.sectId !== member.sectId) {
      delete p.members[id];
      p.ranks[member.sectId] = (p.ranks[member.sectId] ?? []).filter(
        (value) => value !== id,
      );
    }
  }
  for (const [sect, ids] of Object.entries(p.ranks))
    if (ids.length >= P.teamSize)
      p.teams[sect] = {
        term,
        members: ids.slice(0, P.teamSize),
        lockedAt: now,
      };
  return true;
}
function snapshot(
  world: SectWarWorld,
  user: string,
  now: number,
): SectWarSnapshot {
  const p = world.payload;
  return structuredClone({
    serverNow: now,
    term: p.term,
    nextCutoff: P.epoch + (p.term + 1) * P.weekMs,
    me: p.members[user] ?? null,
    members: Object.values(p.members),
    ranks: p.ranks,
    teams: p.teams,
    matches: p.matches.slice(-100).reverse(),
  });
}
function validProfile(
  state: LifeGameState | undefined,
): state is LifeGameState {
  return (
    !!state &&
    state.phase === "playing" &&
    state.character.alive &&
    SECT_CONTENT.some((s) => s.id === state.character.sectId)
  );
}

/** 真人門派非同步服務：原子排名／代表鎖定／同週同對手單一戰報，沒有客戶端指定勝負。 */
export class SectWarService {
  constructor(
    private repo: SectWarRepository,
    private now: () => number,
    private entropy: () => { seed: number; id: string },
  ) {}
  async execute(user: string, raw: unknown): Promise<unknown> {
    const input = envelope.parse(raw),
      data = input.data,
      entropy = this.entropy();
    if (input.action === "report") {
      const { id } = z.object({ id: z.uuid() }).strict().parse(data),
        report = await this.repo.report(id);
      if (!report) throw new OnlineError(404, "未找到這場會武戰報。");
      return report;
    }
    if (input.action === "overview" || input.action === "join")
      empty.parse(data);
    else target.parse(data);
    const mutation = input.action !== "overview";
    if (mutation && !input.requestId)
      throw new OnlineError(400, "欠缺操作編號，請重新操作。");
    const signature = JSON.stringify({ action: input.action, data });
    for (let attempt = 0; attempt < 10; attempt++) {
      if (mutation) {
        const prior = await this.repo.receipt(user, input.requestId!);
        if (prior) {
          if (prior.input !== signature)
            throw new OnlineError(409, "同一操作編號不可變更內容。");
          return prior.result;
        }
      }
      const world = await this.repo.load(),
        expected = world.revision,
        now = this.now(),
        changed = await rotate(world, now, this.repo),
        p = world.payload;
      if (input.action === "overview") {
        if (changed && !(await this.repo.save(world, expected, null, null)))
          continue;
        return snapshot(world, user, now);
      }
      const own = (await this.repo.profiles([user]))[user];
      if (!validProfile(own))
        throw new OnlineError(409, "請先加入門派，並保存目前人物及對戰配搭。");
      const sect = own.character.sectId!;
      let member = p.members[user];
      let report: SectWarReport | null = null,
        result: unknown;
      if (input.action === "join") {
        if (!member && Object.keys(p.members).length >= P.maxMembers)
          throw new OnlineError(429, "本輪會武名冊已滿，請稍後再試。");
        if (member && member.sectId !== sect) {
          p.ranks[member.sectId] = (p.ranks[member.sectId] ?? []).filter(
            (id) => id !== user,
          );
        }
        member = p.members[user] = {
          id: user,
          sectId: sect,
          name: own.character.name,
          appearance: appearanceOf(own.character),
          joinedAt: member?.sectId === sect ? member.joinedAt : now,
          lastSelectionAt: member?.lastSelectionAt ?? 0,
        };
        const ranks = (p.ranks[sect] ??= []);
        if (!ranks.includes(user)) ranks.push(user);
        if (!p.teams[sect] && ranks.length >= P.teamSize)
          p.teams[sect] = {
            term: p.term,
            members: ranks.slice(0, P.teamSize),
            lockedAt: now,
          };
        result = snapshot(world, user, now);
      } else {
        if (!member || member.sectId !== sect)
          throw new OnlineError(409, "請先報名目前所屬門派。");
        const aim = target.parse(data).target;
        if (input.action === "selection") {
          if (now - member.lastSelectionAt < P.selectionCooldownMs)
            throw new OnlineError(429, "剛完成門內比武，請稍候再戰。");
          const other = p.members[aim],
            ranks = p.ranks[sect] ?? [];
          if (!other || other.sectId !== sect || aim === user)
            throw new OnlineError(409, "請選擇同門的另一名參選者。");
          const enemy = (await this.repo.profiles([aim]))[aim];
          if (!validProfile(enemy) || enemy.character.sectId !== sect)
            throw new OnlineError(409, "對方目前不能參加門內比武。");
          const before = ranks.indexOf(user) + 1,
            index = ranks.indexOf(aim);
          if (!before || index < 0)
            throw new OnlineError(409, "同門名冊已更新，請重新載入。");
          const battle = simulateOnlineBattle(
            own.character,
            enemy.character,
            entropy.seed,
          );
          if (battle.winner === 0 && index < before - 1)
            [ranks[index], ranks[before - 1]] = [user, aim];
          member.lastSelectionAt = now;
          result = {
            kind: "selection",
            replay: { ...battle.forward, title: "門內比武" },
            character: sectCombatSnapshot(own).character,
            before,
            after: ranks.indexOf(user) + 1,
          } satisfies SectSelectionResult;
        } else {
          if (!SECT_CONTENT.some((s) => s.id === aim) || aim === sect)
            throw new OnlineError(409, "請選擇另一個門派。");
          const existing = p.matches.find(
            (m) =>
              m.term === p.term &&
              m.sides.includes(sect) &&
              m.sides.includes(aim),
          );
          if (existing) {
            result = { reportId: existing.id };
          } else {
            const a = p.teams[sect],
              b = p.teams[aim];
            if (!a || !b || a.members.length !== 10 || b.members.length !== 10)
              throw new OnlineError(
                409,
                "雙方均須集齊十名真人代表，才能開始會武。",
              );
            if (!a.members.includes(user))
              throw new OnlineError(
                403,
                "本屆代表才可發起會武；其餘同門可觀看戰報。",
              );
            const profiles = await this.repo.profiles([
              ...a.members,
              ...b.members,
            ]);
            const roster: SectBattleEntrant[] = [];
            for (const [side, team] of [a, b].entries())
              for (const [idIndex, id] of team.members.entries()) {
                const state = profiles[id];
                if (
                  !validProfile(state) ||
                  state.character.sectId !== [sect, aim][side]
                )
                  throw new OnlineError(
                    409,
                    "有代表已離派或人物無法出戰；須待下屆重新選拔，不能代填人物。",
                  );
                const normalized = characterForPreset(
                  structuredClone(state.character),
                  "duel",
                );
                roster.push({
                  id,
                  side: side as 0 | 1,
                  rank: idIndex + 1,
                  state: sectCombatSnapshot(state),
                  fighter: buildPlayerFighter({
                    ...state,
                    character: normalized,
                  }),
                });
              }
            const replay = simulateSectBattle(roster, entropy.seed, true, true);
            report = {
              id: entropy.id,
              term: p.term,
              sides: [sect, aim],
              at: now,
              winner: replay.winner,
              remaining: replay.remaining,
              duration: replay.duration,
              engineVersion: P.engineVersion,
              seed: entropy.seed,
              roster,
              fingerprint: sectReplayFingerprint(replay),
              timeline: packSectReplay(replay),
            };
            p.matches.push({
              id: report.id,
              term: report.term,
              sides: report.sides,
              at: now,
              winner: report.winner,
              remaining: report.remaining,
              duration: report.duration,
            });
            p.matches = p.matches.slice(-100);
            result = { reportId: report.id };
          }
        }
      }
      const receipt: SectWarReceipt = {
        user_id: user,
        request_id: input.requestId!,
        input: signature,
        result,
      };
      if (await this.repo.save(world, expected, report, receipt)) return result;
    }
    throw new OnlineError(503, "名冊正在更新，請用原操作重試。");
  }
}
