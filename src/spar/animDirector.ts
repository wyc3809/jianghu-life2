/**
 * 演武導演狀態機（計劃 B）：
 * enter → approach → windup → strike → recover →（清場）reset
 * 負責節奏／緩動／停頓；唔直接畫圖。
 */

export type DirectorPhase =
  | 'enter'
  | 'approach'
  | 'windup'
  | 'strike'
  | 'recover'
  | 'reset';

export interface DirectorSample {
  phase: DirectorPhase;
  /** 0..1 喺而家 phase 內進度 */
  phaseT: number;
  /** 行速倍率（approach 用 ease） */
  walkMul: number;
  /** 是否允許開招 */
  canStrike: boolean;
  /** 身驅額外下蹲（設計單位，正＝下） */
  crouchY: number;
  /** 過場淡入（reset／enter） */
  fadeIn: number;
}

const PHASE_DUR: Record<DirectorPhase, number> = {
  enter: 0.42,
  approach: 99, // 直到入近戰
  windup: 0.22,
  strike: 0.72, // 對齊 SPAR_CLIPS.attack.dur
  recover: 0.28,
  reset: 0.45,
};

function easeInCubic(t: number) {
  return t * t * t;
}
function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

export class AnimDirector {
  phase: DirectorPhase = 'enter';
  t = 0;
  private meleeLatch = false;

  resetToEnter() {
    this.phase = 'enter';
    this.t = 0;
    this.meleeLatch = false;
  }

  /** 通知已入近戰距離 */
  notifyMelee(inMelee: boolean) {
    this.meleeLatch = inMelee;
  }

  /** 通知揮擊 clip 完結 */
  notifyStrikeDone() {
    if (this.phase === 'strike') {
      this.phase = 'recover';
      this.t = 0;
    }
  }

  /** 通知要換 lane */
  notifyLaneReset() {
    this.phase = 'reset';
    this.t = 0;
    this.meleeLatch = false;
  }

  /** 想開招時：由 approach 切入 windup */
  requestWindup(): boolean {
    if (this.phase !== 'approach' || !this.meleeLatch) return false;
    this.phase = 'windup';
    this.t = 0;
    return true;
  }

  /** windup 完 → strike */
  consumeWindupReady(): boolean {
    if (this.phase === 'windup' && this.t >= PHASE_DUR.windup) {
      this.phase = 'strike';
      this.t = 0;
      return true;
    }
    return false;
  }

  /** reset 完 → enter */
  consumeResetDone(): boolean {
    if (this.phase === 'reset' && this.t >= PHASE_DUR.reset) {
      this.phase = 'enter';
      this.t = 0;
      return true;
    }
    return false;
  }

  update(dt: number): DirectorSample {
    this.t += dt;
    if (this.phase === 'enter' && this.t >= PHASE_DUR.enter) {
      this.phase = 'approach';
      this.t = 0;
    }
    if (this.phase === 'recover' && this.t >= PHASE_DUR.recover) {
      this.phase = this.meleeLatch ? 'windup' : 'approach';
      this.t = 0;
    }

    const dur = PHASE_DUR[this.phase];
    const phaseT = dur > 0 && dur < 50 ? Math.min(1, this.t / dur) : 0;

    let walkMul = 0;
    let crouchY = 0;
    let canStrike = false;
    let fadeIn = 1;

    switch (this.phase) {
      case 'enter':
        walkMul = 0.15 + 0.35 * easeOutCubic(phaseT);
        fadeIn = easeOutCubic(phaseT);
        crouchY = 4 * (1 - phaseT);
        break;
      case 'approach': {
        // 由慢加速到滿速；接近敵人時由 notifyMelee 轉 windup
        const accel = Math.min(1, this.t / 0.9);
        walkMul = 0.45 + 0.55 * easeInCubic(accel);
        break;
      }
      case 'windup':
        walkMul = 0.12;
        crouchY = 10 * easeOutCubic(Math.min(1, phaseT * 1.2));
        canStrike = false;
        break;
      case 'strike':
        walkMul = 0.35;
        crouchY = 2;
        canStrike = true;
        break;
      case 'recover':
        walkMul = 0.55;
        crouchY = 3 * (1 - phaseT);
        break;
      case 'reset':
        walkMul = 0;
        fadeIn = 1 - phaseT;
        break;
    }

    return {
      phase: this.phase,
      phaseT,
      walkMul,
      canStrike,
      crouchY,
      fadeIn,
    };
  }
}
