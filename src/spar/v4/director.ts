/**
 * 演武台 v4 導演（純邏輯，唔掂 DOM／canvas，可單元測試）。
 *
 * 一個小兵（約 2.5 秒）：
 *   next 0.4（敵人墨暈化出）→ walk 1.0（主角行路，世界捲動令敵人埋身）→ windup 0.3 → strike 0.2（命中）
 *   → recover 0.6（敵人潰散）→ next …
 * 每 SPAR_BOSS.every 個小兵出一個頭目：strike（第 1 擊）→ combo（第 2 擊）→ ultimate 大招（第 3 擊，潰散）。
 * 撳敵人（walk／next 期間）：dash 衝前即出手（跳過 windup）。
 *
 * 距離單位係「設計單位」（主角高 300）；舞台由 setViewport 話畀導演知闊幾多設計單位。
 */
import {
  ENEMY_CLIPS,
  HERO_CLIPS,
  clipDuration,
  hitsCrossed,
  type EnemyClipId,
  type HeroClipId,
} from '@data/spar/clips';
import { SPAR_BOSS, SPAR_LAYOUT, SPAR_TIMING } from '@data/spar/tuning';

export type SparPhase = 'next' | 'walk' | 'dash' | 'windup' | 'strike' | 'combo' | 'ultimate' | 'recover';

export interface SparEnemyState {
  boss: boolean;
  clip: EnemyClipId;
  t: number;
  /** 腳底 x（設計單位，由舞台左邊計） */
  x: number;
  /** 受擊退後（設計單位，會慢慢收返） */
  knock: number;
  hitsLeft: number;
}

export interface SparHitInfo {
  boss: boolean;
  /** 呢一擊係咪打死 */
  final: boolean;
  /** 第幾擊（1 起） */
  hitNo: number;
  /** 出手嘅動作（決定刀光款式） */
  clip: HeroClipId;
  /** 敵人腳底 x（設計單位） */
  enemyX: number;
}

export interface SparDirectorOptions {
  onHit?: (hit: SparHitInfo) => void;
  /** 出手（揮擊開始）：刀光、破空聲 */
  onSwing?: (clip: HeroClipId) => void;
  /** 新敵人出場 */
  onSpawn?: (enemy: SparEnemyState) => void;
}

/** 主角狀態旗（跟遊戲狀態）：跛腳行路、掩手待機 */
export interface SparHeroFlags {
  limp: boolean;
  armHurt: boolean;
  /** 射程（設計單位） */
  reach: number;
}

export class SparDirector {
  phase: SparPhase = 'next';
  phaseT = 0;
  heroClip: HeroClipId = 'idle';
  heroT = 0;
  enemy: SparEnemyState | null = null;
  /** 世界累計捲動（設計單位；背景視差用） */
  scroll = 0;
  /** 上次頭目之後打咗幾多個小兵 */
  kills = 0;
  flags: SparHeroFlags = { limp: false, armHurt: false, reach: 170 };
  private width = 900;
  private from = 0;
  private opts: SparDirectorOptions;

  constructor(opts: SparDirectorOptions = {}) {
    this.opts = opts;
    this.go('next');
  }

  /** 更新主角狀態旗（跛腳、掩手、射程）；下一段動作開始生效 */
  setFlags(f: SparHeroFlags) {
    this.flags = f;
  }

  /** 舞台闊度（設計單位） */
  setViewport(widthDesign: number) {
    this.width = Math.max(300, widthDesign);
    if (this.enemy && this.phase === 'next') this.enemy.x = this.startX();
  }

  heroX(): number {
    return this.width * SPAR_LAYOUT.heroX;
  }

  private startX(): number {
    return Math.max(this.width * SPAR_LAYOUT.enemyStartX, this.heroX() + this.flags.reach + 60);
  }

  private meleeX(): number {
    return this.heroX() + this.flags.reach;
  }

  /** 示範頁：下一個敵人係頭目（如果而家未交手，即刻換） */
  forceBoss() {
    this.kills = SPAR_BOSS.every;
    if (this.phase === 'next' || this.phase === 'walk') {
      this.enemy = null;
      this.go('next');
    }
  }

  /** 撳敵人：未交手就衝前即出手；回傳有冇生效 */
  tapEnemy(): boolean {
    if (!this.enemy || this.enemy.hitsLeft <= 0) return false;
    if (this.phase !== 'walk' && this.phase !== 'next') return false;
    if (this.enemy.clip === 'enter') {
      this.enemy.clip = 'taunt';
      this.enemy.t = 0;
    }
    this.from = this.enemy.x;
    this.go('dash');
    return true;
  }

