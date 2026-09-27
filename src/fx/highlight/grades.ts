/**
 * 六級品階色（水墨版）：低飽和礦物顏料，喺宣紙上唔會刺眼。
 * 每升一級換主色（顏料）、光效色（金／暈）、背景墨暈。
 * 同遊戲裝備品階一一對應：凡品墨灰 < 良品竹青 < 珍品靛藍 < 絕品紫檀 < 曠品泥金 < 神兵朱砂。
 */
import type { Grade } from './types';

export interface GradeStyle {
  name: string;
  /** 主色（顏料：材質主調、標題題款） */
  main: string;
  /** 光效色（輪廓光、光柱、金粉） */
  glow: string;
  /** 背景：紙心同邊緣墨暈 */
  bgInner: string;
  bgOuter: string;
  /** 爆發強度倍率 */
  power: number;
  /** 卡框裝裱：素紙綾邊／錦緞邊＋角印／泥金錦緞＋金箔 */
  inlay: 'plain' | 'brocade' | 'gold';
}

/** 墨色描邊 */
export const OUTLINE = '#1C1A17';
/** 宣紙底色 */
export const PAPER = '#F3EBDC';

export const GRADES: Readonly<Record<Grade, GradeStyle>> = {
  0: {
    name: '凡品',
    main: '#8A857C',
    glow: '#E9E2D2',
    bgInner: '#F6F0E3',
    bgOuter: '#CFC6B4',
    power: 0.6,
    inlay: 'plain',
  },
  1: {
    name: '良品',
    main: '#5E8A6E',
    glow: '#D9E6C9',
    bgInner: '#F4F1E2',
    bgOuter: '#B9C4AE',
    power: 0.75,
    inlay: 'plain',
  },
  2: {
    name: '珍品',
    main: '#3F6283',
    glow: '#D3E0EA',
    bgInner: '#F2EFE6',
    bgOuter: '#A9B6C0',
    power: 0.9,
    inlay: 'brocade',
  },
  3: {
    name: '絕品',
    main: '#6E4A6B',
    glow: '#E6D5E0',
    bgInner: '#F4EEE6',
    bgOuter: '#BCA9B4',
    power: 1.1,
    inlay: 'brocade',
  },
  4: {
    name: '曠品',
    main: '#B08A3E',
    glow: '#F1DFA8',
    bgInner: '#F7EFDC',
    bgOuter: '#CDB88B',
    power: 1.35,
    inlay: 'gold',
  },
  5: {
    name: '神兵',
    main: '#A33A32',
    glow: '#F0CFA0',
    bgInner: '#F8EEDF',
    bgOuter: '#C79A83',
    power: 1.7,
    inlay: 'gold',
  },
};

export const MAX_GRADE: Grade = 5;

export function clampGrade(n: number): Grade {
  return Math.max(0, Math.min(5, Math.round(n))) as Grade;
}
