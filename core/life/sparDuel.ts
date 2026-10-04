import type { LifeGameState } from '@interfaces/lifeEngine';
import { gearTotals, sumGearCombatBonuses } from './equipment';
import { getSkillDef } from '@data/skills/catalog';

/**
 * 演武台對打（純邏輯、唔碰模擬 RNG）：
 * 每關＝幾個小兵＋一個長血條首領；雙方輪流出手，主角有暴擊同吸血。
 * - 主角數值跟角色實力：武學、修為境界、氣血上限、兵器攻擊（越練越強，數字越跳越大）
 * - 演武血條同角色真氣血分開：打輸只係「演武敗退」退一關、回滿血再戰，唔會受傷
 * - 關卡越後敵人越強（每關 ×SPAR_STAGE_GROWTH），自然停喺「同自己實力相若」嗰關
 *
 * RNG 由呼叫方注入（engine 用自己嘅 mulberry32），唔推進 getRng()，免得改咗人生事件嘅隨機序列。
 */

export interface SparHeroStats {
  maxHp: number;
  atk: number;
  /** 0..1 */
  critRate: number;
  critMul: number;
  /** 每擊吸血比例（傷害 ×）；冇吸血武學／裝備就係 0 */
  lifesteal: number;
  /** 過關回血比例（maxHp ×）；冇回血武學就係 0 */
  clearHeal: number;
  /** 減傷比例 0..0.6 */
  guard: number;
}

/** 修為境界每升一境，演武數值 ×1.32（對應 15 境曲線，頂境約 ×48） */
export const SPAR_TIER_SCALE = 1.32;
export const SPAR_STAGE_GROWTH = 1.16;
export const SPAR_BOSS_HP_MUL = 7;
export const SPAR_BOSS_ATK_MUL = 2.2;
/** 有回血武學先有：過關回血比例 */
export const SPAR_STAGE_CLEAR_HEAL = 0.35;

/** 戰力頁用：每項數值由邊度嚟（未乘境界倍率嘅分項＋倍率） */
export interface SparHeroBreakdown {
  stats: SparHeroStats;
  tier: number;
  /** 境界倍率 */
  scale: number;
  hp: { fromHealth: number; fromMartial: number };
  atk: { base: number; fromMartial: number; fromWeapon: number };
  crit: { base: number; fromDanShi: number; fromWuXing: number; cap: number };
  lifesteal: { fromSkills: number; fromGear: number; cap: number; skillNames: string[] };
  /** 回血武學（有先會過關回血） */
  heal: { skillNames: string[]; onClear: number };
  guard: { fromArmor: number; cap: number };
  /** 武學（含裝備武學加成） */
  martial: number;
  gearAttack: number;
  gearDefense: number;
}

const CRIT_BASE = 0.1;
const CRIT_CAP = 0.45;
const LIFESTEAL_CAP = 0.25;
const GUARD_CAP = 0.6;

export function sparHeroBreakdown(state: LifeGameState): SparHeroBreakdown {
  const c = state.character;
  const gear = gearTotals(c);
  const tier = Math.max(0, Math.floor(c.cultivation?.tier ?? 0));
  const scale = SPAR_TIER_SCALE ** tier;
  const martial = Math.max(0, c.martial + gear.martialBonus);
  const hp = { fromHealth: c.maxHealth * 12, fromMartial: martial * 25 };
  const atk = { base: 24, fromMartial: martial * 1.6, fromWeapon: gear.attack * 3 };
  const crit = {
    base: CRIT_BASE,
    fromDanShi: (c.attributes.danShi ?? 0) * 0.003,
    fromWuXing: (c.attributes.wuXing ?? 0) * 0.001,
    cap: CRIT_CAP,
  };
  // 無回血技唔會自動回血：吸血只計已學武學招式＋裝備詞條；過關回血要有回血招式
  const stealSkills: string[] = [];
  const healSkills: string[] = [];
  let fromSkills = 0;
  for (const id of c.skills) {
    const mv = getSkillDef(id)?.move;
    if (!mv) continue;
    if ((mv.lifesteal ?? 0) > 0) {
      fromSkills += mv.lifesteal!;
      stealSkills.push(mv.name);
    }
    if ((mv.healSelf ?? 0) > 0) healSkills.push(mv.name);
  }
  const lifesteal = {
    fromSkills,
    fromGear: sumGearCombatBonuses(c).lifesteal,
    cap: LIFESTEAL_CAP,
    skillNames: stealSkills,
  };
  const heal = { skillNames: healSkills, onClear: healSkills.length ? SPAR_STAGE_CLEAR_HEAL : 0 };
  const guard = { fromArmor: gear.defense * 0.012, cap: GUARD_CAP };
  const stats: SparHeroStats = {
    maxHp: Math.round((hp.fromHealth + hp.fromMartial) * scale),
    atk: Math.round((atk.base + atk.fromMartial + atk.fromWeapon) * scale),
    critRate: Math.min(CRIT_CAP, crit.base + crit.fromDanShi + crit.fromWuXing),
    critMul: 1.85,
    lifesteal: Math.min(LIFESTEAL_CAP, lifesteal.fromSkills + lifesteal.fromGear),
    clearHeal: heal.onClear,
    guard: Math.min(GUARD_CAP, guard.fromArmor),
  };
  return { stats, tier, scale, hp, atk, crit, lifesteal, heal, guard, martial, gearAttack: gear.attack, gearDefense: gear.defense };
}

