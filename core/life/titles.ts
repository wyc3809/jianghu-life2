import type { LifeCharacter, LifeGameState } from '@interfaces/lifeEngine';
import { pushMoment } from './moments';
import { getSectContent, sectStandingName } from '@data/content/packs';
import { applyAchievementRankBonus } from './jianghuRank';
import { gainJianghuPrestige } from './jianghuPrestige';
import { ART_MASTERY_THRESHOLD, TAOHUA_CULTURE_ARTS, artProficiency } from './arts';
import { getGearDef } from '@data/equipment/catalog';
import { canonicalSkillId, getSkillDef } from '@data/skills/catalog';
import { MARTIAL_RANKS } from './martialRanks';

export const RANK_ONE_TITLE_ID = 'title_number_one';
export const TITLE_SLOT_LIMIT = 3;

/** 稱號戰鬥加成——同裝備／武學被動同一套疊加邏輯，只計入裝備的稱號 */
export type TitleBonus = {
  attack?: number;
  defense?: number;
  hitBonus?: number;
  evasion?: number;
};

export type TitleCategory = 'sect' | 'combat' | 'wealth' | 'romance' | 'fame' | 'hermit' | 'legend';

interface TitleDef {
  id: string;
  /** 稀有度；未自選時按此排序 */
  tier: 1 | 2 | 3 | 4 | 5;
  category: TitleCategory;
  /** 固定文案，或依角色狀態動態生成（如門派名＋門中地位） */
  label: string | ((c: LifeCharacter) => string);
  requirement: string;
  bonus?: TitleBonus;
  test: (s: LifeGameState) => boolean;
}

const clearedStage = (s: LifeGameState) => Number(s.character.flags.spar_stage ?? 1) - 1;
const graduates = (s: LifeGameState) => s.foundedSect?.disciples.filter(d => d.status === 'graduated').length ?? 0;
function knownSkills(s: LifeGameState, minimumRank = 0) {
  const ids = s.character.skills.filter(id => (s.character.skillRanks[id] ?? 0) >= minimumRank).map(canonicalSkillId);
  return [...new Set(ids)].flatMap(id => getSkillDef(id) ?? []);
}

const masteredSkills = (s: LifeGameState) => knownSkills(s, MARTIAL_RANKS.length - 1);
const rareGear = (s: LifeGameState) => [...new Set(s.character.gear)].map(getGearDef)
  .filter(g => g && (g.rarity === 'mythic' || g.rarity === 'divine'));

function sectRankLabel(c: LifeCharacter): string {
  const sect = c.sectId ? getSectContent(c.sectId) : undefined;
  const rank = sectStandingName(c.sectStanding ?? 0);
  return sect ? `${sect.name}${rank}` : rank;
}

/**
 * 稱號規則庫：參考各大武俠小說／遊戲慣用稱號結構——入門、門派、戰績、財富、
 * 姻緣、隱士、巔峰宗師（如「四絕」）。一旦達成即永久保留（江湖上的名聲不會
 * 平白消失），但顯示同加成只計裝備的 3 個，避免無限疊加。
 */
