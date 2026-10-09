/**
 * 敵人特性計算（第 20 項）：演武台（sparDuel.ts）同事件交手（combat.ts）共用。
 * 純函數＋細狀態，隨機數由呼叫者傳入（演武台用自己嘅 rand，交手用 getRng），保持 deterministic。
 * 數值：data/foes/traits.ts；身份：data/foes/roster.ts
 */
import { COMBO_FOLLOWUP_POWER, ENRAGE_HP_RATIO, traitPower, type FoeTier, type FoeTraitId } from '@data/foes/traits';
import { FOE_BY_NAME, lookForFoeName, regionForLook, type FoeEntry } from '@data/foes/roster';

/** 一次特性觸發（畀演出層彈字、出粒子） */
export interface TraitFx {
  kind: FoeTraitId;
  /** guard＝卸走幾多傷害；thorns＝反震幾多；drain＝回幾多血；charge／enrage＝攻擊倍率；combo＝第二擊傷害 */
  value: number;
}

/** 敵人身上嘅特性狀態（每場交手一份） */
export interface FoeTraitState {
  trait?: FoeTraitId;
  tier: FoeTier;
  /** 已出手次數（蓄力計數） */
  strikes: number;
}

export function newTraitState(trait: FoeTraitId | undefined, tier: FoeTier): FoeTraitState {
  return { trait: tier === 'minion' ? undefined : trait, tier, strikes: 0 };
}

/**
 * 敵人身份：圖鑑有個名就用圖鑑；冇就按交手強度（boss＝首領、strong＝精英、其餘小兵），
 * 特性借用同剪影嘅地區首領特性。
 */
export function resolveFoeIdentity(
  name: string,
  foePower: 'weak' | 'normal' | 'strong' | 'boss' | undefined,
): { tier: FoeTier; trait?: FoeTraitId; entry?: FoeEntry } {
  const hit = FOE_BY_NAME.get(name);
  if (hit) return { tier: hit.entry.tier, trait: hit.entry.tier === 'minion' ? undefined : hit.region.trait, entry: hit.entry };
  const tier: FoeTier = foePower === 'boss' ? 'boss' : foePower === 'strong' ? 'elite' : 'minion';
  if (tier === 'minion') return { tier };
  return { tier, trait: regionForLook(lookForFoeName(name))?.trait };
}

/** 敵人受擊：鐵布衫減傷、金剛反震。回傳實際傷害同反震值 */
export function traitOnFoeHit(s: FoeTraitState, dmg: number): { dmg: number; reflect: number; fx: TraitFx[] } {
  const pw = traitPower(s.trait, s.tier);
  const fx: TraitFx[] = [];
  if (!pw || dmg <= 0) return { dmg, reflect: 0, fx };
  let out = dmg;
  let reflect = 0;
  if (s.trait === 'guard') {
    const cut = Math.min(out - 1, Math.round(out * pw.value));
    if (cut > 0) {
      out -= cut;
      fx.push({ kind: 'guard', value: cut });
    }
  } else if (s.trait === 'thorns') {
    reflect = Math.round(out * pw.value);
    if (reflect > 0) fx.push({ kind: 'thorns', value: reflect });
  }
  return { dmg: out, reflect, fx };
}

/** 下一擊係咪蓄力重擊（演出層用嚟預告：光環暴漲） */
export function traitNextIsCharged(s: FoeTraitState): boolean {
  const pw = traitPower(s.trait, s.tier);
  return s.trait === 'charge' && !!pw?.every && (s.strikes + 1) % pw.every === 0;
}

/** 係咪狂怒中 */
export function traitEnraged(s: FoeTraitState, hpRatio: number): boolean {
  return s.trait === 'enrage' && !!traitPower(s.trait, s.tier) && hpRatio <= ENRAGE_HP_RATIO;
}

/** 敵人出手前：計攻擊倍率（蓄力、狂怒），並記一次出手 */
export function traitAttackMult(s: FoeTraitState, hpRatio: number): { mult: number; fx: TraitFx[] } {
  const pw = traitPower(s.trait, s.tier);
  const fx: TraitFx[] = [];
  let mult = 1;
  if (pw && traitNextIsCharged(s)) {
    mult *= pw.value;
    fx.push({ kind: 'charge', value: pw.value });
  }
  if (pw && traitEnraged(s, hpRatio)) {
    mult *= 1 + pw.value;
    fx.push({ kind: 'enrage', value: 1 + pw.value });
  }
  s.strikes += 1;
  return { mult, fx };
}

/** 敵人打中之後：噬血回血、分影連擊（要唔要多打一擊） */
export function traitOnFoeDealt(
  s: FoeTraitState,
  dealt: number,
  rand: () => number,
): { heal: number; followUp: number; fx: TraitFx[] } {
  const pw = traitPower(s.trait, s.tier);
  const fx: TraitFx[] = [];
  if (!pw || dealt <= 0) return { heal: 0, followUp: 0, fx };
  if (s.trait === 'drain') {
    const heal = Math.round(dealt * pw.value);
    if (heal > 0) fx.push({ kind: 'drain', value: heal });
    return { heal, followUp: 0, fx };
  }
  if (s.trait === 'combo' && rand() < pw.value) {
    return { heal: 0, followUp: COMBO_FOLLOWUP_POWER, fx };
  }
  return { heal: 0, followUp: 0, fx };
}
