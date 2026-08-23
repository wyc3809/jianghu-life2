import type { LifeGameState } from '@interfaces/lifeEngine';
import { sectStandingName } from '@data/content/packs';

/** 顯示用進度條：純 UI 呈現，唔影響任何遊戲數值判定或存檔格式 */
export interface ProgressBar {
  key: 'martial' | 'reputation' | 'wealth';
  label: string;
  raw: number;
  percent: number;
}

export interface SectProgress {
  standing: number;
  label: string;
  nextLabel: string | null;
  percent: number;
}

export interface ProgressSnapshot {
  bars: ProgressBar[];
  sect: SectProgress | null;
}

const MAX_SECT_STANDING = 3;

/**
 * 校準基準（非任意數字）：
 * - 武學 300 = 開宗立派門檻（core/life/foundedSect.ts FOUND_SECT_MIN_MARTIAL）
 * - 名望 200 = 頂級稱號門檻之一（core/life/titles.ts）
 * - 財富 500 = 現有江湖軼事／副業門檻常見量級（economy.ts／arcs.ts）
 */
const MARTIAL_SOFT_CAP = 300;
const REPUTATION_SOFT_CAP = 200;
const WEALTH_SOFT_CAP = 500;

function toPercent(raw: number, cap: number): number {
  return Math.max(0, Math.min(100, Math.round((raw / cap) * 100)));
}

export function calculateProgress(state: LifeGameState): ProgressSnapshot {
  const c = state.character;
  const bars: ProgressBar[] = [
    { key: 'martial', label: '武學', raw: c.martial, percent: toPercent(c.martial, MARTIAL_SOFT_CAP) },
    {
      key: 'reputation',
      label: '名望',
      raw: c.reputation,
      percent: toPercent(c.reputation, REPUTATION_SOFT_CAP),
    },
    { key: 'wealth', label: '財富', raw: c.money, percent: toPercent(c.money, WEALTH_SOFT_CAP) },
  ];

  const sect = c.sectId
    ? {
        standing: c.sectStanding ?? 0,
        label: sectStandingName(c.sectStanding ?? 0),
        nextLabel:
          (c.sectStanding ?? 0) < MAX_SECT_STANDING
            ? sectStandingName((c.sectStanding ?? 0) + 1)
            : null,
        percent: Math.round(((c.sectStanding ?? 0) / MAX_SECT_STANDING) * 100),
      }
    : null;

  return { bars, sect };
}