const TITLE_RULES: TitleDef[] = [
  // tier 1 — 入門／閒談
  {
    id: 'title_novice',
    requirement: '度過一個月',
    tier: 1,
    category: 'fame',
    label: '初入門徑',
    test: (s) => (s.character.stats.monthsLived ?? 0) >= 1,
  },
  {
    id: 'title_soft_hand',
    requirement: '戰後手下留情 3 次',
    tier: 1,
    category: 'fame',
    label: '手軟',
    test: (s) => Number(s.character.flags.aftermath_stun_soft ?? 0) >= 3,
  },
  {
    id: 'title_ink_hand',
    requirement: '經歷 40 則江湖事件',
    tier: 1,
    category: 'fame',
    label: '墨手',
    bonus: { hitBonus: 0.01 },
    test: (s) => (s.character.stats.eventsSeen ?? 0) >= 40,
  },
  {
    id: 'title_lover',
    requirement: '結下一段情緣',
    tier: 1,
    category: 'romance',
    label: '有眷',
    test: (s) => (s.character.stats.lovers ?? 0) >= 1,
  },
  {
    id: 'title_tipsy',
    requirement: '飲酒 5 次',
    tier: 1,
    category: 'fame',
    label: '微醺客',
    test: (s) => Number(s.character.flags.wineDrunkCount ?? 0) >= 5,
  },

  // tier 2 — 門派入門／小成
  {
    id: 'title_sect_rank',
    requirement: '加入一個門派',
    tier: 2,
    category: 'sect',
    label: sectRankLabel,
    bonus: { attack: 1 },
    test: (s) => Boolean(s.character.sectId),
  },
  {
    id: 'title_rich',
    requirement: '曾持有 600 兩銀',
    tier: 2,
    category: 'wealth',
    label: '囊豐',
    test: (s) => (s.character.stats.wealthPeak ?? 0) >= 600,
  },
  {
    id: 'title_wine_lover',
    requirement: '飲酒 20 次',
    tier: 2,
    category: 'fame',
    label: '酒中客',
    bonus: { evasion: 0.01 },
    test: (s) => Number(s.character.flags.wineDrunkCount ?? 0) >= 20,
  },
  {
    id: 'title_wanderer',
    requirement: '經歷 140 則江湖事件',
    tier: 2,
    category: 'fame',
    label: '遊方客',
    bonus: { evasion: 0.02 },
    test: (s) => (s.character.stats.eventsSeen ?? 0) >= 140,
  },

  // tier 3 — 中堅戰績
  {
    id: 'title_blade_scar',
    requirement: '累積 8 場江湖勝仗',
    tier: 3,
    category: 'combat',
    label: '刀疤客',
    bonus: { defense: 2 },
    test: (s) => (s.character.stats.combatsWon ?? 0) >= 8,
  },
  {
    id: 'title_huashan',
    requirement: '參加華山論劍',
    tier: 3,
    category: 'combat',
    label: '論劍客',
    bonus: { hitBonus: 0.02 },
    test: (s) => Boolean(s.character.flags.huashan_ever),
  },
  {
    id: 'title_hunter',
    requirement: '累積 30 場江湖勝仗',
    tier: 3,
    category: 'combat',
    label: '除魔獵人',
    bonus: { attack: 2 },
    test: (s) => (s.character.stats.combatsWon ?? 0) >= 30,
  },
  {
    id: 'title_elder',
    requirement: '舊版留名',
    tier: 3,
    category: 'fame',
    label: '暮年客',
    bonus: { defense: 3 },
    test: () => false, // 停止新增年齡稱號；已取得的紀錄與加成保留。
  },
  {
    id: 'title_righteous',
    requirement: '完成俠道故事',
    tier: 3,
    category: 'legend',
    label: '急公好義',
    bonus: { defense: 2, hitBonus: 0.01 },
    test: (s) => Boolean(s.character.flags.nature_arc_xia_hero),
  },
  {
    id: 'title_underworld',
    requirement: '完成邪道故事的黑道或獨行路線',
    tier: 3,
    category: 'legend',
    label: '黑道梟雄',
    bonus: { attack: 3 },
    test: (s) =>
      Boolean(s.character.flags.nature_arc_e_underworld) || Boolean(s.character.flags.nature_arc_e_lone),
  },
  {
    id: 'title_madman',
    requirement: '完成狂道故事',
    tier: 3,
    category: 'legend',
    label: '瘋魔狂徒',
    bonus: { attack: 2, evasion: 0.01 },
    test: (s) => Boolean(s.character.flags.nature_arc_kuang_done),
  },

  // tier 4 — 高階
  {
    id: 'title_master',
    requirement: '武藝達到 70',
    tier: 4,
    category: 'combat',
    label: '一派高手',
    bonus: { attack: 4, defense: 2 },
    test: (s) => s.character.martial >= 70,
  },
  {
    id: 'title_wealthy',
    requirement: '曾持有 2,500 兩銀',
    tier: 4,
    category: 'wealth',
    label: '富甲一方',
    test: (s) => (s.character.stats.wealthPeak ?? 0) >= 2500,
  },
  {
    id: 'title_duelist',
    requirement: '累積 100 場江湖勝仗',
    tier: 4,
    category: 'combat',
    label: '百戰不殆',
    bonus: { attack: 3, hitBonus: 0.03 },
    test: (s) => (s.character.stats.combatsWon ?? 0) >= 100,
  },
  {
    id: 'title_drunken_immortal',
    requirement: '飲酒 100 次',
    tier: 4,
    category: 'legend',
    label: '醉八仙',
    bonus: { attack: 3, evasion: 0.02 },
    test: (s) => Number(s.character.flags.wineDrunkCount ?? 0) >= 100,
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
      requirement: `將呢門雅藝練至精通（${ART_MASTERY_THRESHOLD} 次）`,
      bonus: art.bonus,
      test: (s) => artProficiency(s, art.id) >= ART_MASTERY_THRESHOLD,
    }),
  ),
  {
    id: 'title_grandmaster',
    requirement: '有兩門武學修至「神乎其技」',
    tier: 4,
    category: 'legend',
    label: '一代宗師',
    bonus: { attack: 5 },
    test: (s) => masteredSkills(s).length >= 2,
  },

  // tier 5 — 巔峰／傳說
  {
    id: 'title_top4',
    requirement: '武藝達到 95、贏 60 場江湖戰鬥，聲名達到 250',
    tier: 5,
    category: 'legend',
    label: '天下四絕之一',
    bonus: { attack: 8, defense: 4, hitBonus: 0.05 },
    test: (s) =>
      s.character.martial >= 95 && (s.character.stats.combatsWon ?? 0) >= 60 && s.character.reputation >= 250,
  },
  {
    id: RANK_ONE_TITLE_ID,
    requirement: '在多人對戰勝出，結算後排全服第 1 名',
    tier: 5,
    category: 'legend',
    label: '天下第一',
    bonus: { attack: 12, defense: 6, evasion: 0.05 },
    test: (s) => s.character.flags.online_rank_one_verified === true,
  },

  // 開宗立派
  {
    id: 'title_founder',
    requirement: '創立一個門派',
    tier: 4,
    category: 'sect',
    label: '開山祖師',
    bonus: { defense: 3 },
    test: (s) => Boolean(s.foundedSect),
  },
  {
    id: 'title_many_disciples',
    requirement: '培養 5 名弟子出師',
    tier: 5,
    category: 'sect',
    label: '桃李滿門',
    bonus: { attack: 4, defense: 4 },
    test: (s) => graduates(s) >= 5,
  },
  {
    id: 'title_spar_10', tier: 2, category: 'combat', label: '初破連陣',
    requirement: '通過演武台第 10 關',
    bonus: { attack: 1, defense: 1 },
    test: s => clearedStage(s) >= 10,
  },
  {
    id: 'title_spar_30', tier: 3, category: 'combat', label: '三十關客',
    requirement: '通過演武台第 30 關',
    bonus: { attack: 2, hitBonus: 0.02 },
    test: s => clearedStage(s) >= 30,
  },
  {
    id: 'title_spar_50', tier: 4, category: 'combat', label: '踏遍重關',
    requirement: '通過演武台第 50 關',
    bonus: { attack: 4, defense: 2 },
    test: s => clearedStage(s) >= 50,
  },
  {
    id: 'title_spar_60', tier: 5, category: 'combat', label: '六境試鋒',
    requirement: '通過演武台第 60 關',
    bonus: { attack: 6, defense: 4 },
    test: s => clearedStage(s) >= 60,
  },
  {
    id: 'title_open_meridians', tier: 3, category: 'legend', label: '一息通脈',
    requirement: '修至打通任督',
    bonus: { defense: 3 },
    test: s => s.character.cultivation.tier >= 6,
  },
  {
    id: 'title_innate', tier: 4, category: 'legend', label: '先天遊俠',
    requirement: '修至先天之境',
    bonus: { evasion: 0.03 },
    test: s => s.character.cultivation.tier >= 9,
  },
  {
    id: 'title_one_with_heaven', tier: 5, category: 'legend', label: '與天同息',
    requirement: '修至天人合一',
    bonus: { defense: 5, evasion: 0.03 },
    test: s => s.character.cultivation.tier >= 12,
  },
  {
    id: 'title_martial_peak', tier: 5, category: 'legend', label: '獨步武途',
    requirement: '修至武道通神',
    bonus: { attack: 7, hitBonus: 0.04 },
    test: s => s.character.cultivation.tier >= 14,
  },
  {
    id: 'title_three_disciplines', tier: 4, category: 'combat', label: '三藝同修',
    requirement: '外功、內功、輕功各有一門修至「神乎其技」',
    bonus: { attack: 3, evasion: 0.02 },
    test: s => new Set(masteredSkills(s).map(skill => skill.kind)).size >= 3,
  },
  {
    id: 'title_five_masteries', tier: 5, category: 'combat', label: '百法歸宗',
    requirement: '有五門武學修至「神乎其技」',
    bonus: { attack: 6, hitBonus: 0.03 },
    test: s => masteredSkills(s).length >= 5,
  },
  {
    id: 'title_manual_library', tier: 3, category: 'fame', label: '萬卷藏鋒',
    requirement: '習得 20 門武學',
    bonus: { hitBonus: 0.02 },
    test: s => knownSkills(s).length >= 20,
  },
  {
    id: 'title_relics', tier: 4, category: 'wealth', label: '藏三寶',
    requirement: '收藏 3 件不同的曠品或神兵級裝備',
    bonus: { defense: 4 },
    test: s => rareGear(s).length >= 3,
  },
  {
    id: 'title_treasury', tier: 5, category: 'wealth', label: '一閣神藏',
    requirement: '收藏曠品或神兵級武器、護甲及飾品各一件',
    bonus: { defense: 5, hitBonus: 0.03 },
    test: s => new Set(rareGear(s).map(g => g?.slot)).size >= 3,
  },
  {
    id: 'title_huashan_champion', tier: 5, category: 'combat', label: '華山折桂',
    requirement: '奪得華山論劍冠軍',
    bonus: { attack: 6, hitBonus: 0.04 },
    test: s => Boolean(s.character.flags.title_huashan_champion),
  },
  {
    id: 'title_hall_of_students', tier: 4, category: 'sect', label: '傳燈授藝',
    requirement: '創立門派並培養 2 名弟子出師',
    bonus: { defense: 4, hitBonus: 0.01 },
    test: s => graduates(s) >= 2,
  },
  {
    id: 'title_inner_circle', tier: 3, category: 'sect', label: '門中砥柱',
    requirement: '在現有門派升至門中執事或以上',
    bonus: { defense: 3, hitBonus: 0.01 },
    test: s => Boolean(s.character.sectId) && (s.character.sectStanding ?? 0) >= 4,
  },
  {
    id: 'title_four_arts', tier: 4, category: 'fame', label: '四藝知音',
    requirement: '古琴、圍棋、詩書、繪畫全部達至精通',
    bonus: { hitBonus: 0.04 },
    test: s => TAOHUA_CULTURE_ARTS.every(id => artProficiency(s, id) >= ART_MASTERY_THRESHOLD),
  },
  {
    id: 'title_buddhist_tao', tier: 4, category: 'hermit', label: '禪道同參',
    requirement: '佛法同道法都達至精通',
    bonus: { defense: 4, evasion: 0.02 },
    test: s => artProficiency(s, 'buddhism') >= ART_MASTERY_THRESHOLD && artProficiency(s, 'daoism') >= ART_MASTERY_THRESHOLD,
  },
  {
    id: 'title_wealth_10000', tier: 5, category: 'wealth', label: '萬兩藏家',
    requirement: '曾持有 10,000 兩銀',
    bonus: { defense: 5, hitBonus: 0.02 },
    test: s => s.character.stats.wealthPeak >= 10000,
  },
  {
    id: 'title_road_300', tier: 4, category: 'fame', label: '風塵誌客',
    requirement: '經歷 300 則江湖事件，累積 50 場江湖勝仗',
    bonus: { attack: 3, evasion: 0.03 },
    test: s => s.character.stats.eventsSeen >= 300 && s.character.stats.combatsWon >= 50,
  },
];

