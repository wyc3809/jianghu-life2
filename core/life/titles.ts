import type { LifeGameState } from '@interfaces/lifeEngine';
import { getSectContent, sectStandingName } from '@data/content/packs';
import { applyAchievementRankBonus } from './jianghuRank';
import { gainJianghuPrestige } from './jianghuPrestige';
import { ART_MASTERY_THRESHOLD, artProficiency } from './arts';

/** 稱號戰鬥加成——同裝備／武學被動同一套疊加邏輯，套用時只取「最強 3 個」總和 */
export type TitleBonus = {
  attack?: number;
  defense?: number;
  hitBonus?: number;
  evasion?: number;
};

export type TitleCategory = 'sect' | 'combat' | 'wealth' | 'romance' | 'fame' | 'hermit' | 'legend';

interface TitleDef {
  id: string;
  /** 越高越「強」；顯示同加成都以此排序，只留前 3 個 */
  tier: 1 | 2 | 3 | 4 | 5;
  category: TitleCategory;
  /** 固定文案，或依角色狀態動態生成（如門派名＋門中地位） */
  label: string | ((s: LifeGameState) => string);
  bonus?: TitleBonus;
  test: (s: LifeGameState) => boolean;
}

function sectRankLabel(s: LifeGameState): string {
  const c = s.character;
  const sect = c.sectId ? getSectContent(c.sectId) : undefined;
  const rank = sectStandingName(c.sectStanding ?? 0);
  return sect ? `${sect.name}${rank}` : rank;
}

/**
 * 稱號規則庫：參考各大武俠小說／遊戲慣用稱號結構——入門、門派、戰績、財富、
 * 姻緣、隱士、巔峰宗師（如「四絕」）。一旦達成即永久保留（江湖上的名聲不會
 * 平白消失），但顯示同加成只計最強 3 個，避免無限疊加。
 */
