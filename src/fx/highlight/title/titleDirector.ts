/**
 * 主頁動畫導演：斗笠劍客待機＋「開卷」過場（GSAP 時間線，嚴格狀態機）。
 *
 *   idle ──play()──▶ gather（蓄勢）──▶ slash（拔劍一揮）──▶ burst（墨環爆開）──▶ wash（紙面化開）──▶ done
 *   任何時候 skip() → 直接 done（onDone 只會叫一次）
 *
 * 待機循環（轉身、呼吸、陣風）喺切狀態時「先取消再歸零」，免得遲一幀又寫返舊值。
 */
import gsap from 'gsap';
import * as THREE from 'three';
import { HighlightStage } from '../scene/renderer';
import { ParticleSystem } from '../particles';
import { initHighlightAudio, sfx } from '../audio';
import { buildSwordsman, defaultPose, type HeroModel, type HeroPose } from './swordsman';

export type TitlePhase = 'idle' | 'gather' | 'slash' | 'burst' | 'wash' | 'done';

export interface TitleRefs {
  root: HTMLElement;
  world: HTMLElement;
  gl: HTMLCanvasElement;
  fx: HTMLCanvasElement;
  /** 主角後面嘅粒子層（墨環衝擊波畫喺度，唔會掃過主角） */
  fxBack: HTMLCanvasElement;
  shadow: HTMLElement;
  flash: HTMLElement;
  wash: HTMLElement;
}

/** 演出強度參數（見 design/ux/title-hero.md「可調參數」） */
export const TITLE_TUNING = {
  /** 主角高度佔畫面高度（有 slot 時按 slot 高度 × slotFill 計，上限 heroFrac） */
  heroFrac: 0.44,
  /** 主角填滿 slot 嘅比例 */
  slotFill: 0.9,
  /** 冇 slot 時主角中心喺畫面由上計嘅比例 */
  screenY: 0.52,
  /** 待機左右轉幅（弧度）、一個來回秒數 */
  turnAmp: 0.38,
  turnSec: 4.4,
  /** 呼吸週期 */
  breathSec: 1.9,
  /** 平時風力、陣風風力、陣風間隔 */
  windBase: 0.32,
  windGust: 0.95,
  gustEvery: 4.6,
  /** 過場各段秒數 */
  gatherSec: 0.36,
  slashSec: 0.26,
  burstHold: 0.14,
  washSec: 0.44,
  /** 爆開：閃白上限（≤0.8）、震屏像素、鏡頭推近比例、粒子數 */
  flashMax: 0.8,
  shakePx: 11,
  pushK: 0.1,
  sparkBase: 64,
  streakBase: 18,
  starBase: 12,
};

const INK = '#1C1A17';
const INK_WASH = '#8A857C';
const GOLD_LEAF = '#C29A45';
const CINNABAR = '#A33A32';
const RIM = '#F1DFA8';

export class TitleDirector {
  phase: TitlePhase = 'idle';
  readonly stage: HighlightStage;
  readonly particles: ParticleSystem;
  readonly back: ParticleSystem;
  private hero: HeroModel;
  private pose: HeroPose = defaultPose();
  private A = { rotY: 0, camK: 1, shake: 0, wash: 0 };
  private cam = { dist: 9, lookY: 1, camY: 1.6 };
  private loops: (gsap.core.Tween | gsap.core.Timeline)[] = [];
  private gustCall: gsap.core.Tween | null = null;
  private main: gsap.core.Timeline | null = null;
  private raf = 0;
  private last = 0;
  private t = 0;
  private cssW = 1;
  private cssH = 1;
  private reduce: boolean;
  private onDone: (() => void) | null = null;
  private stopCharge: (() => void) | null = null;
  private trailOn = false;
  private tip = new THREE.Vector3();
  private slot: () => HTMLElement | null;