export type EarnedTitle = { id: string; label: string; tier: number; bonus?: TitleBonus };

function readTitleIds(raw: unknown): string[] {
  return typeof raw === 'string' ? raw.split(',').map(id => id.trim()).filter(Boolean) : [];
}

function resolveLabel(rule: TitleDef, character: LifeCharacter): string {
  return typeof rule.label === 'function' ? rule.label(character) : rule.label;
}

function earnedTitles(character: LifeCharacter, rankOneEarned: boolean): EarnedTitle[] {
  const ids = new Set(readTitleIds(character.flags.titles));
  return TITLE_RULES.filter(rule => rule.id === RANK_ONE_TITLE_ID ? rankOneEarned : ids.has(rule.id))
    .map(rule => ({ id: rule.id, label: resolveLabel(rule, character), tier: rule.tier, bonus: rule.bonus }))
    .sort((a, b) => b.tier - a.tier);
}

function selectedTitles(character: LifeCharacter, earned: EarnedTitle[]): EarnedTitle[] {
  if (typeof character.flags.equipped_titles !== 'string') return earned.slice(0, TITLE_SLOT_LIMIT);
  const available = new Map(earned.map(title => [title.id, title]));
  return [...new Set(readTitleIds(character.flags.equipped_titles))]
    .flatMap(id => available.get(id) ?? [])
    .slice(0, TITLE_SLOT_LIMIT);
}

