/**
 * 外功七卷嘅筆觸（玩家要求：卷一至卷七筆觸顏色／形狀唔同，集中一個表方便改）。
 * 顏色用高光品階色（grades.ts）：卷越後越貴氣；卷七金邊大弧。
 * 座標係打鬥場世界單位（敵人中心喺 0,0）；角度係度。
 */
import { GRADES } from '../grades';

export type StrokeShape = 'straight' | 'horizontal' | 'cross' | 'round' | 'thrust' | 'spiral' | 'grand';

export interface VolumeStroke {
  /** 招式型名（介面唔顯示，方便睇表） */
  label: string;
  shape: StrokeShape;
  /** 筆觸主色 */
  color: string;
  /** 邊色（卷七金邊）；冇就同主色 */
  edge?: string;
  /** 邊色濃度 0–1 */
  edgeAmt?: number;
  /** 筆觸闊（世界單位） */
  width: number;
  /** 長度或半徑 */
  size: number;
  /** 傾斜角 */
  angle: number;
  /** 命中墨點顏色 */
  sparks: string[];
}

const INK = '#1C1A17';
const WASH = '#8A857C';

export const VOLUME_STROKES: Record<number, VolumeStroke> = {
  1: { label: '淡墨直劈', shape: 'straight', color: WASH, width: 0.58, size: 3.0, angle: -62, sparks: [INK, WASH] },
  2: { label: '濃墨橫斬', shape: 'horizontal', color: INK, width: 0.51, size: 3.2, angle: -8, sparks: [INK, WASH] },
  3: { label: '竹青交叉', shape: 'cross', color: GRADES[1].main, width: 0.44, size: 2.8, angle: -45, sparks: [INK, GRADES[1].main] },
  4: { label: '靛藍圓弧', shape: 'round', color: GRADES[2].main, width: 0.51, size: 1.25, angle: 0, sparks: [INK, GRADES[2].main] },
  5: { label: '朱砂直刺', shape: 'thrust', color: GRADES[5].main, width: 0.37, size: 3.6, angle: 4, sparks: [INK, GRADES[5].main, '#C29A45'] },
  6: { label: '紫檀雙旋', shape: 'spiral', color: GRADES[3].main, width: 0.41, size: 1.1, angle: 20, sparks: [INK, GRADES[3].main] },
  7: { label: '金邊大弧', shape: 'grand', color: INK, edge: '#C29A45', edgeAmt: 1, width: 0.85, size: 1.75, angle: -15, sparks: [INK, '#C29A45', GRADES[5].main] },
};

/** 敵人還手：反方向、細啲、淡墨 */
export const FOE_STROKE: VolumeStroke = {
  label: '敵招',
  shape: 'straight',
  color: '#5A4E46',
  width: 0.37,
  size: 2.2,
  angle: 58,
  sparks: [INK, GRADES[5].main],
};

/** 冇外功（基本攻擊）用卷一嘅筆觸 */
export function strokeForVol(vol: number | undefined): VolumeStroke {
  return VOLUME_STROKES[vol ?? 1] ?? VOLUME_STROKES[1]!;
}

/** 卷五以上命中當暴擊（同 InkAutoBattle 一致） */
export const CRIT_FROM_VOL = 5;