  /**
   * @param opts.slot 主頁留畀主角嘅空位（標題同按鈕之間）；每次 resize 按佢定主角大細同位置
   */
  constructor(
    private refs: TitleRefs,
    opts: { reduceMotion: boolean; slot?: () => HTMLElement | null },
  ) {
    this.slot = opts.slot ?? (() => null);
    this.reduce = opts.reduceMotion;
    this.stage = new HighlightStage({ canvas: refs.gl, lowPower: opts.reduceMotion });
    this.stage.setRimColor(RIM);
    this.particles = new ParticleSystem(refs.fx);
    this.particles.density = this.reduce ? 0.35 : 1;
    this.back = new ParticleSystem(refs.fxBack);
    this.hero = buildSwordsman();
    this.stage.subjectRoot.add(this.hero.root);
    this.resize();
    this.tick = this.tick.bind(this);
    // 第一幀即刻畫：打開就係完整待機畫面
    this.sync();
    this.stage.render();
    this.raf = requestAnimationFrame(this.tick);
    this.startIdle();
  }

  // ------------------------------------------------------------ 基礎 ---

  resize() {
    const r = this.refs.root.getBoundingClientRect();
    this.cssW = Math.max(1, r.width);
    this.cssH = Math.max(1, r.height);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.stage.resize(this.cssW, this.cssH, dpr);
    const cam = this.stage.camera;
    const tanV = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    const H = this.hero.height;
    const T = TITLE_TUNING;
    let frac = T.heroFrac;
    let screenY = T.screenY;
    const slotEl = this.slot();
    if (slotEl) {
      const sr = slotEl.getBoundingClientRect();
      const top = (sr.top - r.top) / this.cssH;
      const bottom = (sr.bottom - r.top) / this.cssH;
      if (bottom - top > 0.05) {
        frac = Math.min(T.heroFrac, (bottom - top) * T.slotFill);
        screenY = (top + bottom) / 2;
      }
    }
    // 高度按 frac；窄屏時再確保闊度（連披風擺動）唔出界
    const aspect = this.cssW / this.cssH;
    const dist = Math.max(H / frac / (2 * tanV), 2.2 / (0.62 * 2 * tanV * aspect));
    const visH = 2 * dist * tanV;
    const lookY = H / 2 - (0.5 - screenY) * visH;
    this.cam = { dist, lookY, camY: lookY + 0.55 };
    this.particles.resize(this.cssW, this.cssH, dpr);
    this.back.resize(this.cssW, this.cssH, dpr);
    this.placeOverlays();
  }

  private project(x: number, y: number, z = 0) {
    return this.stage.project(new THREE.Vector3(x, y, z), this.cssW, this.cssH);
  }

  /** 胸口（爆點、墨環中心） */
  center() {
    return this.project(0, this.hero.height * 0.55);
  }

  /** 主角輪廓半徑（px）：粒子由呢度外面開始 */
  private radiusPx() {
    const c = this.center();
    const side = this.project(0.78, this.hero.height * 0.55);
    return Math.abs(side.x - c.x);
  }

  private placeOverlays() {
    const c = this.center();
    const f = this.project(0, 0);
    const top = this.project(0, this.hero.height);
    const s = this.refs.root.style;
    s.setProperty('--cx', `${c.x}px`);
    s.setProperty('--cy', `${c.y}px`);
    s.setProperty('--footx', `${f.x}px`);
    s.setProperty('--footy', `${f.y}px`);
    s.setProperty('--hh', `${Math.abs(f.y - top.y)}px`);
  }

  private tick(now: number) {
    this.raf = requestAnimationFrame(this.tick);
    const dt = Math.min(0.05, this.last ? (now - this.last) / 1000 : 0.016);
    this.last = now;
    this.t += dt;
    this.sync();
    this.stage.render();
    if (this.trailOn) this.emitTrail();
    this.particles.step(dt);
    this.particles.draw();
    this.back.step(dt);
    this.back.draw();
  }

  private sync() {
    const A = this.A;
    this.hero.update(this.t, this.pose);
    const r = this.stage.subjectRoot;
    r.rotation.set(0, A.rotY, 0);
    const cam = this.stage.camera;
    cam.position.set(0, this.cam.camY, this.cam.dist * A.camK);
    cam.lookAt(0, this.cam.lookY + (1 - A.camK) * this.hero.height * 0.4, 0);
    // 投影：蹲低時闊啲、濃啲
    const sh = this.refs.shadow.style;
    sh.transform = `translate(-50%, -50%) scale(${1 + this.pose.crouch * 0.12}, 1)`;
    // 震屏
    if (A.shake) {
      this.refs.world.style.transform = `translate(${(Math.random() - 0.5) * A.shake}px, ${(Math.random() - 0.5) * A.shake}px)`;
    } else if (this.refs.world.style.transform) {
      this.refs.world.style.transform = '';
    }
    this.refs.wash.style.setProperty('--wash', String(A.wash));
  }

