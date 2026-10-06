/**
 * 遊戲狀態 → 高光時刻設定（純展示映射，唔改遊戲狀態）。
 * 寶箱＝新裝備（品階＝裝備稀有度）；令牌＝學武學／升階；丹爐＝境界突破成功。
 */
import type { LifeGameState, LifeMoment } from '@interfaces/lifeEngine';
import type { BreakthroughResult } from '@core/life/cultivation';
import { getGearDef, rarityLabel, type GearDef, type GearRarity } from '@data/equipment/catalog';
import { jianghuPrestige } from '@core/life/jianghuPrestige';
import { MARTIAL_RANKS } from '@core/life/martialRanks';
import type { CardPattern, Grade, HighlightConfig, IconKind, RewardStat } from './types';
import { clampGrade } from './grades';

const RARITY_GRADE: Record<GearRarity, Grade> = { common: 0, fine: 1, rare: 2, epic: 3, mythic: 4, divine: 5 };

/** 武學：學新＝1；升到 1／2／3 階＝2／3／5（神乎其技＝最高品階舞台） */
const RANK_GRADE: readonly Grade[] = [1, 2, 3, 5];

/** 境界 level → 品階 */
/** 修為 15 境 → 高光品階 */
const TIER_GRADE: readonly Grade[] = [0, 0, 1, 1, 1, 2, 2, 3, 3, 3, 4, 4, 5, 5, 5];

function balances(state: LifeGameState, prestigeBefore?: number) {
  return {
    coin: { label: '銀兩', value: state.character.money },
    gem: { label: '威望', value: prestigeBefore ?? jianghuPrestige(state) },
  };
}

function gearIcon(def: GearDef): IconKind {
  if (def.slot === 'armor') return 'armor';
  if (def.slot === 'accessory') return 'accessory';
  return def.weaponKind ?? 'sword';
}

function gearPattern(def: GearDef): CardPattern {
  return def.slot === 'weapon' ? 'blade' : def.slot === 'armor' ? 'guard' : 'charm';
}

function gearStats(def: GearDef, equipped: GearDef | undefined): RewardStat[] {
  const rows: [string, keyof GearDef][] = [
    ['攻擊', 'attack'],
    ['防禦', 'defense'],
    ['氣血上限', 'maxHpBonus'],
    ['內力上限', 'maxQiBonus'],
    ['武學', 'martialBonus'],
  ];
  return rows
    .filter(([, k]) => typeof def[k] === 'number' && (def[k] as number) !== 0)
    .map(([label, k]) => ({ label, from: (equipped?.[k] as number | undefined) ?? 0, to: def[k] as number }))
    .slice(0, 3);
}

function lootConfig(state: LifeGameState, gearId: string): HighlightConfig | null {
  const def = getGearDef(gearId);
  if (!def) return null;
  const equippedId = state.character.equipment?.[def.slot];
  const equipped = equippedId && equippedId !== gearId ? getGearDef(equippedId) : undefined;
  const g = RARITY_GRADE[def.rarity];
  return {
    subject: 'chest',
    targetGrade: g,
    revealTitle: g >= 4 ? '神兵出世' : g >= 2 ? '寶物入手' : '得到裝備',
    seal: '裝',
    revealSub: `${def.name} · ${rarityLabel[def.rarity]}`,
    balances: balances(state),
    rewards: [
      {
        id: def.id,
        icon: gearIcon(def),
        pattern: gearPattern(def),
        name: def.name,
        grade: g,
        isNew: g >= 2,
        blurb: def.special ? `${def.special.name}：${def.special.description}` : def.description,
        stats: gearStats(def, equipped),
      },
    ],
  };
}

function tokenConfig(state: LifeGameState, m: Extract<LifeMoment, { kind: 'learn' | 'rank' }>): HighlightConfig {
  const rank = m.kind === 'rank' ? m.rank : 0;
  const g = RANK_GRADE[Math.max(0, Math.min(3, rank))]!;
  const learned = state.character.skills.length;
  return {
    subject: 'token',
    targetGrade: g,
    revealTitle: m.kind === 'learn' ? '武學入懷' : rank >= 3 ? '神乎其技' : '武學精進',
    seal: m.kind === 'learn' ? '武' : '煉',
    revealSub: m.kind === 'learn' ? `${m.name} · 秘笈到手` : `${m.name} · ${m.rankName}`,
    balances: balances(state),
    rewards: [
      {
        id: `art-${m.name}`,
        icon: 'scroll',
        pattern: 'art',
        name: m.name,
        grade: g,
        isNew: m.kind === 'learn',
        blurb:
          m.kind === 'learn'
            ? '秘笈到手，招式初成。'
            : `由「${MARTIAL_RANKS[rank - 1] ?? MARTIAL_RANKS[0]}」進至「${m.rankName}」。`,
        stats:
          m.kind === 'learn'
            ? [{ label: '已習武學', from: Math.max(0, learned - 1), to: learned }]
            : [{ label: '武學階位', from: rank, to: rank + 1 }],
      },
    ],
  };
}

