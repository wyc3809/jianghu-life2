/**
 * 高光時刻導演：GSAP 時間線編排五個階段，嚴格狀態機（動畫中忽略點擊）。
 *
 *   idle ──tap──▶ upgrading ──▶ idle … (grade 到 target) ──tap──▶ charging ──▶ bursting ──▶ revealing ──▶ settle
 *   settle ──領取──▶ claiming ──▶ done
 *
 * 循環補間（浮動、搖擺、提示抖動、蓄力抖）喺切狀態時「先取消再歸零」，
 * 免得佢比停止指令遲一幀完結、又將數值寫返去。
 */
import gsap from 'gsap';
import * as THREE from 'three';
import { GRADES, type GradeStyle } from './grades';
import type { Grade, HighlightConfig } from './types';
import { HighlightStage } from './scene/renderer';
import { buildPedestal, buildSubject, type SubjectModel } from './scene/models';
import { ParticleSystem } from './particles';
import { initHighlightAudio, sfx } from './audio';

export type Phase = 'idle' | 'upgrading' | 'charging' | 'bursting' | 'revealing' | 'settle' | 'claiming' | 'done';

export interface DirectorRefs {
  root: HTMLElement;
  world: HTMLElement;
  gl: HTMLCanvasElement;
  fx: HTMLCanvasElement;
  flash: HTMLElement;
  shadow: HTMLElement;
  beams: HTMLElement;
  curtain: HTMLElement;
  backGlow: HTMLElement;
}

export interface DirectorCallbacks {
  onPhase(p: Phase): void;
  onGrade(g: Grade): void;
  /** 揭曉：React 開始渲染卡片／面板 */
  onReveal(): void;
  onDone(): void;
}

/** 演出強度參數（見 design/ux/highlight-fx.md「可調參數」） */
export const TUNING = {
  /** 蓄力秒數 */
  chargeSec: 1.0,
  /** 爆發閃白上限（≤0.8） */
  flashMax: 0.8,
  /** 震屏像素（× 品階 power） */
  shakePx: 14,
  /** 鏡頭推近比例（× power） */
  pushK: 0.12,
  /** 爆發粒子基數（× power） */
  sparkBase: 70,
  streakBase: 22,
  starBase: 12,
  /** 彩帶數（只最高品階） */
  confetti: 90,
  /** 揭曉前停頓 */
  revealDelay: 0.75,
};

/** 主體最長邊（世界單位）：三個模型尺寸唔同，統一縮到呢個大細 */
const SUBJECT_SIZE = 2.3;
/** 水墨粒子色：濃墨、淡墨、金箔、朱砂 */
const INK = '#1C1A17';
const INK_WASH = '#8A857C';
const GOLD_LEAF = '#C29A45';
const CINNABAR = '#A33A32';
/** 主體中心喺畫面由上計嘅比例 */
const SUBJECT_SCREEN_Y = 0.42;

export class Director {
  phase: Phase = 'idle';
  grade: Grade = 0;
  readonly stage: HighlightStage;
  readonly particles: ParticleSystem;
  private model: SubjectModel;
  private pedestal: THREE.Group;
  private A = {
    y: 0,
    rotY: 0,
    rotZ: 0,
    spin: 0,
    sx: 1,
    sy: 1,
    sz: 1,
    jitter: 0,
    open: 0,
    glow: 0,
    camK: 1,
    world: 0,
    pan: 0,
  };
  /** 取景（resize 時按畫面比例計） */
  private cam = { dist: 9, lookY: 1, camY: 1.6 };
  private subH = SUBJECT_SIZE;
  private loops: (gsap.core.Tween | gsap.core.Timeline | gsap.core.Tween)[] = [];
  private hintCall: gsap.core.Tween | null = null;
  private main: gsap.core.Timeline | null = null;
  private raf = 0;
  private last = 0;
  private cssW = 1;
  private cssH = 1;
  private reduce: boolean;
  private audioReady = false;
  private stopCharge: (() => void) | null = null;
  private norm = 1;
  private orbitOn = false;

