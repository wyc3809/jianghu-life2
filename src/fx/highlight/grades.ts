/**
 * 六級品階色：每升一級換主色、光效色、背景色調（design/ux/highlight-fx.md）。
 * 同遊戲裝備品階一一對應：凡品白 < 良品綠 < 珍品藍 < 絕品紫 < 曠品橙 < 神兵紅。
 */
import type { Grade } from './types';

export interface GradeStyle {
  name: string;
  /** 主色（材質主調、標題） */
  main: string;
  /** 光效色（輪廓光、光柱、粒子） */
  glow: string;
  /** 背景漸變：中心 → 外圈 */
  bgInner: string;
  bgOuter: string;
  /** 爆發強度倍率 */
  power: number;
  /** 卡框鑲嵌件：鋼鉚釘／銀框寶石／金框鑽石＋王冠 */
  inlay: 'rivet' | 'gem' | 'crown';
}

export const OUTLINE = '#1A1033';

export const GRADES: Readonly<Record<Grade, GradeStyle>> = {
  0: {
    name: '凡品',
    main: '#C9CCD6',
    glow: '#FFFFFF',
    bgInner: '#5B5F78',
    bgOuter: '#1E2033',
    power: 0.6,
    inlay: 'rivet',
  },
  1: {
    name: '良品',
    main: '#5BD65B',
    glow: '#B6FF8A',
    bgInner: '#2F8F55',
    bgOuter: '#0E2A22',
    power: 0.75,
    inlay: 'rivet',
  },
  2: {
    name: '珍品',
    main: '#3FA2FF',
    glow: '#8FE3FF',
    bgInner: '#2E5FD1',
    bgOuter: '#0D1740',
    power: 0.9,
    inlay: 'gem',
  },
  3: {
    name: '絕品',
    main: '#B35CFF',
    glow: '#E7A8FF',
    bgInner: '#6A2FD1',
    bgOuter: '#1C0B40',
    power: 1.1,
    inlay: 'gem',
  },
  4: {
    name: '曠品',
    main: '#FFB020',
    glow: '#FFE27A',
    bgInner: '#D1661F',
    bgOuter: '#3D1407',
    power: 1.35,
    inlay: 'crown',
  },
  5: {
    name: '神兵',
    main: '#FF3B4E',
    glow: '#FFD36B',
    bgInner: '#C4163A',
    bgOuter: '#35040F',
    power: 1.7,
    inlay: 'crown',
  },
};

export const MAX_GRADE: Grade = 5;

export function clampGrade(n: number): Grade {
  return Math.max(0, Math.min(5, Math.round(n))) as Grade;
}
