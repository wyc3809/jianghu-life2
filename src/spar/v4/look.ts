/**
 * 演武台外觀（由遊戲狀態推導）：服色跟門派、兵器跟裝備、敵人跟境界、傷勢／流血、地點同季節。
 * 純函數，示範頁可以直接砌一個 SparLook 試睇。
 */
import type { LifeGameState } from '@interfaces/lifeEngine';
import { getGearDef, type WeaponKind } from '@data/equipment/catalog';
import { SECT_ROBE_COLORS, SPAR_WEAPONS, type SparPlace, type SparSeason } from '@data/spar/tuning';
import { placeToInk, seasonToInk } from '../../components/ink/sceneVariants';

export interface SparLook {
  /** 袍色（hex） */
  robe: string;
  /** null＝空手 */
  weapon: WeaponKind | null;
  armor: boolean;
  accessory: boolean;
  /** 敵人等級 1–6（跟主角境界） */
  enemyTier: number;
  /** 腳傷 → 跛腳行路 */
  limp: boolean;
  /** 手傷 → 待機掩住手 */
  armHurt: boolean;
  /** 頭／身重傷 → 微微弓身 */
  hunch: boolean;
  /** 流血 → 滴墨 */
  bleeding: boolean;
  place: SparPlace;
  season: SparSeason;
}

export const DEFAULT_LOOK: SparLook = {
  robe: SECT_ROBE_COLORS.none!,
  weapon: 'sword',
  armor: false,
  accessory: false,
  enemyTier: 1,
  limp: false,
  armHurt: false,
  hunch: false,
  bleeding: false,
  place: 'town',
  season: 'spring',
};

/** 境界 0–6 → 敵人等級 1–6（天人合一同返璞歸真共用最高級） */
export function enemyTierForCultivation(tier: number): number {
  return Math.max(1, Math.min(6, Math.floor(tier) + 1));
}

const BLEED = /流血|血流|bleed/i;

export function lookFromState(state: LifeGameState): SparLook {
  const c = state.character;
  const weaponId = c.equipment.weapon;
  const weapon = weaponId ? (getGearDef(weaponId)?.weaponKind ?? null) : null;
  const injuries = c.injuries ?? [];
  const has = (part: string, heavy = false) =>
    injuries.some((i) => i.part === part && (!heavy || i.tier !== 'light'));
  return {
    robe: (c.sectId && SECT_ROBE_COLORS[c.sectId]) || SECT_ROBE_COLORS.none!,
    weapon,
    armor: !!c.equipment.armor,
    accessory: !!c.equipment.accessory,
    enemyTier: enemyTierForCultivation(c.cultivation?.tier ?? 0),
    limp: has('leg') || c.conditions.some((x) => x.id === 'limp'),
    armHurt: has('arm'),
    hunch: has('head', true) || has('torso', true),
    bleeding: c.conditions.some((x) => BLEED.test(x.id) || BLEED.test(x.name)),
    place: placeToInk(c.location) as SparPlace,
    season: seasonToInk(state.month ?? 1) as SparSeason,
  };
}

/** 射程（設計單位） */
export function reachFor(weapon: WeaponKind | null): number {
  return SPAR_WEAPONS[weapon ?? 'fist'].reach;
}