export function sparHeroStats(state: LifeGameState): SparHeroStats {
  return sparHeroBreakdown(state).stats;
}

export interface SparFoe {
  name: string;
  boss: boolean;
  maxHp: number;
  atk: number;
  /** 剪影款式：對應 src/spar/rig.ts ENEMY_POOL 嘅索引 */
  look: number;
}

/**
 * 剪影款式索引（同 ENEMY_POOL 次序一致）：
 * 0 墨影、1 黑衣刀客、2 女刺客、3 胖頭陀、4 鐵面影魁、5 雙鉤客、6 赤髮
 */
export const SPAR_LOOK = { shadow: 0, daoke: 1, nvcike: 2, toutuo: 3, tiemian: 4, gouke: 5, chifa: 6 } as const;

export interface SparTheme {
  /** 主題名（HUD 顯示） */
  name: string;
  /** 小兵按次序輪住出：[款式, 名] */
  minions: ReadonlyArray<readonly [number, string]>;
  boss: readonly [number, string];
}

/**
 * 演武場景：每 SPAR_SCENE_SPAN 關換一個場景（千燈鎮 → 山道 → 竹林 → 雨夜客棧 → 山門 → 夜山，之後循環、敵人更強）。
 * 一個場景一個敵人主題：同主題小兵按固定次序出，首領固定——出場有規律，唔再亂抽。
 * bg 對應 src/spar/rig.ts 嘅 SPAR_BACKGROUNDS key。
 */
export interface SparScene {
  /** 場景 key（＝背景 key） */
  bg: string;
  /** 地名（換場題字、HUD） */
  place: string;
  theme: SparTheme;
}

export const SPAR_SCENES: readonly SparScene[] = [
  {
    bg: 'town',
    place: '千燈鎮',
    theme: {
      name: '市井潑皮',
      minions: [
        [SPAR_LOOK.daoke, '市井潑皮'],
        [SPAR_LOOK.gouke, '收數打手'],
      ],
      boss: [SPAR_LOOK.toutuo, '鎮上惡霸'],
    },
  },
  {
    bg: 'road',
    place: '山道',
    theme: {
      name: '山道劫匪',
      minions: [
        [SPAR_LOOK.daoke, '攔路刀匪'],
        [SPAR_LOOK.gouke, '雙鉤山賊'],
      ],
      boss: [SPAR_LOOK.chifa, '赤髮寨主'],
    },
  },
  {
    bg: 'bamboo',
    place: '竹林',
    theme: {
      name: '影門殺陣',
      minions: [
        [SPAR_LOOK.shadow, '影門殺手'],
        [SPAR_LOOK.nvcike, '影門女刺'],
      ],
      boss: [SPAR_LOOK.tiemian, '影門門主'],
    },
  },
  {
    bg: 'inn',
    place: '雨夜客棧',
    theme: {
      name: '夜行刺客',
      minions: [
        [SPAR_LOOK.nvcike, '夜行女刺'],
        [SPAR_LOOK.shadow, '影衛'],
      ],
      boss: [SPAR_LOOK.tiemian, '鐵面影魁'],
    },
  },
  {
    bg: 'gate',
    place: '山門',
    theme: {
      name: '邪寺頭陀',
      minions: [
        [SPAR_LOOK.toutuo, '護寺頭陀'],
        [SPAR_LOOK.shadow, '黑衣僧兵'],
      ],
      boss: [SPAR_LOOK.toutuo, '鬼面頭陀'],
    },
  },
  {
    bg: 'nightpeak',
    place: '夜山',
    theme: {
      name: '黑風寨',
      minions: [
        [SPAR_LOOK.daoke, '黑風刀手'],
        [SPAR_LOOK.toutuo, '黑風力士'],
        [SPAR_LOOK.gouke, '黑風鉤客'],
      ],
      boss: [SPAR_LOOK.chifa, '黑風寨主'],
    },
  },
];