const TITLE_RULES: TitleDef[] = [
  // tier 1 — 入門／閒談
  {
    id: 'title_novice',
    tier: 1,
    category: 'fame',
    label: '初入門徑',
    test: (s) => (s.character.stats.monthsLived ?? 0) >= 1,
  },
  {
    id: 'title_soft_hand',
    tier: 1,
    category: 'fame',
    label: '手軟',
    test: (s) => Number(s.character.flags.aftermath_stun_soft ?? 0) >= 3,
  },
  {
    id: 'title_ink_hand',
    tier: 1,
    category: 'fame',
    label: '墨手',
    bonus: { hitBonus: 0.01 },
    test: (s) => (s.character.stats.eventsSeen ?? 0) >= 40,
  },
  {
    id: 'title_lover',
    tier: 1,
    category: 'romance',
    label: '有眷',
    test: (s) => (s.character.stats.lovers ?? 0) >= 1,
  },
  {
    id: 'title_tipsy',
    tier: 1,
    category: 'fame',
    label: '微醺客',
    test: (s) => Number(s.character.flags.wineDrunkCount ?? 0) >= 5,
  },

  // tier 2 — 門派入門／小成
  {
    id: 'title_sect_rank',
    tier: 2,
    category: 'sect',
    label: sectRankLabel,
    bonus: { attack: 1 },
    test: (s) => Boolean(s.character.sectId),
  },
  {
    id: 'title_rich',
    tier: 2,
    category: 'wealth',
    label: '囊豐',
    test: (s) => (s.character.stats.wealthPeak ?? 0) >= 300,
  },
  {
    id: 'title_wine_lover',
    tier: 2,
    category: 'fame',
    label: '酒中客',
    bonus: { evasion: 0.01 },
    test: (s) => Number(s.character.flags.wineDrunkCount ?? 0) >= 20,
  },
  {
    id: 'title_wanderer',
    tier: 2,
    category: 'fame',
    label: '遊方客',
    bonus: { evasion: 0.02 },
    test: (s) => (s.character.stats.eventsSeen ?? 0) >= 100,
  },

  // tier 3 — 中堅戰績
  {
    id: 'title_blade_scar',
    tier: 3,
    category: 'combat',
    label: '刀疤客',
    bonus: { defense: 2 },
    test: (s) => (s.character.stats.combatsWon ?? 0) >= 8,
  },
  {
    id: 'title_huashan',
    tier: 3,
    category: 'combat',
    label: '論劍客',
    bonus: { hitBonus: 0.02 },
    test: (s) => Boolean(s.character.flags.huashan_ever),
  },
  {
    id: 'title_hunter',
    tier: 3,
    category: 'combat',
    label: '除魔獵人',
    bonus: { attack: 2 },
    test: (s) => (s.character.stats.combatsWon ?? 0) >= 20,
  },
  {
    id: 'title_elder',
    tier: 3,
    category: 'fame',
    label: '暮年客',
    bonus: { defense: 3 },
    test: (s) => s.character.age >= 60,
  },
  {
    id: 'title_righteous',
    tier: 3,
    category: 'legend',
    label: '急公好義',
    bonus: { defense: 2, hitBonus: 0.01 },
    test: (s) => Boolean(s.character.flags.nature_arc_xia_hero),
  },
  {
    id: 'title_underworld',
    tier: 3,
    category: 'legend',
    label: '黑道梟雄',
    bonus: { attack: 3 },
    test: (s) =>
      Boolean(s.character.flags.nature_arc_e_underworld) || Boolean(s.character.flags.nature_arc_e_lone),
  },
  {
    id: 'title_madman',
    tier: 3,
    category: 'legend',
    label: '瘋魔狂徒',
    bonus: { attack: 2, evasion: 0.01 },
    test: (s) => Boolean(s.character.flags.nature_arc_kuang_done),
  },

  // tier 4 — 高階
  {
    id: 'title_master',
    tier: 4,
    category: 'combat',
    label: '一派高手',
    bonus: { attack: 4, defense: 2 },
    test: (s) => s.character.martial >= 70,
  },
  {
    id: 'title_wealthy',
    tier: 4,
    category: 'wealth',
    label: '富甲一方',
    test: (s) => (s.character.stats.wealthPeak ?? 0) >= 800,
  },
  {
    id: 'title_duelist',
    tier: 4,
    category: 'combat',
    label: '百戰不殆',
    bonus: { attack: 3, hitBonus: 0.03 },
    test: (s) => (s.character.stats.combatsWon ?? 0) >= 40,
  },
  {
    id: 'title_drunken_immortal',
    tier: 4,
    category: 'legend',
    label: '醉八仙',
    bonus: { attack: 3, evasion: 0.02 },
    test: (s) => Number(s.character.flags.wineDrunkCount ?? 0) >= 60,
  },

  // tier 3 — 雅藝有成
  ...(
    [
      { id: 'guqin', label: '琴中仙', bonus: { hitBonus: 0.03 } },
      { id: 'weiqi', label: '棋道宗師', bonus: { defense: 3 } },
      { id: 'poetry', label: '詩劍才子', bonus: { hitBonus: 0.03 } },
      { id: 'painting', label: '丹青妙手', bonus: { evasion: 0.03 } },
      { id: 'buddhism', label: '禮佛居士', bonus: { defense: 3 } },
      { id: 'daoism', label: '玄門道長', bonus: { defense: 2, evasion: 0.01 } },
      { id: 'darkArts', label: '邪學宗師', bonus: { attack: 3 } },
    ] as const
  ).map(
    (art): TitleDef => ({
      id: `title_art_${art.id}`,
      tier: 3,
      category: 'fame',
      label: art.label,
      bonus: art.bonus,
      test: (s) => artProficiency(s, art.id) >= ART_MASTERY_THRESHOLD,
    }),
  ),
  {
    id: 'title_grandmaster',
    tier: 4,
    category: 'legend',
    label: '一代宗師',
    bonus: { attack: 5 },
    test: (s) => Object.values(s.character.skillRanks ?? {}).some((r) => r >= 4),
  },

  // tier 5 — 巔峰／傳說
  {
    id: 'title_top4',
    tier: 5,
    category: 'legend',
    label: '天下四絕之一',
    bonus: { attack: 8, defense: 4, hitBonus: 0.05 },
    test: (s) =>
      s.character.martial >= 95 && (s.character.stats.combatsWon ?? 0) >= 40 && s.character.reputation >= 200,
  },
  {
    id: 'title_number_one',
    tier: 5,
    category: 'legend',
    label: '天下第一',
    bonus: { attack: 12, defense: 6, evasion: 0.05 },
    test: (s) => s.character.martial >= 99,
  },

  // 開宗立派
  {
    id: 'title_founder',
    tier: 4,
    category: 'sect',
    label: '開山祖師',
    bonus: { defense: 3 },
    test: (s) => Boolean(s.foundedSect),
  },
  {
    id: 'title_many_disciples',
    tier: 5,
    category: 'sect',
    label: '桃李滿門',
    bonus: { attack: 4, defense: 4 },
    test: (s) => (s.foundedSect?.disciples.filter((d) => d.status === 'graduated').length ?? 0) >= 3,
  },
];

