import type { LifeGameState, PendingCombat } from '@interfaces/lifeEngine';

/**
 * 江湖威望：生涯總分，只升不跌，反映「做過幾多番轟動嘅事」——同江湖排名（勝負驅動、
 * 可升可跌）分開一套，專門用嚟驅動右上角嘅江湖等級（初窺門徑…天下傳頌）同即時反饋。
 */

export interface PrestigeTier {
  min: number;
  label: string;
}

export const PRESTIGE_TIERS: PrestigeTier[] = [
  { min: 0, label: '初窺門徑' },
  { min: 40, label: '初出茅廬' },
  { min: 120, label: '略有小成' },
  { min: 280, label: '嶄露鋒芒' },
  { min: 560, label: '聲名漸起' },
  { min: 1000, label: '威震一方' },
  { min: 1800, label: '名動江湖' },
  { min: 3000, label: '一代高手' },
  { min: 5000, label: '宗師之姿' },
  { min: 8000, label: '天下傳頌' },
];

export function jianghuPrestige(state: LifeGameState): number {
  const stored = Number(state.character.flags.jianghu_prestige ?? 0);
  return Number.isFinite(stored) && stored > 0 ? stored : 0;
}

export function jianghuPrestigeTier(prestige: number): string {
  let label = PRESTIGE_TIERS[0]!.label;
  for (const tier of PRESTIGE_TIERS) {
    if (prestige < tier.min) break;
    label = tier.label;
  }
  return label;
}

/** 下一檔次門檻；已達頂檔回傳 null */
export function nextPrestigeTier(prestige: number): PrestigeTier | null {
  return PRESTIGE_TIERS.find((t) => t.min > prestige) ?? null;
}

/** 加威望：只加唔減；跨檔次先回敘事行，避免小額加成洗版 */
export function gainJianghuPrestige(state: LifeGameState, amount: number): string[] {
  if (amount <= 0) return [];
  const prev = jianghuPrestige(state);
  const prevTier = jianghuPrestigeTier(prev);
  const next = prev + amount;
  state.character.flags.jianghu_prestige = next;
  const nextTier = jianghuPrestigeTier(next);
  if (nextTier !== prevTier) {
    return [`江湖威望大增——你已是「${nextTier}」。`];
  }
  return [];
}

function foePowerPrestige(foePower: PendingCombat['foePower'] | undefined): number {
  if (foePower === 'boss') return 120;
  if (foePower === 'strong') return 18;
  if (foePower === 'weak') return 4;
  return 8; // normal / undefined
}

/** 打贏交手加威望；輸咗唔扣（威望只反映做過嘅事，唔反映一時勝負） */
export function gainPrestigeForCombatWin(
  state: LifeGameState,
  foePower: PendingCombat['foePower'] | undefined,
): string[] {
  return gainJianghuPrestige(state, foePowerPrestige(foePower));
}
