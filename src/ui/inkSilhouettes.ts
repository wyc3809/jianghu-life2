/**
 * 剪影素材（C 款：純墨 + 門派色描邊 + 朱砂點綴）
 * 實體檔：`public/ink/art/sil/`（`scripts/art/build_silhouettes.py` 產生）
 * - hero-{sect}：主角（門派色描邊 + 朱砂頭帶）
 * - enemy-{key}：普通敵人（淡墨描邊）
 * - boss-{key}：首領（朱砂描邊）
 */
import { inkArtUrl } from './inkAssets';

/** 有剪影嘅門派 key（sectId 去掉 `sect_` 前綴） */
const HERO_SECTS = new Set([
  'wudang',
  'shaolin',
  'emei',
  'huashan',
  'tangmen',
  'taohua',
  'qingyun',
  'tiandao',
  'mojiao',
  'wugen',
]);

/** 主角剪影；冇門派／未知門派 → 無根散人 */
export function heroSilhouetteUrl(sectId: string | null | undefined): string {
  const key = (sectId ?? '').replace(/^sect_/, '');
  return inkArtUrl(`art/sil/hero-${HERO_SECTS.has(key) ? key : 'wugen'}.webp`);
}

/**
 * 可用敵人剪影（5 個唔同輪廓）。
 * - 老翁／槍客／丐幫／蓑衣：來源圖有墨霧雜點，暫停用
 * - 赤髮＝頭陀、影子＝鐵面：來源重複，唔入池
 * 待 design/art/SILHOUETTE-PROMPTS.md 新圖到再擴充。
 */
export const FOE_SILHOUETTE_KEYS = ['daoke', 'gouke', 'nvcike', 'toutuo', 'tiemian'] as const;
export type FoeSilhouetteKey = (typeof FOE_SILHOUETTE_KEYS)[number];

/** 名稱關鍵字 → 剪影（先中先得） */
const FOE_KEYWORDS: readonly [RegExp, FoeSilhouetteKey][] = [
  [/鉤|鈎|勾/, 'gouke'],
  [/刺客|女|娘|姬|婆/, 'nvcike'],
  [/頭陀|和尚|僧|禪|羅漢|杖/, 'toutuo'],
  [/鐵面|面具|影|鬼|殺手|魔|血|邪|赤髮/, 'tiemian'],
  [/刀|劍|盜|匪|賊|寇|俠|客/, 'daoke'],
];

/** 字串雜湊（非模擬用途，只為同一個名每次揀同一張圖） */
function hashName(name: string): number {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.codePointAt(0)!) >>> 0;
  return h;
}

/** 敵人名 → 剪影 key：關鍵字優先，否則按名字固定分配 */
export function foeSilhouetteKey(name: string): FoeSilhouetteKey {
  for (const [re, key] of FOE_KEYWORDS) if (re.test(name)) return key;
  return FOE_SILHOUETTE_KEYS[hashName(name) % FOE_SILHOUETTE_KEYS.length]!;
}

/** 敵人剪影 URL；boss＝朱砂描邊版 */
export function foeSilhouetteUrl(name: string, boss = false): string {
  return inkArtUrl(`art/sil/${boss ? 'boss' : 'enemy'}-${foeSilhouetteKey(name)}.webp`);
}
