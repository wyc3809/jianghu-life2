/**
 * 演武台 v4 動作表（數據驅動）：每組動作幾多格、每格幾耐、邊格觸發命中。
 * 圖檔：public/ink/spar/v4/{hero|enemy/t?|boss/t?}/{clip}[.{layer}].webp（橫排條圖，每格等寬）。
 * 每格手位、兵器角度、紅眼位：data/spar/anchors.generated.json（由 scripts/art/build_spar_v4.py 產生；
 * 換 AI 真圖時，姿勢變咗就要同步改 anchors）。
 */

export type HeroClipId =
  | 'idle'
  | 'idle-hurt'
  | 'walk'
  | 'walk-limp'
  | 'windup'
  | 'strike'
  | 'recover'
  | 'combo'
  | 'ultimate';

export type EnemyClipId = 'enter' | 'taunt' | 'hit' | 'break';

export interface SparClipDef {
  /** 格數（要同條圖格數一致） */
  frames: number;
  /** 每格秒數 */
  frameSec: number;
  loop: boolean;
  /** 播到呢幾格嘅開頭觸發命中（連擊可以有多個） */
  hitFrames?: number[];
}

/** 主角動作；windup／strike／recover 加埋啱啱好係節奏表嘅 0.3／0.2／0.6 秒 */
export const HERO_CLIPS: Readonly<Record<HeroClipId, SparClipDef>> = {
  idle: { frames: 8, frameSec: 0.14, loop: true },
  'idle-hurt': { frames: 8, frameSec: 0.16, loop: true },
  walk: { frames: 8, frameSec: 0.125, loop: true },
  'walk-limp': { frames: 8, frameSec: 0.125, loop: true },
  windup: { frames: 4, frameSec: 0.075, loop: false },
  strike: { frames: 4, frameSec: 0.05, loop: false, hitFrames: [2] },
  recover: { frames: 4, frameSec: 0.15, loop: false },
  combo: { frames: 6, frameSec: 0.06, loop: false, hitFrames: [3] },
  ultimate: { frames: 8, frameSec: 0.07, loop: false, hitFrames: [4] },
};

/** 敵人（小兵同頭目共用格數） */
export const ENEMY_CLIPS: Readonly<Record<EnemyClipId, SparClipDef>> = {
  enter: { frames: 6, frameSec: 0.066, loop: false },
  taunt: { frames: 8, frameSec: 0.12, loop: true },
  hit: { frames: 4, frameSec: 0.06, loop: false },
  break: { frames: 8, frameSec: 0.075, loop: false },
};

export function clipDuration(c: SparClipDef): number {
  return c.frames * c.frameSec;
}

/** t 秒時播到第幾格（循環／停喺最後一格） */
export function clipFrameAt(c: SparClipDef, t: number): number {
  const i = Math.floor(Math.max(0, t) / c.frameSec);
  return c.loop ? i % c.frames : Math.min(c.frames - 1, i);
}

/** 由 prev 行到 now，跨過咗幾多個命中格（用嚟觸發 onHit） */
export function hitsCrossed(c: SparClipDef, prev: number, now: number): number {
  let n = 0;
  for (const f of c.hitFrames ?? []) {
    const at = f * c.frameSec;
    if (prev < at && now >= at) n++;
  }
  return n;
}