/** 每個場景（主題）連續幾多關 */
export const SPAR_SCENE_SPAN = 10;

export function sparSceneFor(stage: number): SparScene {
  const s = Math.max(1, Math.floor(stage));
  return SPAR_SCENES[Math.floor((s - 1) / SPAR_SCENE_SPAN) % SPAR_SCENES.length]!;
}

export function sparThemeFor(stage: number): SparTheme {
  return sparSceneFor(stage).theme;
}

export function sparMinionCount(stage: number): number {
  return Math.min(6, 3 + Math.floor((Math.max(1, stage) - 1) / 5));
}

/** 第 stage 關嘅敵人隊列（最後一個係首領）；數值 deterministic */
export function sparStageFoes(stage: number): SparFoe[] {
  const s = Math.max(1, Math.floor(stage));
  const g = SPAR_STAGE_GROWTH ** (s - 1);
  const minionHp = Math.round(140 * g);
  const minionAtk = Math.round(16 * g);
  const theme = sparThemeFor(s);
  const foes: SparFoe[] = [];
  const n = sparMinionCount(s);
  for (let i = 0; i < n; i++) {
    const [look, name] = theme.minions[i % theme.minions.length]!;
    foes.push({ name, boss: false, maxHp: minionHp, atk: minionAtk, look });
  }
  const [bossLook, bossName] = theme.boss;
  foes.push({
    name: bossName,
    boss: true,
    maxHp: Math.round(minionHp * SPAR_BOSS_HP_MUL),
    atk: Math.round(minionAtk * SPAR_BOSS_ATK_MUL),
    look: bossLook,
  });
  return foes;
}

export interface SparHeroHit {
  dmg: number;
  crit: boolean;
  heal: number;
  killed: boolean;
  /** 打低嘅係首領（＝過關） */
  bossKilled: boolean;
}

export interface SparFoeHit {
  dmg: number;
  heroDown: boolean;
}

export interface SparDuelSnapshot {
  stage: number;
  /** 本關主題名 */
  theme: string;
  /** 本關場景（背景 key＋地名） */
  sceneBg: string;
  place: string;
  heroHp: number;
  heroMaxHp: number;
  foe: SparFoe | null;
  foeHp: number;
  /** 首領之前仲剩幾多個小兵（唔計當前） */
  minionsLeft: number;
}

export type SparRand = () => number;

/** 一場演武嘅狀態機；engine 每次劍鋒到肉叫 heroStrike()、敵人出手叫 foeStrike() */
export class SparDuel {
  stage: number;
  hero: SparHeroStats;
  heroHp: number;
  private queue: SparFoe[];
  private idx = 0;
  foeHp: number;

  constructor(hero: SparHeroStats, stage = 1, private rand: SparRand = Math.random) {
    this.hero = hero;
    this.stage = Math.max(1, Math.floor(stage));
    this.heroHp = hero.maxHp;
    this.queue = sparStageFoes(this.stage);
    this.foeHp = this.queue[0]!.maxHp;
  }

  get foe(): SparFoe | null {
    return this.queue[this.idx] ?? null;
  }

  /** 角色實力變咗（升境、換兵器）：按比例保留現有血量 */
  setHero(hero: SparHeroStats) {
    const ratio = this.hero.maxHp > 0 ? this.heroHp / this.hero.maxHp : 1;
    this.hero = hero;
    this.heroHp = Math.max(1, Math.round(hero.maxHp * ratio));
  }