function readTitleIds(state: LifeGameState): string[] {
  const raw = state.character.flags.titles;
  if (typeof raw !== 'string' || !raw.trim()) return [];
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

function writeTitleIds(state: LifeGameState, ids: string[]): void {
  state.character.flags.titles = ids.join(',');
}

function resolveLabel(rule: TitleDef, state: LifeGameState): string {
  return typeof rule.label === 'function' ? rule.label(state) : rule.label;
}

/** 每月檢核：新達成的稱號寫入永久紀錄，回傳給年譜的新稱號提示句 */
export function syncTitles(state: LifeGameState): string[] {
  const have = new Set(readTitleIds(state));
  const gained: Array<{ label: string; tier: number }> = [];
  for (const rule of TITLE_RULES) {
    if (have.has(rule.id)) continue;
    if (!rule.test(state)) continue;
    have.add(rule.id);
    gained.push({ label: resolveLabel(rule, state), tier: rule.tier });
  }
  writeTitleIds(state, [...have]);
  const lines: string[] = [];
  for (const g of gained) {
    lines.push(`江湖上開始有人稱你「${g.label}」。`);
    lines.push(...applyAchievementRankBonus(state, g.tier * 30));
    lines.push(...gainJianghuPrestige(state, g.tier * 12));
  }
  return lines;
}

/** 已達成的全部稱號（依 tier 由高到低排序），含動態文案（如門派地位會隨升遷更新） */
export function allTitles(state: LifeGameState): Array<{ id: string; label: string; tier: number; bonus?: TitleBonus }> {
  const ids = new Set(readTitleIds(state));
  return TITLE_RULES.filter((r) => ids.has(r.id))
    .map((r) => ({ id: r.id, label: resolveLabel(r, state), tier: r.tier, bonus: r.bonus }))
    .sort((a, b) => b.tier - a.tier);
}

/** 只顯示最強的 N 個稱號（預設 3）——UI 一律用這個，避免名帖一長串 */
export function topTitles(state: LifeGameState, count = 3): string[] {
  return allTitles(state)
    .slice(0, count)
    .map((t) => t.label);
}

/** @deprecated 用 topTitles / allTitles；保留給既有呼叫點相容 */
export function titleLabels(state: LifeGameState): string[] {
  return allTitles(state).map((t) => t.label);
}

/** 稱號稀有度色階（tier 1~5，越高越罕見）：白＜綠＜藍＜紫＜橙，對應顯示用 CSS class */
export const TITLE_TIER_COLOR_CLASS: Record<number, string> = {
  1: 'ink-title-tier-1',
  2: 'ink-title-tier-2',
  3: 'ink-title-tier-3',
  4: 'ink-title-tier-4',
  5: 'ink-title-tier-5',
};

export function titleTierColorClass(tier: number): string {
  return TITLE_TIER_COLOR_CLASS[tier] ?? TITLE_TIER_COLOR_CLASS[1]!;
}

/** 最高 tier 嘅單一稱號（放全名右邊用）；未有任何稱號時回傳 null */
export function topTitle(state: LifeGameState): { label: string; tier: number } | null {
  const top = allTitles(state)[0];
  return top ? { label: top.label, tier: top.tier } : null;
}

/** 顯示中最強 3 個稱號的戰鬥加成總和；未上榜的稱號不計加成 */
export function titleBonusTotals(state: LifeGameState, count = 3): Required<TitleBonus> {
  const top = allTitles(state).slice(0, count);
  return top.reduce(
    (acc, t) => ({
      attack: acc.attack + (t.bonus?.attack ?? 0),
      defense: acc.defense + (t.bonus?.defense ?? 0),
      hitBonus: acc.hitBonus + (t.bonus?.hitBonus ?? 0),
      evasion: acc.evasion + (t.bonus?.evasion ?? 0),
    }),
    { attack: 0, defense: 0, hitBonus: 0, evasion: 0 },
  );
}
