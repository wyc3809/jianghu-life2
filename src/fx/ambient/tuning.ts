/**
 * 環境特效測試參數（玩家 2026-10-10：「場景會動」＋「墨韻粒子」）。
 * 數值未定案，記錄喺 `production/redesign-scope.md` 第 21 項。
 */
export type AmbientSeason = 'spring' | 'summer' | 'autumn' | 'winter';

type Range = readonly [number, number];

interface SeasonTuning {
  kind: 'petal' | 'rain' | 'leaf' | 'snow';
  /** 同時喺畫面上嘅數量 */
  count: number;
  size: Range;
  alpha: Range;
  life: Range;
  /** px／秒 */
  vx: Range;
  vy: Range;
  spin: Range;
  sway: Range;
}

export const AMBIENT_TUNING = {
  season: {
    spring: { kind: 'petal', count: 30, size: [14, 26], alpha: [0.8, 1], life: [7, 11], vx: [12, 32], vy: [20, 38], spin: [-1.6, 1.6], sway: [10, 24] },
    // 夏：雨絲（螢火喺淺色水墨畫面睇唔到）
    summer: { kind: 'rain', count: 80, size: [24, 40], alpha: [0.55, 0.85], life: [1.2, 2], vx: [-70, -50], vy: [420, 560], spin: [0, 0], sway: [0, 0] },
    autumn: { kind: 'leaf', count: 20, size: [14, 24], alpha: [0.85, 1], life: [7, 11], vx: [16, 38], vy: [24, 44], spin: [-2.4, 2.4], sway: [12, 26] },
    winter: { kind: 'snow', count: 60, size: [6, 14], alpha: [0.8, 1], life: [8, 13], vx: [-4, 12], vy: [16, 34], spin: [0, 0], sway: [4, 14] },
  } satisfies Record<AmbientSeason, SeasonTuning>,
  /** 流雲：兩層，遠層慢、近層快；y／h 係佔場景高度比例 */
  mist: {
    layers: [
      { speed: 7, y: 0.32, h: 0.42, alpha: 0.7 },
      { speed: 16, y: 0.92, h: 0.32, alpha: 0.45 },
    ],
  },
  /** 墨韻：邊緣墨點、墨暈 */
  ink: {
    /** 同時幾多粒 */
    count: 12,
    /** 只喺左右邊呢個比例嘅闊度出現 */
    edgeBand: 0.07,
    dotSize: [6, 16] as Range,
    dotLife: [5, 9] as Range,
    dotAlpha: [0.12, 0.3] as Range,
    dotDrift: [-3, 3] as Range,
    dotRise: [-9, -3] as Range,
    dotSway: [2, 6] as Range,
    bloomChance: 0.25,
    bloomSize: [26, 46] as Range,
    bloomGrow: 1.8,
    bloomLife: [3.5, 5.5] as Range,
    bloomAlpha: [0.1, 0.2] as Range,
  },
  /** 點擊濺墨 */
  splash: {
    size: [34, 46] as Range,
    grow: 1.6,
    life: 0.7,
    alpha: 0.55,
    droplets: 5,
    dropletSpeed: [70, 140] as Range,
    dropletSize: [4, 8] as Range,
    drag: 5,
    /** 兩次濺墨最少相隔（毫秒），防止連點洗版 */
    cooldownMs: 90,
  },
} as const;
