import type { LifeGameState } from '@interfaces/lifeEngine';

export type AchievementDef = {
  id: string;
  label: string;
  /** 未解鎖時的短提示（不劇透具體門檻數字亦可） */
  hint: string;
  test: (s: LifeGameState) => boolean;
};

/** 成就：可查清單；綽號仍由 titles.ts 負責 */
export const ACHIEVEMENT_RULES: AchievementDef[] = [
  {
    id: 'ach_first_blood',
    label: '初勝',
    hint: '在交手中取勝一場',
    test: (s) => (s.character.stats.combatsWon ?? 0) >= 1,
  },
  {
    id: 'ach_blade_eight',
    label: '八戰之客',
    hint: '累計戰勝八場',
    test: (s) => (s.character.stats.combatsWon ?? 0) >= 8,
  },
  {
    id: 'ach_kill',
    label: '血手',
    hint: '在交手決勝時取命',
    test: (s) => Number(s.character.flags.kills ?? 0) >= 1,
  },
  {
    id: 'ach_first_art',
    label: '初窺門徑',
    hint: '習得一門外功或內功',
    test: (s) => (s.character.skills?.length ?? 0) >= 1,
  },
  {
    id: 'ach_five_arts',
    label: '五藝在身',
    hint: '身懷五門武學',
    test: (s) => (s.character.skills?.length ?? 0) >= 5,
  },
  {
    id: 'ach_join_sect',
    label: '拜山門',
    hint: '拜入門派',
    test: (s) => Boolean(s.character.sectId || s.character.flags.joined_sect),
  },
  {
    id: 'ach_married',
    label: '結髮',
    hint: '有了眷屬',
    test: (s) => (s.character.stats.lovers ?? 0) >= 1 || Boolean(s.character.loverId),
  },
  {
    id: 'ach_heir',
    label: '添丁',
    hint: '得一子女',
    test: (s) => (s.character.childrenCount ?? 0) >= 1,
  },
  {
    id: 'ach_ink_hand',
    label: '閱事四十',
    hint: '歷事四十回',
    test: (s) => (s.character.stats.eventsSeen ?? 0) >= 40,
  },
  {
    id: 'ach_wealth',
    label: '囊中三百',
    hint: '家資峰值達三百兩',
    test: (s) => (s.character.stats.wealthPeak ?? 0) >= 300,
  },
  {
    id: 'ach_huashan',
    label: '論劍',
    hint: '踏上華山論劍台',
    test: (s) => Boolean(s.character.flags.huashan_ever),
  },
  {
    id: 'ach_champion',
    label: '華山魁首',
    hint: '華山論劍奪魁',
    test: (s) => Boolean(s.character.flags.title_huashan_champion),
  },
  {
    id: 'ach_elder',
    label: '甲子',
    hint: '年滿六十',
    test: (s) => s.character.age >= 60,
  },
  {
    id: 'ach_soft_hand',
    label: '點穴手',
    hint: '多次擊暈對手而不取命',
    test: (s) => Number(s.character.flags.aftermath_stun_soft ?? 0) >= 3,
  },
  {
    id: 'ach_legacy',
    label: '再世',
    hint: '轉世再入江湖',
    test: (s) => Number(s.character.flags.legacy_generation ?? 1) >= 2,
  },
];

function readAchievementIds(state: LifeGameState): string[] {
  const raw = state.character.flags.achievements;
  if (typeof raw !== 'string' || !raw.trim()) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function writeAchievementIds(state: LifeGameState, ids: string[]): void {
  state.character.flags.achievements = ids.join(',');
}

/** 檢查並寫入新成就；回傳年譜用短句（僅新解鎖） */
export function syncAchievements(state: LifeGameState): string[] {
  const have = new Set(readAchievementIds(state));
  const gained: string[] = [];
  for (const rule of ACHIEVEMENT_RULES) {
    if (have.has(rule.id)) continue;
    if (!rule.test(state)) continue;
    have.add(rule.id);
    gained.push(rule.label);
  }
  writeAchievementIds(state, [...have]);
  return gained.map((label) => `【成就】「${label}」記入卷首。`);
}

export function achievementLabels(state: LifeGameState): string[] {
  const ids = new Set(readAchievementIds(state));
  return ACHIEVEMENT_RULES.filter((r) => ids.has(r.id)).map((r) => r.label);
}

export function listAchievementStatus(state: LifeGameState): Array<{
  id: string;
  label: string;
  hint: string;
  unlocked: boolean;
}> {
  const ids = new Set(readAchievementIds(state));
  return ACHIEVEMENT_RULES.map((r) => ({
    id: r.id,
    label: r.label,
    hint: r.hint,
    unlocked: ids.has(r.id),
  }));
}

export function achievementProgress(state: LifeGameState): { unlocked: number; total: number } {
  const ids = new Set(readAchievementIds(state));
  return {
    unlocked: ACHIEVEMENT_RULES.filter((r) => ids.has(r.id)).length,
    total: ACHIEVEMENT_RULES.length,
  };
}
