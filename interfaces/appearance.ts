import { z } from 'zod';

export const APPEARANCE_HEADS = ['bamboo','topknot','master','silver','ponytail','loose','bun','short'] as const;
export const APPEARANCE_OUTFITS = ['traveller','scholar','cloak'] as const;
export const APPEARANCE_TONES = ['ink','jade','cinnabar','sand'] as const;
export const characterAppearanceSchema = z.object({
  head: z.enum(APPEARANCE_HEADS).catch('bamboo'),
  outfit: z.enum(APPEARANCE_OUTFITS).catch('cloak'),
  tone: z.enum(APPEARANCE_TONES).catch('ink'),
});
export type CharacterAppearance = z.infer<typeof characterAppearanceSchema>;
export const DEFAULT_APPEARANCE: Readonly<CharacterAppearance> = { head: 'bamboo', outfit: 'cloak', tone: 'ink' };

/** 舊存檔或失效造型以固定預設承接，不影響讀檔、能力、裝備或遊戲RNG。 */
export function readAppearance(value: unknown): CharacterAppearance {
  const result = characterAppearanceSchema.safeParse(value);
  return result.success ? result.data : { ...DEFAULT_APPEARANCE };
}

/** 僅供素材快取／比較，不含名稱、戰力或玩家身份。 */
export function appearanceKey(value: unknown): string {
  const a = readAppearance(value); return `${a.head}:${a.outfit}:${a.tone}`;
}

/** 缺少造型的舊人物依原身份取固定預設，沒有隨機換臉。 */
export function appearanceOf(character: { appearance?: unknown; gender?: string }): CharacterAppearance {
  return character.appearance === undefined
    ? { ...DEFAULT_APPEARANCE, head: character.gender === 'female' ? 'ponytail' : 'bamboo' }
    : readAppearance(character.appearance);
}
