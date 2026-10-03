import type { LifeGameState } from '@interfaces/lifeEngine';
import { gearTotals } from './equipment';

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
  /** 每擊吸血比例（傷害 ×） */
  lifesteal: number;
  /** 減傷比例 0..0.6 */
  guard: number;
}

/** 修為境界每升一境，演武數值 ×1.32（對應 15 境曲線，頂境約 ×48） */
export const SPAR_TIER_SCALE = 1.32;
export const SPAR_STAGE_GROWTH = 1.16;
export const SPAR_BOSS_HP_MUL = 7;
export const SPAR_BOSS_ATK_MUL = 2.2;
/** 過關回血比例 */
export const SPAR_STAGE_CLEAR_HEAL = 0.35;

export function sparHeroStats(state: LifeGameState): SparHeroStats {
  const c = state.character;
  const gear = gearTotals(c);
  const tier = Math.max(0, Math.floor(c.cultivation?.tier ?? 0));
  const scale = SPAR_TIER_SCALE ** tier;
  const martial = Math.max(0, c.martial + gear.martialBonus);
  const maxHp = Math.round((c.maxHealth * 12 + martial * 25) * scale);
  const atk = Math.round((24 + martial * 1.6 + gear.attack * 3) * scale);
  const critRate = Math.min(0.45, 0.1 + (c.attributes.danShi ?? 0) * 0.003 + (c.attributes.wuXing ?? 0) * 0.001);
  const lifesteal = Math.min(0.25, 0.06 + tier * 0.008);
  const guard = Math.min(0.6, gear.defense * 0.012);
  return { maxHp, atk, critRate, critMul: 1.85, lifesteal, guard };
}

export interface SparFoe {
  name: string;
  boss: boolean;
  maxHp: number;
  atk: number;
}

const MINION_NAMES = ['黑衣刀客', '蒙面刺客', '頭陀', '雙鉤客', '山賊', '黑風盜'];
const BOSS_NAMES = ['鐵面影魁', '赤髮狂刀', '血手判官', '黑風寨主', '無影劍', '斷腸客', '鬼面頭陀'];

export function sparMinionCount(stage: number): number {
  return Math.min(6, 3 + Math.floor((Math.max(1, stage) - 1) / 5));
}

/** 第 stage 關嘅敵人隊列（最後一個係首領）；數值 deterministic */
export function sparStageFoes(stage: number): SparFoe[] {
  const s = Math.max(1, Math.floor(stage));
  const g = SPAR_STAGE_GROWTH ** (s - 1);
  const minionHp = Math.round(140 * g);
  const minionAtk = Math.round(16 * g);
  const foes: SparFoe[] = [];
  const n = sparMinionCount(s);
  for (let i = 0; i < n; i++) {
    foes.push({ name: MINION_NAMES[(s + i) % MINION_NAMES.length]!, boss: false, maxHp: minionHp, atk: minionAtk });
  }
  foes.push({
    name: BOSS_NAMES[(s - 1) % BOSS_NAMES.length]!,
    boss: true,
    maxHp: Math.round(minionHp * SPAR_BOSS_HP_MUL),
    atk: Math.round(minionAtk * SPAR_BOSS_ATK_MUL),
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
      this.heroHp = Math.min(this.hero.maxHp, this.heroHp + Math.round(this.hero.maxHp * SPAR_STAGE_CLEAR_HEAL));
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
