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

/**
 * 印鍵（store 嘅 sealText／各元件用嘅一字代號）→ 印面詞語（2–4 字）＋檔名 id。
 * 印面係完整詞語，唔再係單字（`scripts/art/build_ink_stamps.py` SEALS 同步）。
 */
const SEALS: Readonly<Record<string, { id: string; phrase: string }>> = {
  生: { id: 'sheng', phrase: '人生初度' },
  終: { id: 'zhong', phrase: '塵緣已了' },
  緣: { id: 'yuan', phrase: '緣定三生' },
  江湖: { id: 'jianghu', phrase: '笑傲江湖' },
  招: { id: 'zhao', phrase: '一氣呵成' },
  勝: { id: 'sheng-win', phrase: '旗開得勝' },
  命: { id: 'ming', phrase: '命懸一線' },
  危: { id: 'wei', phrase: '險象環生' },
  // 落印全集（store slices 嘅 sealText）
  定: { id: 'ding', phrase: '落子無悔' },
  劍: { id: 'jian', phrase: '華山論劍' },
  戰: { id: 'zhan', phrase: '狹路相逢' },
  敗: { id: 'bai', phrase: '技不如人' },
  武: { id: 'wu', phrase: '得窺門徑' },
  遁: { id: 'dun', phrase: '全身而退' },
  宗: { id: 'zong', phrase: '開宗立派' },
  收: { id: 'shou', phrase: '廣納門徒' },
  教: { id: 'jiao', phrase: '傳道授業' },
  晉: { id: 'jin', phrase: '聲名鵲起' },
  月: { id: 'yue', phrase: '歲月如流' },
  煉: { id: 'lian', phrase: '精益求精' },
  裝: { id: 'zhuang', phrase: '披掛上陣' },
  // 特效時刻
  破: { id: 'po', phrase: '更上層樓' },
  傷: { id: 'shang', phrase: '傷筋動骨' },
  殘: { id: 'can', phrase: '傷及根本' },
  癒: { id: 'yu', phrase: '妙手回春' },
};

/** 已有位圖的印鍵 */
export const INK_SEAL_TEXTS = Object.keys(SEALS);

/** 印鍵 → 朱砂印 WebP URL；無對應則回 null（呼叫端沿用 CSS 字印） */
export function sealUrlForText(text: string | null | undefined): string | null {
  if (!text) return null;
  const seal = SEALS[text];
  return seal ? inkArtUrl(`art/seals/seal-${seal.id}.webp`) : null;
}

/** 印鍵 → 印面詞語（無障礙文字用）；無對應回原字 */
export function sealPhrase(text: string): string {
  return SEALS[text]?.phrase ?? text;
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