  constructor(
    private refs: DirectorRefs,
    private cfg: HighlightConfig,
    private cb: DirectorCallbacks,
    opts: { reduceMotion: boolean },
  ) {
    this.reduce = opts.reduceMotion;
    this.stage = new HighlightStage({ canvas: refs.gl, lowPower: opts.reduceMotion });
    this.particles = new ParticleSystem(refs.fx);
    this.particles.density = this.reduce ? 0.35 : 1;
    this.model = buildSubject(cfg.subject);
    const size = new THREE.Box3().setFromObject(this.model.root).getSize(new THREE.Vector3());
    this.norm = SUBJECT_SIZE / Math.max(size.x, size.y, size.z * 0.8);
    this.model.root.scale.setScalar(this.norm);
    this.subH = size.y * this.norm;
    this.stage.subjectRoot.add(this.model.root);
    this.pedestal = buildPedestal();
    this.stage.props.add(this.pedestal);
    this.applyGrade(0, false);
    this.resize();
    this.tick = this.tick.bind(this);
    // 第一幀即刻畫：打開就係完整待機畫面
    this.syncScene();
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
    // 取景：闊度要容得落主體＋台座，高度要容得落跳起
    const cam = this.stage.camera;
    const tanV = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    const aspect = this.cssW / this.cssH;
    const dist = Math.max(3.9 / 2 / (tanV * aspect), (this.subH + 2.6) / 2 / tanV);
    const visH = 2 * dist * tanV;
    const lookY = this.subH / 2 - (0.5 - SUBJECT_SCREEN_Y) * visH;
    this.cam = { dist, lookY, camY: lookY + 0.9 };
    this.particles.resize(this.cssW, this.cssH, dpr);
    this.placeOverlays();
  }

  private get style(): GradeStyle {
    return GRADES[this.grade];
  }

  /** 主體爆點（CSS 座標） */
  burstScreen(): { x: number; y: number } {
    const p = this.model.burstPoint.clone().multiplyScalar(this.norm);
    this.stage.subjectRoot.updateMatrixWorld();
    return this.stage.project(p.applyMatrix4(this.stage.subjectRoot.matrixWorld), this.cssW, this.cssH);
  }

  private centerScreen(): { x: number; y: number } {
    return this.stage.project(new THREE.Vector3(0, this.subH * 0.5, 0), this.cssW, this.cssH);
  }

  private baseScreen(): { x: number; y: number } {
    return this.stage.project(new THREE.Vector3(0, -0.05, 0), this.cssW, this.cssH);
  }

  /** 主體螢幕半徑（環繞軌道要喺呢個外面） */
  private subjectRadiusPx(): { rx: number; ry: number } {
    const top = this.stage.project(new THREE.Vector3(0, this.subH + 0.1, 0), this.cssW, this.cssH);
    const bot = this.stage.project(new THREE.Vector3(0, -0.1, 0), this.cssW, this.cssH);
    const side = this.stage.project(new THREE.Vector3(1.35, this.subH * 0.5, 0), this.cssW, this.cssH);
    const c = this.centerScreen();
    return { rx: Math.abs(side.x - c.x), ry: Math.abs(bot.y - top.y) / 2 };
  }

  private placeOverlays() {
    const c = this.centerScreen();
    const b = this.baseScreen();
    const bp = this.burstScreen();
    const root = this.refs.root.style;
    root.setProperty('--cx', `${c.x}px`);
    root.setProperty('--cy', `${c.y}px`);
    root.setProperty('--bx', `${bp.x}px`);
    root.setProperty('--by', `${bp.y}px`);
    root.setProperty('--gx', `${b.x}px`);
    root.setProperty('--gy', `${b.y}px`);
    const { rx, ry } = this.subjectRadiusPx();
    root.setProperty('--sr', `${Math.max(rx, ry)}px`);
  }