  snapshot(): SparDuelSnapshot {
    const foe = this.foe;
    const bossIdx = this.queue.length - 1;
    return {
      stage: this.stage,
      theme: sparThemeFor(this.stage).name,
      sceneBg: sparSceneFor(this.stage).bg,
      place: sparSceneFor(this.stage).place,
      heroHp: this.heroHp,
      heroMaxHp: this.hero.maxHp,
      foe,
      foeHp: this.foeHp,
      minionsLeft: Math.max(0, bossIdx - this.idx - (foe && !foe.boss ? 1 : 0)),
    };
  }

  /** 主角一擊：±10% 浮動、暴擊、吸血 */
  heroStrike(): SparHeroHit {
    const foe = this.foe;
    if (!foe || this.foeHp <= 0) return { dmg: 0, crit: false, heal: 0, killed: false, bossKilled: false };
    const crit = this.rand() < this.hero.critRate;
    const spread = 0.9 + this.rand() * 0.2;
    const dmg = Math.max(1, Math.round(this.hero.atk * spread * (crit ? this.hero.critMul : 1)));
    this.foeHp = Math.max(0, this.foeHp - dmg);
    const room = this.hero.maxHp - this.heroHp;
    const heal = Math.min(room, Math.round(dmg * this.hero.lifesteal));
    this.heroHp += heal;
    const killed = this.foeHp <= 0;
    return { dmg, crit, heal, killed, bossKilled: killed && foe.boss };
  }

  /** 敵人一擊：主角減傷後扣血 */
  foeStrike(): SparFoeHit {
    const foe = this.foe;
    if (!foe || this.foeHp <= 0 || this.heroHp <= 0) return { dmg: 0, heroDown: false };
    const spread = 0.85 + this.rand() * 0.3;
    const dmg = Math.max(1, Math.round(foe.atk * spread * (1 - this.hero.guard)));
    this.heroHp = Math.max(0, this.heroHp - dmg);
    return { dmg, heroDown: this.heroHp <= 0 };
  }

  /** 當前敵人倒下後：換下一個；首領倒下就入下一關（回少少血） */
  advance(): { stageCleared: boolean } {
    if (this.foeHp > 0) return { stageCleared: false };
    const wasBoss = this.foe?.boss ?? false;
    if (wasBoss) {
      this.stage += 1;
      this.queue = sparStageFoes(this.stage);
      this.idx = 0;
      this.heroHp = Math.min(this.hero.maxHp, this.heroHp + Math.round(this.hero.maxHp * this.hero.clearHeal));
    } else {
      this.idx += 1;
    }
    this.foeHp = this.foe?.maxHp ?? 0;
    return { stageCleared: wasBoss };
  }

  /** 演武敗退：退一關（關數高就退多啲，約一成；最低第 1 關），回滿血 */
  retreat() {
    this.stage = Math.max(1, this.stage - Math.max(1, Math.floor(this.stage / 10)));
    this.queue = sparStageFoes(this.stage);
    this.idx = 0;
    this.foeHp = this.queue[0]!.maxHp;
    this.heroHp = this.hero.maxHp;
  }
}

/** 過關獎勵（首領倒下）：銀兩＋修為，隨關數緩升 */
export function sparStageReward(stage: number): { silver: number; xp: number } {
  const s = Math.max(1, Math.floor(stage));
  return { silver: 2 + Math.floor(s / 3), xp: 10 + s * 4 };
}

/** 存檔用：演武台去到第幾關 */
export function sparSavedStage(state: LifeGameState): number {
  const v = Number(state.character.flags.spar_stage ?? 1);
  return Number.isFinite(v) && v >= 1 ? Math.floor(v) : 1;
}

/**
 * 演武數字簡寫：過千用 k、過百萬用 m（例：950、1.2k、12.4k、123k、1.5m）。
 * 血條同彈出傷害數字共用，避免長數字遮住畫面。
 */
export function formatSparNumber(n: number): string {
  const v = Math.max(0, Math.round(n));
  const short = (x: number, unit: string) => {
    const d = x < 10 ? 1 : 0;
    return `${x.toFixed(d).replace(/\.0$/, '')}${unit}`;
  };
  if (v >= 1e9) return short(v / 1e9, 'b');
  if (v >= 1e6) return short(v / 1e6, 'm');
  if (v >= 1e3) return short(v / 1e3, 'k');
  return String(v);
}
