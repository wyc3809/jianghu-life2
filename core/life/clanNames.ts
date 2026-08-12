import type { LifeGameState } from '@interfaces/lifeEngine';
import {
  chineseSurnameOf,
  normalizeMotherName,
  randomChineseMotherName,
  withChineseSurname,
} from '@core/ids';

/** 決定本支族姓：先祖 > 本人 > 父 */
export function clanSurnameOf(state: LifeGameState): string {
  const c = state.character;
  if (typeof c.flags.legacy_ancestor === 'string' && c.flags.legacy_ancestor) {
    return chineseSurnameOf(String(c.flags.legacy_ancestor));
  }
  if (c.name?.trim()) return chineseSurnameOf(c.name);
  if (c.family?.fatherName) return chineseSurnameOf(c.family.fatherName);
  return '李';
}

function isMotherBloodlineParent(state: LifeGameState): boolean {
  const c = state.character;
  if (c.gender !== 'female') return false;
  if (!c.family?.motherName || !c.flags.legacy_ancestor) return false;
  return c.family.motherName === String(c.flags.legacy_ancestor);
}

function ensureMotherName(state: LifeGameState, clanSurname: string): void {
  const c = state.character;
  if (!c.family?.motherName) return;
  const bloodline = isMotherBloodlineParent(state);
  const seedKey = `${state.seed}:${c.family.motherName}`;
  c.family.motherName = normalizeMotherName(
    clanSurname,
    c.family.motherName,
    seedKey,
    bloodline,
  );
  if (state.npcs.parent_mother) {
    state.npcs.parent_mother.name = c.family.motherName;
    state.npcs.parent_mother.gender = 'female';
  }
}

/**
 * 族譜：本人／父／子女同支姓；母親外姓女性名；眷屬不改。
 */
export function alignClanSurnames(state: LifeGameState): string {
  const c = state.character;
  if (!c.family) c.family = {};
  if (!c.family.childrenNames) c.family.childrenNames = [];

  const surname = clanSurnameOf(state);
  c.name = withChineseSurname(surname, c.name);

  if (c.family.fatherName) {
    c.family.fatherName = withChineseSurname(surname, c.family.fatherName);
  }
  ensureMotherName(state, surname);

  if (state.npcs.parent_father) {
    state.npcs.parent_father.name = c.family.fatherName || state.npcs.parent_father.name;
    state.npcs.parent_father.name = withChineseSurname(surname, state.npcs.parent_father.name);
  }

  const kids = c.family.childrenNames.map((n) => withChineseSurname(surname, n));
  c.family.childrenNames = kids;
  if (typeof c.flags.heir_name === 'string' && c.flags.heir_name) {
    c.flags.heir_name = withChineseSurname(surname, String(c.flags.heir_name));
  }
  for (const npc of Object.values(state.npcs)) {
    if (!npc.id.startsWith('child_')) continue;
    npc.name = withChineseSurname(surname, npc.name);
  }

  if (typeof c.flags.legacy_ancestor === 'string' && c.flags.legacy_ancestor) {
    c.flags.legacy_ancestor = withChineseSurname(surname, String(c.flags.legacy_ancestor));
  }

  return surname;
}

export { randomChineseMotherName };