/** 公開資料只能使用伺服器的排行資格。 */
export function onlineTitleLabels(character: LifeCharacter, rankOneEarned: boolean): string[] {
  return selectedTitles(character, earnedTitles(character, rankOneEarned)).map(title => title.label);
}

export function titleCollection(state: LifeGameState) {
  const unlocked = new Set(allTitles(state).map(title => title.id));
  return TITLE_RULES.filter(rule => rule.id !== 'title_elder' || unlocked.has(rule.id))
    .map(rule => ({
      id: rule.id, label: resolveLabel(rule, state.character), tier: rule.tier, bonus: rule.bonus,
      requirement: rule.requirement, unlocked: unlocked.has(rule.id),
    }))
    .sort((a, b) => Number(b.unlocked) - Number(a.unlocked) || b.tier - a.tier);
}

export function equippedTitles(state: LifeGameState): EarnedTitle[] {
  return selectedTitles(state.character, allTitles(state));
}

export function setEquippedTitles(state: LifeGameState, ids: readonly string[]): boolean {
  if (ids.length > TITLE_SLOT_LIMIT || new Set(ids).size !== ids.length) return false;
  const available = new Set(allTitles(state).map(title => title.id));
  if (ids.some(id => !available.has(id))) return false;
  state.character.flags.equipped_titles = ids.join(',');
  return true;
}

