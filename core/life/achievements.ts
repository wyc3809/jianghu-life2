import type { LifeGameState } from '@interfaces/lifeEngine';
import { jianghuRank } from './jianghuRank';

const bestSkillRank = (s: LifeGameState): number =>
  Math.max(0, ...Object.values(s.character.skillRanks ?? {}));
const cultTier = (s: LifeGameState): number => s.character.cultivation?.tier ?? 0;
const sectRank = (s: LifeGameState): number => (s.character.sectId ? (s.character.sectStanding ?? 0) : -1);


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
  // —— 戰績 ——
  {
    id: 'ach_thirty_fights',
    label: '身經三十戰',
    hint: '累計交手三十場',
    test: (s) => (s.character.stats.combats ?? 0) >= 30,
  },
  {
    id: 'ach_thirty_wins',
    label: '三十捷',
    hint: '累計戰勝三十場',
    test: (s) => (s.character.stats.combatsWon ?? 0) >= 30,
  },
  {
    id: 'ach_ten_kills',
    label: '十步一殺',
    hint: '決勝取命十回',
    test: (s) => Number(s.character.flags.kills ?? 0) >= 10,
  },
  // —— 武學 ——
  {
    id: 'ach_ten_arts',
    label: '十藝傍身',
    hint: '身懷十門武學',
    test: (s) => (s.character.skills?.length ?? 0) >= 10,
  },
  {
    id: 'ach_art_fluent',
    label: '融會貫通',
    hint: '任一武學練至「融會貫通」',
    test: (s) => bestSkillRank(s) >= 2,
  },
  {
    id: 'ach_art_master',
    label: '神乎其技',
    hint: '任一武學練至「神乎其技」',
    test: (s) => bestSkillRank(s) >= 3,
  },
  {
    id: 'ach_martial_300',
    label: '武學三百',
    hint: '武學修為達三百',
    test: (s) => (s.character.martial ?? 0) >= 300,
  },
  // —— 修為境界（索引對應 cultivation.ts CULTIVATION_TIERS）——
  {
    id: 'ach_tier_small_cycle',
    label: '小周天',
    hint: '修為踏入「小周天」',
    test: (s) => cultTier(s) >= 3,
  },
  {
    id: 'ach_tier_rendu',
    label: '任督已通',
    hint: '修為踏入「打通任督」',
    test: (s) => cultTier(s) >= 6,
  },
  {
    id: 'ach_tier_xiantian',
    label: '先天',
    hint: '修為踏入「先天之境」',
    test: (s) => cultTier(s) >= 9,
  },
  {
    id: 'ach_tier_tianren',
    label: '天人',
    hint: '修為踏入「天人合一」',
    test: (s) => cultTier(s) >= 12,
  },
  {
    id: 'ach_tier_god',
    label: '武道通神',
    hint: '修為登臨最後一境',
    test: (s) => cultTier(s) >= 14,
  },
  // —— 門派（索引對應 content/sects/sects.json ranks）——
  {
    id: 'ach_sect_inner',
    label: '登堂入室',
    hint: '升為內門弟子',
    test: (s) => sectRank(s) >= 2,
  },
  {
    id: 'ach_sect_true',
    label: '衣缽真傳',
    hint: '升為真傳弟子',
    test: (s) => sectRank(s) >= 3,
  },
  {
    id: 'ach_sect_elder',
    label: '一堂長老',
    hint: '升為門中長老',
    test: (s) => sectRank(s) >= 6,
  },
  {
    id: 'ach_sect_master',
    label: '一派之主',
    hint: '接任掌門',
    test: (s) => sectRank(s) >= 7,
  },
  {
    id: 'ach_found_sect',
    label: '開宗立派',
    hint: '自立門戶',
    test: (s) => Boolean(s.foundedSect || s.character.flags.founded_sect),
  },
  // —— 江湖排名 ——
  {
    id: 'ach_rank_1000',
    label: '嶄露頭角',
    hint: '江湖排名進入前一千',
    test: (s) => jianghuRank(s) <= 1000,
  },
  {
    id: 'ach_rank_100',
    label: '一流高手',
    hint: '江湖排名進入前一百',
    test: (s) => jianghuRank(s) <= 100,
  },
  {
    id: 'ach_rank_10',
    label: '天下絕頂',
    hint: '江湖排名進入前十',
    test: (s) => jianghuRank(s) <= 10,
  },
  // —— 名利 ——
  {
    id: 'ach_wealth_1000',
    label: '千金之家',
    hint: '家資峰值達一千兩',
    test: (s) => (s.character.stats.wealthPeak ?? 0) >= 1000,
  },
  {
    id: 'ach_rep_100',
    label: '名動一方',
    hint: '名望達一百',
    test: (s) => (s.character.reputation ?? 0) >= 100,
  },
  // —— 人生 ——
  {
    id: 'ach_events_200',
    label: '閱盡滄桑',
    hint: '歷事兩百回',
    test: (s) => (s.character.stats.eventsSeen ?? 0) >= 200,
  },
  {
    id: 'ach_children_three',
    label: '兒孫滿堂',
    hint: '得三名子女',
    test: (s) => (s.character.childrenCount ?? 0) >= 3,
  },
  {
    id: 'ach_age_80',
    label: '耄耋',
    hint: '年滿八十',
    test: (s) => s.character.age >= 80,
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
