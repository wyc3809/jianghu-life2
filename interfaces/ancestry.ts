import { z } from 'zod';
import { wuxiaAttributeKeys, type WuxiaAttribute } from './lifeEngine';

/** 帳戶層祖蔭（跨世永久，唔跟人生存檔） */
export interface AncestryMeta {
  version: 1;
  /** 未花嘅祖蔭點 */
  points: number;
  /** 歷來總共拎過幾多（顯示用） */
  earnedTotal: number;
  lives: number;
  /** 五維天賦等級 0–5 */
  talents: Record<WuxiaAttribute, number>;
  /** 歷代學過嘅武學 id（可解鎖範圍） */
  artsSeen: string[];
  unlockedArts: string[];
  /** 下一世開局帶住嘅家傳武學 */
  familyArts: string[];
  /** 家傳欄位數（1 或 2） */
  familySlots: number;
  /** 已領過祖蔭嘅家族里程碑 id（首次先有，同一個只領一次）；舊資料冇＝空 */
  milestones?: string[];
  /** 玉石：免費同付費（測試額度）分開記帳，跨世保留 */
  jade?: { free: number; paidTest: number };
  /** 抽卡：兩個卡池各自嘅心願同保底進度（換代保留） */
  gacha?: {
    pulls: number;
    banners: Record<string, { wish?: string; sinceWish: number; total: number }>;
  };
  /** 家族秘笈收藏：stars＝升階數、copies＝未處理嘅重複本 */
  /** 家族秘笈收藏；外功嘅 vols＝收咗邊幾卷（舊記錄冇 vols＝成套七卷） */
  manuals?: Record<string, { stars: number; copies: number; vols?: number[] }>;
  /** 書頁（重複秘笈轉成） */
  pages?: number;
  /** 已領過玉石嘅成就 id（帳戶首次） */
  jadeAchv?: string[];
  /** 在線奇遇（見 core/life/encounters.ts） */
  encounter?: EncounterState;
}

export interface EncounterState {
  /** 下次可以彈奇遇嘅時間（ms） */
  nextAt: number;
  seq: number;
  done: number;
  expired: number;
  /** 彈咗出嚟、未揀 */
  offer?: { tpl: string; at: number };
  /** 已揀路線、限期進行中 */
  active?: {
    tpl: string;
    route: string;
    startAt: number;
    deadline: number;
    /** 之前幾代累積嘅進度 */
    carried: number;
    base: { lifeKey: string; value: number };
    progress: number;
    /** 「賺銀兩」考驗：上次見到嘅身上銀兩（只計增加） */
    lastMoney?: number;
  };
  /** 最近一次結果（介面提示用） */
  last?: { tpl: string; result: 'done' | 'expired'; reward?: string; vol?: number; at: number };
}

export const ancestryMetaSchema = z.object({
  version: z.literal(1),
  points: z.number().int().min(0),
  earnedTotal: z.number().int().min(0),
  lives: z.number().int().min(0),
  talents: z.record(z.enum(wuxiaAttributeKeys), z.number().int().min(0).max(10)),
  artsSeen: z.array(z.string()),
  unlockedArts: z.array(z.string()),
  familyArts: z.array(z.string()),
  familySlots: z.number().int().min(1).max(2),
  milestones: z.array(z.string()).optional(),
  jade: z.object({ free: z.number().min(0), paidTest: z.number().min(0) }).optional(),
  gacha: z
    .object({
      pulls: z.number().int().min(0),
      banners: z.record(
        z.string(),
        z.object({ wish: z.string().optional(), sinceWish: z.number().int().min(0), total: z.number().int().min(0) }),
      ),
    })
    .optional(),
  manuals: z.record(z.string(), z.object({ stars: z.number().int().min(0), copies: z.number().int().min(0), vols: z.array(z.number().int()).optional() })).optional(),
  pages: z.number().int().min(0).optional(),
  jadeAchv: z.array(z.string()).optional(),
  encounter: z
    .object({
      nextAt: z.number(),
      seq: z.number().int().min(0),
      done: z.number().int().min(0),
      expired: z.number().int().min(0),
      offer: z.object({ tpl: z.string(), at: z.number() }).optional(),
      active: z
        .object({
          tpl: z.string(),
          route: z.string(),
          startAt: z.number(),
          deadline: z.number(),
          carried: z.number().min(0),
          base: z.object({ lifeKey: z.string(), value: z.number() }),
          progress: z.number().min(0),
          lastMoney: z.number().optional(),
        })
        .optional(),
      last: z
        .object({
          tpl: z.string(),
          result: z.enum(['done', 'expired']),
          reward: z.string().optional(),
          vol: z.number().optional(),
          at: z.number(),
        })
        .optional(),
    })
    .optional(),
});