  // ------------------------------------------------------------ 待機 ---

  private startIdle() {
    this.stopLoops();
    const p = this.pose;
    const T = TITLE_TUNING;
    const amp = this.reduce ? T.turnAmp * 0.3 : T.turnAmp;
    this.loops.push(
      gsap.fromTo(
        this.A,
        { rotY: -amp },
        { rotY: amp, duration: T.turnSec / 2, ease: 'sine.inOut', yoyo: true, repeat: -1 },
      ),
      gsap.to(p, { breath: 1, duration: T.breathSec / 2, ease: 'sine.inOut', yoyo: true, repeat: -1 }),
    );
    p.wind = T.windBase;
    this.scheduleGust();
  }

  /** 陣風：披風鼓起、垂紗揚起，墨塵由左吹過 */
  private scheduleGust() {
    this.gustCall?.kill();
    this.gustCall = gsap.delayedCall(TITLE_TUNING.gustEvery * (0.8 + Math.random() * 0.4), () => {
      if (this.phase !== 'idle') return;
      const T = TITLE_TUNING;
      const peak = this.reduce ? T.windBase + 0.2 : T.windGust;
      const tl = gsap.timeline({ onComplete: () => this.scheduleGust() });
      tl.to(this.pose, { wind: peak, duration: 0.55, ease: 'power2.out' }).to(this.pose, {
        wind: T.windBase,
        duration: 1.7,
        ease: 'sine.inOut',
      });
      this.loops.push(tl);
      if (!this.reduce) this.gustDust();
    });
  }

  private gustDust() {
    const c = this.center();
    const h = this.cssH * TITLE_TUNING.heroFrac;
    const n = Math.round(16 * this.particles.density);
    for (let i = 0; i < n; i++) {
      const life = 1.6 + Math.random() * 1.2;
      const gold = i % 5 === 0;
      this.particles.add({
        shape: gold ? 'star' : 'dust',
        x: -20 - Math.random() * 80,
        y: c.y + (Math.random() - 0.5) * h * 1.1,
        vx: 3.2 + Math.random() * 2.6,
        vy: -0.3 + Math.random() * 0.4,
        color: gold ? GOLD_LEAF : i % 2 ? INK : INK_WASH,
        size: gold ? 6 + Math.random() * 4 : 1.2 + Math.random() * 1.8,
        drag: 0.995,
        vr: gold ? (Math.random() - 0.5) * 0.2 : 0,
        life,
        maxLife: life,
      });
    }
  }

  /** 先取消再歸零 */
  private stopLoops() {
    this.gustCall?.kill();
    this.gustCall = null;
    for (const t of this.loops) t.kill();
    this.loops = [];
    gsap.killTweensOf(this.pose, 'breath,wind');
    gsap.killTweensOf(this.A, 'rotY');
    this.pose.breath = 0;
  }

  // ------------------------------------------------------------ 過場 ---

