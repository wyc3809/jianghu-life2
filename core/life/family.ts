import { LEGACY_FEATURES_ENABLED } from '@data/redesign/legacyFeatures';
import type { LifeGameState } from '@interfaces/lifeEngine';
import { getRng } from '@core/random';
import { FAMILY_RULES } from '@data/content/packs';
import { chineseSurnameOf, randomChineseName } from '@core/ids';
import { pushChronicle } from './chronicle';
import { syncRngFromState, snapshotRng } from './gameState';
import { economyDay } from './economyDay';
import { syncAchievements } from './achievements';

export function rollLifetimeChildrenMax(rng: { nextInt: (a: number, b: number) => number }): number {
  return rng.nextInt(FAMILY_RULES.lifetimeChildrenMin, FAMILY_RULES.lifetimeChildrenMax);
}

export function ensureFamilyFields(
  c: LifeGameState['character'],
  rng?: { nextInt: (a: number, b: number) => number },
): void {
  if (c.childrenCount === undefined) c.childrenCount = 0;
  if (c.monthsSinceLastBirth === undefined) c.monthsSinceLastBirth = 99;
  if (c.childrenMax === undefined || c.childrenMax < 1) {
    const r = rng ?? getRng();
    c.childrenMax = rollLifetimeChildrenMax(r);
  }
  if (!c.family) c.family = {};
  if (!c.family.childrenNames) c.family.childrenNames = [];
}

export type ChildBirthGate =
  | { ok: true }
  | { ok: false; reason: string };

export function canHaveChild(state: LifeGameState, day = economyDay()): ChildBirthGate {
  const c = state.character;
  if (!c.alive) return { ok: false, reason: '已無法添丁。' };
  if (FAMILY_RULES.requireLover && !c.loverId) {
    return { ok: false, reason: '尚未有眷屬，難以添丁。' };
  }
  if (c.childrenCount >= c.childrenMax) {
    return { ok: false, reason: '此生子女已滿，不宜再添。' };
  }
  if (typeof c.flags.last_birth_day === 'string' && c.flags.last_birth_day >= day) {
    return { ok: false, reason: '今日已添丁，待香港時間凌晨 4 點後再議。' };
  }
  return { ok: true };
}

function spawnChild(state: LifeGameState, source: 'monthly' | 'seek', day: string): string[] {
  const c = state.character;
  const rng = getRng();
  c.childrenCount += 1;
  c.flags.last_birth_day = day;
  const childName = randomChineseName(chineseSurnameOf(c.name));
  const childId = `child_${c.childrenCount}_${state.year}_${state.month}`;
  const gender = rng.chance(0.5) ? 'male' : 'female';
  state.npcs[childId] = {
    id: childId,
    name: childName,
    gender,
    role: 'friend',
    affinity: 70,
    memories: [`${state.year}年${state.month}月降生`],
    alive: true,
  };
  if (!c.family.childrenNames) c.family.childrenNames = [];
  c.family.childrenNames.push(childName);
  // 長子／長女為預設繼承人
  if (LEGACY_FEATURES_ENABLED) {
    if (!c.flags.heir_name) c.flags.heir_name = childName;
    c.flags.family_legacy = true;
  }

  const loverName = c.loverId && state.npcs[c.loverId] ? state.npcs[c.loverId].name : '眷屬';
  const title = source === 'seek' ? '【求子得償】' : '【添丁】';
  const lines = [
    `${title}你與${loverName}得一${gender === 'male' ? '子' : '女'}，取名${childName}。`,
    LEGACY_FEATURES_ENABLED ? `（子女 ${c.childrenCount} · 繼承人「${c.flags.heir_name}」）` : `（子女 ${c.childrenCount}）`,
    ...syncAchievements(state),
  ];
  return lines;
}

/** 有眷屬時低機率得子；一生最多 childrenMax（1–5） */
export function tryMonthlyBirth(state: LifeGameState, day = economyDay()): string[] {
  ensureFamilyFields(state.character);
  const gate = canHaveChild(state, day);
  if (!gate.ok) return [];

  const rng = getRng();
  if (!rng.chance(FAMILY_RULES.monthlyBirthChance)) return [];

  const lines = spawnChild(state, 'monthly', day);
  pushChronicle(state, lines);
  return lines;
}

/**
 * 玩家主動求子（修行行動）。
 * 費銀 20；有機率得子，否則可能增加眷屬親密度。
 */
export function seekChild(state: LifeGameState, day = economyDay()): string[] {
  syncRngFromState(state);
  const c = state.character;
  ensureFamilyFields(c);
  const gate = canHaveChild(state, day);
  if (!gate.ok) {
    snapshotRng(state);
    return [gate.reason];
  }
  if (c.money < 20) {
    snapshotRng(state);
    return ['求醫祈嗣需銀約二十兩，囊中不足。'];
  }

  const rng = getRng();
  c.money -= 20;
  const lines: string[] = ['你與眷屬求醫祈嗣，花去銀兩 20。'];

  // 主動求子：較高機率當月成
  if (rng.chance(0.55)) {
    lines.push(...spawnChild(state, 'seek', day));
  } else if (rng.chance(0.5)) {
    lines.push('醫者言：脈象尚可，且安心調養。');
  } else {
    lines.push('此番未果。巷口風硬，你二人相對無言片刻。');
    if (c.loverId && state.npcs[c.loverId]) {
      state.npcs[c.loverId]!.affinity = Math.min(
        100,
        (state.npcs[c.loverId]!.affinity ?? 50) + 3,
      );
      lines.push('雖無子嗣，兩人仍決定相伴度日。');
    }
  }

  pushChronicle(state, lines);
  snapshotRng(state);
  return lines;
}

/** 指定繼承人（需已有子女） */
export function designateHeir(state: LifeGameState, childName: string): string[] {
  if (!LEGACY_FEATURES_ENABLED) return [];
  const c = state.character;
  ensureFamilyFields(c);
  const names = c.family.childrenNames ?? [];
  if (!names.includes(childName)) return ['無此子女。'];
  c.flags.heir_name = childName;
  c.flags.family_legacy = true;
  const lines = [`你立下字據：以「${childName}」為繼承人，族產他日歸其掌管。`];
  pushChronicle(state, lines);
  return lines;
}

export function listChildNames(state: LifeGameState): string[] {
  ensureFamilyFields(state.character);
  return [...(state.character.family.childrenNames ?? [])];
}

export function getHeirName(state: LifeGameState): string | null {
  const named = state.character.flags.heir_name;
  if (typeof named === 'string' && named) return named;
  const kids = listChildNames(state);
  return kids[0] ?? null;
}

/**
 * 家族銀庫：角色離世時銀兩全數傳落後人（有冇子女都一樣，無嗣由旁支承接）。
 * design/agreed-design-2026-10.md §1。
 */
export function previewInheritanceMoney(state: LifeGameState): number {
  return Math.max(0, Math.floor(state.character.money ?? 0));
}

/** 家族裝備庫：所有持有＋穿戴中嘅裝備（去重），接班時全數傳落後人 */
export function familyGearCarry(state: LifeGameState): string[] {
  const c = state.character;
  const eq = c.equipment ?? { weapon: null, armor: null, accessory: null };
  const ids = [...(c.gear ?? []), eq.weapon, eq.armor, eq.accessory].filter(
    (x): x is string => typeof x === 'string' && x.length > 0,
  );
  return [...new Set(ids)];
}