/** 檢核新稱號，永久記錄已解鎖項目並回傳年譜文案。 */
export function syncTitles(state: LifeGameState, announce = true): string[] {
  const have = new Set(readTitleIds(state.character.flags.titles));
  const gained: Array<{ label: string; tier: number }> = [];
  for (const rule of TITLE_RULES) {
    if (have.has(rule.id)) continue;
    if (!rule.test(state)) continue;
    have.add(rule.id);
    gained.push({ label: resolveLabel(rule, state.character), tier: rule.tier });
  }
  if (gained.length) state.character.flags.titles = [...have].join(',');
  const lines: string[] = [];
  for (const g of gained) {
    if (announce) pushMoment(state, { kind: 'title', label: g.label, tier: g.tier });
    lines.push(`江湖上開始有人稱你「${g.label}」。`);
    lines.push(...applyAchievementRankBonus(state, g.tier * 30));
    lines.push(...gainJianghuPrestige(state, g.tier * 12));
  }
  return lines;
}

/** 已取得的稱號，依稀有度排列。 */
export function allTitles(state: LifeGameState): EarnedTitle[] {
  return earnedTitles(state.character, state.character.flags.online_rank_one_verified === true);
}

export function topTitles(state: LifeGameState, count = TITLE_SLOT_LIMIT): string[] {
  return equippedTitles(state).slice(0, count).map(title => title.label);
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

/** 首個裝備嘅稱號（放全名右邊用）；未有任何稱號時回傳 null */
export function topTitle(state: LifeGameState): { label: string; tier: number } | null {
  const top = equippedTitles(state)[0];
  return top ? { label: top.label, tier: top.tier } : null;
}

/** 裝備中的稱號戰鬥加成總和 */
export function titleBonusTotals(state: LifeGameState, count = TITLE_SLOT_LIMIT): Required<TitleBonus> {
  const top = equippedTitles(state).slice(0, count);
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