  private applyGrade(g: Grade, fx = true) {
    this.grade = g;
    const st = GRADES[g];
    this.model.setGrade(st);
    this.stage.setRimColor(st.glow);
    const s = this.refs.root.style;
    s.setProperty('--main', st.main);
    s.setProperty('--glow', st.glow);
    s.setProperty('--bg-in', st.bgInner);
    s.setProperty('--bg-out', st.bgOuter);
    this.cb.onGrade(g);
    if (!fx) return;
    // 閃一下光＋一圈粒子
    const c = this.centerScreen();
    this.flash(0.45, 0.35, c);
    this.particles.shockwave(c.x, c.y, 150, st.main, 0.55);
    // 由輪廓邊向外濺，唔會落喺主體正面
    this.particles.sparks(c.x, c.y, 22, [INK, st.main, GOLD_LEAF], 7, 0.12, this.subjectRadiusPx().rx);
    sfx.levelUp(g);
  }

  private flash(peak: number, dur: number, at?: { x: number; y: number }) {
    const el = this.refs.flash;
    const p = at ?? this.burstScreen();
    el.style.setProperty('--fx', `${p.x}px`);
    el.style.setProperty('--fy', `${p.y}px`);
    gsap.killTweensOf(el);
    gsap.fromTo(el, { opacity: Math.min(peak, TUNING.flashMax) }, { opacity: 0, duration: dur, ease: 'power2.out' });
  }

  private setPhase(p: Phase) {
    this.phase = p;
    this.cb.onPhase(p);
  }

  private tick(now: number) {
    this.raf = requestAnimationFrame(this.tick);
    const dt = Math.min(0.05, this.last ? (now - this.last) / 1000 : 0.016);
    this.last = now;
    this.syncScene();
    this.placeOverlays(); // 鏡頭推近時光效錨點跟住走
    this.stage.render();
    this.particles.step(dt);
    this.particles.draw();
  }

  private syncScene() {
    const A = this.A;
    const r = this.stage.subjectRoot;
    const j = A.jitter;
    r.position.set(j ? (Math.random() - 0.5) * 0.12 * j : 0, A.y, j ? (Math.random() - 0.5) * 0.06 * j : 0);
    r.rotation.set(0, A.rotY + A.spin, A.rotZ + (j ? (Math.random() - 0.5) * 0.1 * j : 0));
    r.scale.set(A.sx, A.sy, A.sz);
    this.model.setOpen(A.open);
    this.model.setGlow(A.glow);
    const cam = this.stage.camera;
    cam.position.set(0, this.cam.camY, this.cam.dist * A.camK);
    // pan：揭曉時主體上移、拉遠少少，讓出下面嘅面板位
    cam.position.y = this.cam.camY - A.pan;
    cam.lookAt(0, this.cam.lookY + (1 - A.camK) * this.subH * 0.35 - A.pan, 0);
    // 投影：高度越高越細越淡
    const sh = this.refs.shadow.style;
    const k = 1 / (1 + A.y * 0.55);
    sh.transform = `translate(-50%, -50%) scale(${k * (A.sx * 0.9 + 0.1)}, ${k})`;
    sh.opacity = String(0.55 * k);
    // 震屏
    if (A.world) {
      this.refs.world.style.transform = `translate(${(Math.random() - 0.5) * A.world}px, ${(Math.random() - 0.5) * A.world}px)`;
    } else if (this.refs.world.style.transform) {
      this.refs.world.style.transform = '';
    }
  }

  // ------------------------------------------------------------ 循環 ---

  private startIdle() {
    this.stopLoops();
    const A = this.A;
    this.loops.push(
      gsap.to(A, { y: 0.16, duration: 1.3, ease: 'sine.inOut', yoyo: true, repeat: -1 }),
      gsap.fromTo(
        A,
        { rotY: A.rotY },
        {
          rotY: 0.55,
          duration: 1.6,
          ease: 'sine.inOut',
          onComplete: () => {
            if (this.phase !== 'idle' && this.phase !== 'settle' && this.phase !== 'revealing') return;
            this.loops.push(
              gsap.fromTo(
                A,
                { rotY: 0.55 },
                { rotY: -0.55, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1 },
              ),
            );
          },
        },
      ),
    );
    if (this.phase === 'idle') this.scheduleHint();
  }

