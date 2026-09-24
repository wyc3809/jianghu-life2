/**
 * 水墨位圖素材（WebP）：朱砂印、內功氣場、招式筆觸。
 * 實體檔：`public/ink/art/{seals,auras,strokes}/`
 * 產生器：`scripts/art/build_ink_stamps.py`（固定種子，可重跑）
 *
 * 舊版手繪 SVG（`public/ink/{seals,decor,icons,frames}/*.svg`）已全數退役 —
 * 見 `.claude/rules/no-svg-game-art.md`。
 */

/** 相對 `public/ink/` 的路徑 → 帶 cache bust 的 URL */
export function inkArtUrl(pathUnderInk: string): string {
  const base = import.meta.env.BASE_URL || '/';
  const cleaned = pathUnderInk.replace(/^\/+/, '');
  return `${base}ink/${cleaned}?v=art1`;
}

/** 印文 → 檔名 id（`public/ink/art/seals/seal-{id}.webp`） */
const SEAL_ID_BY_TEXT: Readonly<Record<string, string>> = {
  生: 'sheng',
  終: 'zhong',
  緣: 'yuan',
  江湖: 'jianghu',
  招: 'zhao',
  勝: 'sheng-win',
  命: 'ming',
  危: 'wei',
  // 落印全集（store slices 嘅 sealText）
  定: 'ding',
  劍: 'jian',
  戰: 'zhan',
  敗: 'bai',
  武: 'wu',
  遁: 'dun',
  宗: 'zong',
  收: 'shou',
  教: 'jiao',
  晉: 'jin',
  月: 'yue',
  煉: 'lian',
  裝: 'zhuang',
  // 部位傷勢
  殘: 'can',
  癒: 'yu',
};

/** 已有位圖的印文 */
export const INK_SEAL_TEXTS = Object.keys(SEAL_ID_BY_TEXT);

/** 印文 → 朱砂印 WebP URL；無對應則回 null（呼叫端沿用 CSS 字印） */
export function sealUrlForText(text: string | null | undefined): string | null {
  if (!text) return null;
  const id = SEAL_ID_BY_TEXT[text];
  return id ? inkArtUrl(`art/seals/seal-${id}.webp`) : null;
}

/** 戰鬥用印（連招／勝／命懸／危） */
export const INK_COMBAT_SEAL = {
  combo: '招',
  victory: '勝',
  fate: '命',
  critical: '危',
} as const;

/** 內功模式 id（見 core/life/internalMode.ts 之 INTERNAL_MODES） */
const AURA_MODE_IDS = new Set(['guixi', 'huxiao', 'hexian', 'shepan']);

/** 內功模式 id → 呼吸氣場 WebP URL */
export function auraUrlForInternalModeId(id: string | null | undefined): string | null {
  return id && AURA_MODE_IDS.has(id) ? inkArtUrl(`art/auras/aura-${id}.webp`) : null;
}

/** 內功模式 id → 呼吸動畫 CSS class */
export function auraClassForInternalModeId(id: string | null | undefined): string {
  if (id === 'guixi') return 'ink-aura--turtle';
  if (id === 'huxiao') return 'ink-aura--tiger';
  if (id === 'hexian') return 'ink-aura--crane';
  if (id === 'shepan') return 'ink-aura--serpent';
  return '';
}

/** 列表小圖示：AI 物象圖裁正、紙色轉透明（`scripts/art/build_icons.py`）→ `public/ink/art/icons/` */
export function motifIconUrl(id: string): string {
  return inkArtUrl(`art/icons/${id}.webp`);
}

export type InkStrokeKind = 'guard' | 'dodge';

/** 招式筆觸小圖示（守／遁） */
export function strokeUrl(kind: InkStrokeKind): string {
  return inkArtUrl(`art/strokes/stroke-${kind}.webp`);
}