  /** 撳開卷：蓄勢 → 拔劍一揮 → 墨環爆開 → 紙面化開 → onDone */
  play(onDone: () => void) {
    if (this.phase !== 'idle') return;
    initHighlightAudio();
    this.onDone = onDone;
    if (this.reduce) {
      // 減少動態：唔做過場，直接入
      this.finish();
      return;
    }
    this.stopLoops();
    const T = TITLE_TUNING;
    const p = this.pose;
    const A = this.A;
    const tl = gsap.timeline();
    this.main = tl;

    // 1 蓄勢：轉正、蹲低、右手搭劍柄；墨點由四周吸入（到輪廓外即消失）
    tl.call(() => {
      this.phase = 'gather';
      const c = this.center();
      const r = this.radiusPx();
      this.particles.attract(c.x, c.y, 34, [INK, INK_WASH, GOLD_LEAF], r * 2.6, r * 1.05);
      this.stopCharge = sfx.charge(T.gatherSec + T.slashSec * 0.5);
    });
    tl.to(A, { rotY: 0.22, duration: T.gatherSec, ease: 'power2.out' }, 0);
    tl.to(p, { crouch: 1, duration: T.gatherSec, ease: 'power2.in' }, 0);
    tl.to(p, { rArmX: -0.95, rArmZ: 0.75, twist: 0.28, duration: T.gatherSec, ease: 'power3.out' }, 0);
    tl.to(p, { wind: 0.1, duration: T.gatherSec, ease: 'power1.out' }, 0);

    // 2 拔劍一揮：劍轉去右手，由身前向外上方掃出弧；劍尖留墨痕
    tl.call(() => {
      this.phase = 'slash';
      this.stopCharge?.();
      this.stopCharge = null;
      this.hero.drawSword();
      this.trailOn = true;
      sfx.jump();
    });
    tl.to(p, { rArmX: -0.75, rArmZ: -1.45, twist: -0.42, duration: T.slashSec, ease: 'power4.out' });
    tl.to(p, { crouch: 0.15, wind: 1, duration: T.slashSec, ease: 'back.out(2.2)' }, '<');
    tl.to(A, { rotY: -0.15, duration: T.slashSec, ease: 'power3.out' }, '<');

    // 3 爆開：亮紙、三道墨環、墨點由輪廓邊噴出、金箔、震屏、鏡頭一推
    tl.call(() => {
      this.phase = 'burst';
      this.trailOn = false;
      this.burst();
    });
    tl.to(A, { camK: 1 - T.pushK, duration: 0.16, ease: 'power3.out' });
    tl.fromTo(A, { shake: T.shakePx }, { shake: 0, duration: 0.34, ease: 'power2.out' }, '<');
    // 4 紙面化開：由胸口向外暈開，蓋住全畫面
    tl.call(() => {
      this.phase = 'wash';
    }, undefined, `+=${T.burstHold}`);
    tl.to(A, { wash: 1, duration: T.washSec, ease: 'power2.in' });
    tl.call(() => this.finish());
  }

  private burst() {
    const T = TITLE_TUNING;
    const c = this.center();
    const r = this.radiusPx();
    const el = this.refs.flash;
    gsap.killTweensOf(el);
    gsap.fromTo(el, { opacity: T.flashMax }, { opacity: 0, duration: 0.55, ease: 'power2.out' });
    [0, 0.06, 0.13].forEach((d, i) =>
      gsap.delayedCall(d, () =>
        this.back.shockwave(
          c.x,
          c.y,
          Math.max(this.cssW, this.cssH) * (0.36 + i * 0.14),
          i === 1 ? CINNABAR : INK,
          0.75,
          r * 0.9,
        ),
      ),
    );
    // 爆開粒子全部畫喺主角後面：由輪廓後噴出，唔會蓋住斗笠同身
    this.back.density = this.particles.density;
    this.back.sparks(c.x, c.y, T.sparkBase, [INK, INK, INK_WASH, CINNABAR], 10, 0.14, r);
    this.back.streaks(c.x, c.y, T.streakBase, INK, 22, r);
    this.back.stars(c.x, c.y, T.starBase, GOLD_LEAF, 160, r);
    sfx.explode(1.2);
  }

  /** 劍尖墨痕：每幀喺劍尖落一點濃墨，連埋成一撇 */
  private emitTrail() {
    this.hero.swordTip(this.tip);
    const s = this.stage.project(this.tip, this.cssW, this.cssH);
    for (let i = 0; i < 3; i++) {
      const life = 0.35 + Math.random() * 0.25;
      this.particles.add({
        x: s.x + (Math.random() - 0.5) * 6,
        y: s.y + (Math.random() - 0.5) * 6,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        color: i ? INK : INK_WASH,
        size: 3.2 + Math.random() * 2.6,
        drag: 0.9,
        life,
        maxLife: life,
      });
    }
  }

  /** 跳過：即刻完成（onDone 只叫一次） */
  skip() {
    if (this.phase === 'idle' || this.phase === 'done') return;
    this.finish();
  }

  private finish() {
    if (this.phase === 'done') return;
    this.phase = 'done';
    this.main?.kill();
    this.main = null;
    this.stopCharge?.();
    this.stopCharge = null;
    this.trailOn = false;
    this.A.shake = 0;
    this.A.wash = 1;
    this.sync();
    const cb = this.onDone;
    this.onDone = null;
    cb?.();
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.stopLoops();
    this.main?.kill();
    this.stopCharge?.();
    gsap.killTweensOf(this.A);
    gsap.killTweensOf(this.pose);
    gsap.killTweensOf(this.refs.flash);
    this.stage.dispose();
  }
}