  /** 每隔幾秒抖一下提示可以點 */
  private scheduleHint() {
    this.hintCall?.kill();
    this.hintCall = gsap.delayedCall(2.6, () => {
      if (this.phase !== 'idle') return;
      const tl = gsap.timeline({ onComplete: () => this.scheduleHint() });
      tl.to(this.A, { rotZ: 0.1, duration: 0.06 })
        .to(this.A, { rotZ: -0.1, duration: 0.08, yoyo: true, repeat: 3 })
        .to(this.A, { rotZ: 0, duration: 0.12, ease: 'back.out(3)' });
      this.loops.push(tl);
    });
  }

  /** 先取消再歸零 */
  private stopLoops() {
    this.hintCall?.kill();
    this.hintCall = null;
    for (const t of this.loops) t.kill();
    this.loops = [];
    gsap.killTweensOf(this.A, 'y,rotZ,jitter');
    this.A.rotZ = 0;
    this.A.jitter = 0;
  }

  // ------------------------------------------------------------ 輸入 ---

  /** 畫面點擊：只喺 idle 接受，其餘一律忽略（唔會吞／亂） */
  tap() {
    if (!this.audioReady) {
      initHighlightAudio();
      this.audioReady = true;
    }
    if (this.phase !== 'idle') return;
    if (this.grade < this.cfg.targetGrade) this.upgrade();
    else this.charge();
  }

  // ------------------------------------------------------------ 2 升級 ---

  private upgrade() {
    this.setPhase('upgrading');
    this.stopLoops();
    const A = this.A;
    const next = (this.grade + 1) as Grade;
    sfx.jump();
    const tl = gsap.timeline({
      onComplete: () => {
        this.setPhase('idle');
        this.startIdle();
      },
    });
    this.main = tl;
    tl.to(A, { rotY: 0, duration: 0.12, ease: 'power1.out' }, 0)
      .to(A, { y: 0, duration: 0.08 }, 0)
      // 起跳前微壓
      .to(A, { sy: 0.82, sx: 1.12, sz: 1.12, duration: 0.08, ease: 'power2.out' }, 0)
      .to(A, { sy: 1.2, sx: 0.88, sz: 0.88, duration: 0.14, ease: 'power2.out' }, 0.08)
      .to(A, { y: 1.55, duration: 0.3, ease: 'power2.out' }, 0.08)
      .to(A, { spin: `+=${Math.PI * 2}`, duration: 0.56, ease: 'power2.inOut' }, 0.08)
      .to(A, { sy: 1, sx: 1, sz: 1, duration: 0.2 }, 0.22)
      .call(() => this.applyGrade(next), [], 0.36)
      .to(A, { y: 0, duration: 0.26, ease: 'power2.in' }, 0.38)
      // 落地壓扁再回彈
      .call(
        () => {
          sfx.land();
          const b = this.baseScreen();
          this.particles.sparks(b.x, b.y, 14, [INK_WASH, INK], 4, 0.05);
        },
        [],
        0.64,
      )
      .to(A, { sy: 0.66, sx: 1.24, sz: 1.24, duration: 0.07, ease: 'power2.out' }, 0.64)
      .to(A, { sy: 1, sx: 1, sz: 1, duration: 0.55, ease: 'elastic.out(1.1, 0.32)' }, 0.71);
  }

  // ------------------------------------------------------------ 3 蓄力 ---

