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
});
