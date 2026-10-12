import type { LifeGameState } from '@interfaces/lifeEngine';
import { sparHeroStats } from './sparDuel';
import { COMBAT_RATING_TIERS, COMBAT_RATING_WEIGHTS } from '@data/redesign/testParams';

/** 綜合實戰能力：攻擊及暴擊、氣血與減傷、內力、吸血與過關回血；唔計威望或排名。 */
export function combatRating(state: LifeGameState): number {
  const s = sparHeroStats(state);
  const offense = s.atk * (1 + s.critRate * (s.critMul - 1)) * COMBAT_RATING_WEIGHTS.attack;
  const survival = s.maxHp / (COMBAT_RATING_WEIGHTS.hpDivisor * (1 - s.guard));
  const recovery = s.maxHp * (s.lifesteal * COMBAT_RATING_WEIGHTS.lifesteal + s.clearHeal);
  return Math.max(0, Math.round(offense + survival + recovery + state.character.maxQi / COMBAT_RATING_WEIGHTS.qiDivisor));
}

/** 戰力階級用獨立門檻；生涯威望同江湖排名唔會令戰力虛高。 */
export function combatRatingTier(rating: number): string {
  let label: string = COMBAT_RATING_TIERS[0].label;
  for (const tier of COMBAT_RATING_TIERS) {
    if (rating < tier.min) break;
    label = tier.label;
  }
  return label;
}