  private charge() {
    this.setPhase('charging');
    this.stopLoops();
    const A = this.A;
    const sec = TUNING.chargeSec;
    this.stopCharge = sfx.charge(sec);
    const st = this.style;
    const tl = gsap.timeline({ onComplete: () => this.burst() });
    this.main = tl;
    tl.to(A, { rotY: 0, y: 0, duration: 0.2, ease: 'power2.out' }, 0)
      .to(A, { glow: 1, duration: sec, ease: 'power2.in' }, 0)
      .to(A, { jitter: this.reduce ? 0.3 : 1.2, duration: sec, ease: 'power2.in' }, 0)
      .to(this.refs.root, { '--ray-speed': 0.25, duration: sec, ease: 'power2.in' } as gsap.TweenVars, 0);
    // 粒子吸向中心（唔入主體輪廓）
    for (let t = 0; t < sec - 0.1; t += 0.09) {
      tl.call(
        () => {
          const b = this.burstScreen();
          this.particles.attract(
            b.x,
            b.y,
            10,
            [INK, st.main],
            Math.max(this.cssW, this.cssH) * 0.42,
            Math.max(this.subjectRadiusPx().rx, this.subjectRadiusPx().ry) * 1.15,
          );
        },
        [],
        t,
      );
    }
    // 最後一刻猛壓
    tl.to(A, { sy: 0.58, sx: 1.3, sz: 1.3, duration: 0.12, ease: 'power3.in' }, sec - 0.12);
  }

  // ------------------------------------------------------------ 4 爆發 ---

  private burst() {
    this.setPhase('bursting');
    this.stopCharge?.();
    this.stopCharge = null;
    const A = this.A;
    A.jitter = 0;
    const st = this.style;
    const pw = st.power;
    const top = this.grade === 5;
    const b = this.burstScreen();
    sfx.explode(pw);
    this.flash(TUNING.flashMax * Math.min(1, 0.6 + pw * 0.25), 0.7, b);
    this.refs.root.style.setProperty('--ray-speed', '1');
    this.refs.root.dataset.burst = '1';

    const tl = gsap.timeline({ onComplete: () => this.reveal() });
    this.main = tl;
    tl.to(A, { sy: 1.14, sx: 0.9, sz: 0.9, duration: 0.1, ease: 'power2.out' }, 0)
      .to(A, { sy: 1, sx: 1, sz: 1, duration: 0.7, ease: 'elastic.out(1, 0.38)' }, 0.1)
      .to(
        A,
        {
          open: 1,
          duration: this.cfg.subject === 'token' ? 1.2 : 0.6,
          ease: this.cfg.subject === 'token' ? 'power3.out' : 'back.out(2.4)',
        },
        0.02,
      )
      .to(A, { glow: 0.75, duration: 0.8 }, 0.1)
      // 鏡頭一推
      .to(A, { camK: 1 - TUNING.pushK * pw * (this.reduce ? 0.3 : 1), duration: 0.16, ease: 'power3.out' }, 0)
      .to(A, { camK: 0.96, duration: 0.9, ease: 'power2.inOut' }, 0.2);
    if (!this.reduce) {
      tl.to(A, { world: TUNING.shakePx * pw, duration: 0.02 }, 0).to(
        A,
        { world: 0, duration: 0.45, ease: 'power2.out' },
        0.05,
      );
    }
    // 多層衝擊波
    [0, 0.07, 0.16].forEach((d, i) =>
      tl.call(
        () => this.particles.shockwave(b.x, b.y, (180 + i * 90) * pw, i === 1 ? INK : st.main, 0.7 + i * 0.1),
        [],
        d,
      ),
    );
    tl.call(
      () => {
        const edgeR = this.subjectRadiusPx().rx * 0.9;
        this.particles.streaks(b.x, b.y, Math.round(TUNING.streakBase * pw), INK, 20 + pw * 6, edgeR);
        this.particles.sparks(
          b.x,
          b.y,
          Math.round(TUNING.sparkBase * pw),
          [INK, INK, st.main, GOLD_LEAF],
          8 + pw * 5,
          0.15,
          edgeR,
        );
        this.particles.stars(
          b.x,
          b.y,
          Math.round(TUNING.starBase * pw),
          GOLD_LEAF,
          60 + 90 * pw,
          this.subjectRadiusPx().rx,
        );
      },
      [],
      0.02,
    );
    // 光柱＋核心
    tl.fromTo(
      this.refs.beams,
      { opacity: 0, scale: 0.4 },
      { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.6)' },
      0.05,
    );
    tl.call(() => this.startBeamDust(), [], 0.3);
    if (top && !this.reduce) {
      tl.call(
        () =>
          this.particles.confetti(this.cssW / 2, this.cssH * 0.18, TUNING.confetti, [
            CINNABAR,
            GOLD_LEAF,
            '#E7B7A8',
            '#F3EBDC',
            st.main,
          ]),
        [],
        0.22,
      );
    }
    tl.to({}, { duration: TUNING.revealDelay }, 0.2);
  }