export function momentHighlight(state: LifeGameState, m: LifeMoment): HighlightConfig | null {
  if (m.kind === 'loot') return lootConfig(state, m.gearId);
  if (m.kind === 'learn' || m.kind === 'rank') return tokenConfig(state, m);
  return null;
}

/** 突破成功 → 丹爐；失敗照用水墨彈窗 */
export function breakthroughHighlight(state: LifeGameState, r: BreakthroughResult): HighlightConfig | null {
  if (!r.success || !r.newTierName) return null;
  const c = state.character;
  const g = clampGrade(TIER_GRADE[r.newTierLevel ?? 1] ?? 1);
  const prestigeNow = jianghuPrestige(state);
  const prestige = Math.min(r.prestigeGain ?? 0, prestigeNow);
  const stats: RewardStat[] = [];
  if (r.hpGain) stats.push({ label: '氣血上限', from: c.maxHealth - r.hpGain, to: c.maxHealth });
  if (r.qiGain) stats.push({ label: '內力上限', from: c.maxQi - r.qiGain, to: c.maxQi });
  if (r.martialGain) stats.push({ label: '武學', from: c.martial - r.martialGain, to: c.martial });
  return {
    subject: 'cauldron',
    targetGrade: g,
    revealTitle: '境界突破',
    seal: '破',
    revealSub: `${r.oldTierName} → ${r.newTierName}`,
    balances: balances(state, prestigeNow - prestige),
    rewards: [
      {
        id: 'tier',
        icon: 'pill',
        pattern: 'elixir',
        name: r.newTierName,
        grade: g,
        isNew: true,
        blurb: '打通任督二脈，真氣運行更上層樓。',
        stats,
      },
      ...(prestige
        ? [
            {
              id: 'prestige',
              icon: 'gem' as const,
              pattern: 'charm' as const,
              name: '威望',
              grade: 2 as Grade,
              amount: prestige,
              flyTo: 'gem' as const,
              blurb: '江湖上傳開你突破嘅消息。',
              stats: [{ label: '威望', from: prestigeNow - prestige, to: prestigeNow }],
            },
          ]
        : []),
    ],
  };
}

/**
 * 秘笈閣抽卡 → 同「每月學武學」一樣嘅武學令演出（玩家要求兩者畫面一致）。
 * 品階：心願＝5、珍本奇功＝4、新武學＝2、重複＝1。
 */
export function gachaHighlight(
  results: { id: string; isNew: boolean; isWish: boolean; isPremium: boolean }[],
  names: (id: string) => string,
  blurbOf: (id: string) => string | undefined,
  jade: { free: number; paidTest: number },
): HighlightConfig | null {
  if (!results.length) return null;
  const gradeOf = (r: (typeof results)[number]): Grade =>
    r.isWish ? 5 : r.isPremium ? 4 : r.isNew ? 2 : 1;
  const top = results.reduce<Grade>((g, r) => (gradeOf(r) > g ? gradeOf(r) : g), 0 as Grade);
  const wish = results.find((r) => r.isWish);
  const premium = results.find((r) => r.isPremium);
  const fresh = results.filter((r) => r.isNew).length;
  return {
    subject: 'token',
    targetGrade: clampGrade(top),
    revealTitle: wish ? '心願得償' : premium ? '珍本現世' : fresh ? '秘笈入藏' : '書頁盈篋',
    seal: '武',
    revealSub: wish
      ? `${names(wish.id)} · 心願秘笈到手`
      : `${results.length} 本秘笈 · 新得 ${fresh} 本`,
    balances: { coin: { label: '免費玉石', value: jade.free }, gem: { label: '付費玉石', value: jade.paidTest } },
    rewards: results.map((r, i) => ({
      id: `gacha-${r.id}-${i}`,
      icon: 'scroll' as const,
      pattern: 'art' as const,
      name: names(r.id),
      grade: gradeOf(r),
      isNew: r.isNew,
      blurb: `${r.isWish ? '【心願】' : ''}${r.isPremium ? '【珍本奇功】' : ''}${blurbOf(r.id) ?? ''}${r.isNew ? '' : '（重複本：可升階或轉書頁）'}`,
    })),
  };
}
