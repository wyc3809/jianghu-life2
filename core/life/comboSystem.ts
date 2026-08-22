/**
 * 連招套路系統：招式組合觸發特殊效果。
 * Pattern 可用招式分類（category）或架勢（stance）匹配最近幾招。
 */
import type { CombatMoveDef } from '@data/skills/catalog';
import { combatMoveRole } from '@data/skills/catalog';
import { resolveMoveStance } from './moveStance';

export type ComboMatchType = 'exact' | 'category' | 'stance';

export interface ComboEffect {
  /** 傷害倍率加成（在原有倍率上疊乘） */
  damageMult?: number;
  /** 額外暴擊機率（命中後觸發，額外乘一段傷害） */
  critChance?: number;
  /** 額外回復自身氣血 */
  healSelf?: number;
  /** 額外回復自身內力 */
  qiSelf?: number;
  /** 暈眩機率（疊加在招式本身之上） */
  stunChance?: number;
  /** 額外穿透（疊加在招式本身之上） */
  pierceBonus?: number;
  /** 附加流血（疊加在招式本身之上） */
  bleedDamage?: number;
  bleedTurns?: number;
  /** 無視閃避 */
  ignoreEvasion?: boolean;
  /** 本回合起為自身增加少量反震（借力打力） */
  reflectBonus?: number;
}

export interface ComboPattern {
  id: string;
  name: string;
  description: string;
  /** 匹配方式 */
  matchType: ComboMatchType;
  /** 序列長度 2–3 */
  pattern: string[];
  effect: ComboEffect;
  /** 戰報台詞 */
  announce: string;
}

/** 招式分類對應（用於 category match） */
export function moveCategory(move: CombatMoveDef): string {
  const role = combatMoveRole(move);
  if (role === '普') return 'strike';
  if (role === '守' || role === '蓄') return 'defense';
  if (role === '遁') return 'escape';
  if (role === '巧') return 'tech';
  if (role === '控') return 'control';
  if (role === '破') return 'break';
  if (role === '連') return 'combo';
  if (role === '耗') return 'drain';
  if (role === '殺') return 'lethal';
  return 'strike';
}

/** 預設套路庫 */
export const COMBO_PATTERNS: ComboPattern[] = [
  {
    id: 'lianhuan_kuaida',
    name: '連環快打',
    description: '拳掌連環，第三擊必中要害',
    matchType: 'category',
    pattern: ['strike', 'strike', 'strike'],
    effect: { damageMult: 1.6, critChance: 1.0, ignoreEvasion: true },
    announce: '你拳掌交錯，連環快打——第三擊直取要害！',
  },
  {
    id: 'jianqi_zongheng',
    name: '劍氣縱橫',
    description: '劍招間以內力催發，劍氣貫穿敵防',
    matchType: 'stance',
    pattern: ['shi', 'xu', 'shi'],
    effect: { damageMult: 1.4, pierceBonus: 0.5 },
    announce: '你劍走偏鋒，內力催發——劍氣縱橫，貫穿敵防！',
  },
  {
    id: 'yi_man_da_kuai',
    name: '以慢打快',
    description: '以守為攻，反彈敵勁',
    matchType: 'category',
    pattern: ['defense', 'strike'],
    effect: { damageMult: 1.2, reflectBonus: 0.08 },
    announce: '你以慢打快，借力打力——敵勁反噬其身！',
  },
  {
    id: 'tiyun_zong_tuxi',
    name: '梯雲縱突襲',
    description: '輕功繞後，突襲必中',
    matchType: 'stance',
    pattern: ['xu', 'shi'],
    effect: { damageMult: 1.5, ignoreEvasion: true, critChance: 0.5 },
    announce: '你足尖輕點，梯雲縱起——自死角突襲而來！',
  },
  {
    id: 'baoyu_lihua',
    name: '暴雨梨花',
    description: '暗器三連，封穴定身',
    matchType: 'category',
    pattern: ['tech', 'tech', 'tech'],
    effect: { damageMult: 1.3, stunChance: 1.0 },
    announce: '你袖中銀芒連閃——暴雨梨花，敵人穴道被封！',
  },
  {
    id: 'gangrou_bingji',
    name: '剛柔並濟',
    description: '剛猛與陰柔交替，破綻難尋',
    matchType: 'stance',
    pattern: ['shi', 'xu'],
    effect: { damageMult: 1.35, pierceBonus: 0.3, healSelf: 8 },
    announce: '你剛柔並濟，陰陽互換——敵人防不勝防！',
  },
  {
    id: 'huifeng_fuliu',
    name: '回風拂柳',
    description: '連擊後順勢回氣',
    matchType: 'category',
    pattern: ['combo', 'defense'],
    effect: { damageMult: 1.25, qiSelf: 15, healSelf: 10 },
    announce: '你招式連綿如回風拂柳——傷敵之餘，內息自生！',
  },
  {
    id: 'dugu_jiushi',
    name: '獨孤九式',
    description: '無招勝有招，破盡天下招式',
    matchType: 'category',
    pattern: ['break', 'lethal'],
    effect: { damageMult: 2.0, pierceBonus: 0.8, ignoreEvasion: true },
    announce: '你劍意通明，獨孤九式——破盡天下招式！',
  },
];

/** 檢查連招：傳入最近招式歷史（由舊到新），返回觸發的套路 */
export function checkCombo(
  history: CombatMoveDef[],
  patterns: ComboPattern[] = COMBO_PATTERNS,
): { pattern: ComboPattern; matchedMoves: CombatMoveDef[] } | null {
  if (history.length < 2) return null;
  for (const pattern of patterns) {
    const len = pattern.pattern.length;
    if (history.length < len) continue;
    const recent = history.slice(-len);
    let match = true;
    for (let i = 0; i < len; i++) {
      const expected = pattern.pattern[i]!;
      const move = recent[i]!;
      if (pattern.matchType === 'exact') {
        if (move.id !== expected) {
          match = false;
          break;
        }
      } else if (pattern.matchType === 'category') {
        if (moveCategory(move) !== expected) {
          match = false;
          break;
        }
      } else if (pattern.matchType === 'stance') {
        if (resolveMoveStance(move) !== expected) {
          match = false;
          break;
        }
      }
    }
    if (match) return { pattern, matchedMoves: recent };
  }
  return null;
}

/** 連招歷史管理：新增一招，保持最多 maxLen 招 */
export function pushComboHistory(history: string[], moveId: string, maxLen = 3): string[] {
  const next = [...history, moveId];
  if (next.length > maxLen) next.shift();
  return next;
}