  private dustTimer: gsap.core.Tween | null = null;
  private startBeamDust() {
    this.dustTimer?.kill();
    const loop = () => {
      if (this.phase === 'done') return;
      const b = this.burstScreen();
      // 光塵喺開口上方先出，唔喺主體正面飄
      this.particles.dust(b.x, b.y - 40, 90, 2, GOLD_LEAF);
      this.dustTimer = gsap.delayedCall(0.18, loop);
    };
    loop();
  }

  // ------------------------------------------------------------ 5 揭曉 ---

  private reveal() {
    this.setPhase('revealing');
    const top = this.grade === 5;
    if (top) this.enterStage();
    sfx.fanfare();
    // 揭曉取景：主體上移、拉遠讓出下面面板；丹爐開蓋後最高，拉遠多啲
    const frame = this.cfg.subject === 'cauldron' ? { pan: 0.1, k: 1.24 } : { pan: 0.2, k: 1.08 };
    gsap.to(this.A, { pan: this.subH * frame.pan, camK: frame.k, duration: 0.8, ease: 'power2.inOut' });
    this.startIdle();
    this.cb.onReveal();
  }

  /** 最高品階：幕布＋柔光、收起其他 3D 物件、背後外發光、環繞星塵 */
  private enterStage() {
    this.pedestal.visible = false;
    this.refs.root.dataset.stage = '1';
    gsap.fromTo(this.refs.curtain, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power2.out' });
    gsap.fromTo(
      this.refs.backGlow,
      { opacity: 0, scale: 0.6 },
      { opacity: 1, scale: 1, duration: 0.8, ease: 'power2.out' },
    );
    if (!this.orbitOn) {
      this.orbitOn = true;
      const c = this.centerScreen();
      const { rx, ry } = this.subjectRadiusPx();
      // 軌道完整喺輪廓外側
      this.particles.orbit(c.x, c.y, rx * 1.35 + 30, ry * 1.05 + 30, this.reduce ? 3 : 9, GOLD_LEAF);
    }
  }

  /** React 揭曉動畫播完（卡片落位、面板數字滾完）→ 可以領取 */
  revealSettled() {
    if (this.phase !== 'revealing') return;
    this.setPhase('settle');
  }

  /** 領取：由 React 播金幣飛入，完成後叫 finish */
  beginClaim(): boolean {
    if (this.phase !== 'settle') return false;
    this.setPhase('claiming');
    return true;
  }

  finish() {
    if (this.phase === 'done') return;
    this.setPhase('done');
    this.stopLoops();
    this.dustTimer?.kill();
    this.cb.onDone();
  }

  /** 跳過：直接去結算（卡片由 React 即時擺好） */
  skip() {
    if (this.phase === 'settle' || this.phase === 'claiming' || this.phase === 'done' || this.phase === 'revealing')
      return;
    this.main?.kill();
    this.stopCharge?.();
    this.stopCharge = null;
    this.stopLoops();
    const A = this.A;
    gsap.killTweensOf(A);
    Object.assign(A, {
      y: 0,
      rotY: 0,
      spin: 0,
      sx: 1,
      sy: 1,
      sz: 1,
      jitter: 0,
      open: 1,
      glow: 0.75,
      camK: 0.96,
      world: 0,
    });
    if (this.grade !== this.cfg.targetGrade) this.applyGrade(this.cfg.targetGrade, false);
    this.refs.root.dataset.burst = '1';
    gsap.set(this.refs.beams, { opacity: 1, scale: 1 });
    this.startBeamDust();
    this.reveal();
  }

  sfx = sfx;

  dispose() {
    cancelAnimationFrame(this.raf);
    this.main?.kill();
    this.stopCharge?.();
    this.stopLoops();
    this.dustTimer?.kill();
    gsap.killTweensOf(this.A);
    this.stage.dispose();
  }
}