  private go(p: SparPhase) {
    this.phase = p;
    this.phaseT = 0;
    const idle: HeroClipId = this.flags.armHurt ? 'idle-hurt' : 'idle';
    const walk: HeroClipId = this.flags.limp ? 'walk-limp' : 'walk';
    const clip: Record<SparPhase, HeroClipId> = {
      next: idle,
      walk,
      dash: walk,
      windup: 'windup',
      strike: 'strike',
      combo: 'combo',
      ultimate: 'ultimate',
      recover: 'recover',
    };
    this.setHero(clip[p]);
    if (p === 'next' && !this.enemy) this.spawn();
    if (p === 'walk') this.from = this.enemy?.x ?? this.startX();
    if (p === 'strike' || p === 'combo' || p === 'ultimate') this.opts.onSwing?.(this.heroClip);
  }

  private setHero(c: HeroClipId) {
    if (this.heroClip !== c) this.heroT = 0;
    this.heroClip = c;
  }

  private spawn() {
    const boss = this.kills >= SPAR_BOSS.every;
    this.enemy = {
      boss,
      clip: 'enter',
      t: 0,
      x: this.startX(),
      knock: 0,
      hitsLeft: boss ? SPAR_BOSS.hits : 1,
    };
    this.opts.onSpawn?.(this.enemy);
  }

  private hit() {
    const e = this.enemy;
    if (!e || e.hitsLeft <= 0) return;
    e.hitsLeft -= 1;
    const final = e.hitsLeft <= 0;
    e.clip = final ? 'break' : 'hit';
    e.t = 0;
    e.knock = final ? 26 : 16;
    if (final) {
      if (e.boss) this.kills = 0;
      else this.kills += 1;
    }
    const hitNo = (e.boss ? SPAR_BOSS.hits : 1) - e.hitsLeft;
    this.opts.onHit?.({ boss: e.boss, final, hitNo, clip: this.heroClip, enemyX: e.x + e.knock });
  }

  /** 推進 dt 秒 */
  update(dt: number) {
    const step = Math.min(Math.max(dt, 0), 0.1);
    const prevHero = this.heroT;
    this.phaseT += step;
    this.heroT += step;
    const e = this.enemy;
    if (e) {
      e.t += step;
      e.knock = Math.max(0, e.knock - step * 60);
      const d = clipDuration(ENEMY_CLIPS[e.clip]);
      if ((e.clip === 'enter' || e.clip === 'hit') && e.t >= d) {
        e.clip = 'taunt';
        e.t = 0;
      }
    }
    const T = SPAR_TIMING;
    const moveTo = (x: number) => {
      if (!e) return;
      this.scroll += Math.max(0, e.x - x);
      e.x = x;
    };
    switch (this.phase) {
      case 'next':
        if (this.phaseT >= T.nextSec) this.go('walk');
        break;
      case 'walk': {
        const k = Math.min(1, this.phaseT / T.walkSec);
        moveTo(this.from + (this.meleeX() - this.from) * k);
        if (k >= 1) this.go('windup');
        break;
      }
      case 'dash': {
        const k = Math.min(1, this.phaseT / T.dashSec);
        moveTo(this.from + (this.meleeX() - this.from) * (1 - (1 - k) * (1 - k)));
        if (k >= 1) this.go('strike');
        break;
      }
      case 'windup':
        if (this.phaseT >= T.windupSec) this.go('strike');
        break;
      case 'strike':
      case 'combo':
      case 'ultimate': {
        const clip = HERO_CLIPS[this.heroClip];
        for (let i = hitsCrossed(clip, prevHero, this.heroT); i > 0; i--) this.hit();
        const dur = this.phase === 'strike' ? T.strikeSec : clipDuration(clip);
        if (this.phaseT >= dur) {
          const left = this.enemy?.hitsLeft ?? 0;
          if (left > 0 && this.phase === 'strike') this.go(left > 1 ? 'combo' : 'ultimate');
          else if (left > 0 && this.phase === 'combo') this.go('ultimate');
          else this.go('recover');
        }
        break;
      }
      case 'recover':
        if (this.phaseT >= T.recoverSec) {
          if (this.enemy && this.enemy.hitsLeft <= 0) this.enemy = null;
          this.go('next');
        }
        break;
    }
  }
}
