/**
 * 高光級打鬥演出導演：將 CombatReplay 逐招變成一條 GSAP 時間線。
 *
 *   開場（墨霧入場、鏡頭推近、題字）
 *   → 每招一個 beat：玩家（蓄勢 → 揮擊筆觸 → 命中墨濺／落空）或敵人還手
 *   → 終結（慢鏡、化墨散開、落「勝」／「敗」印）
 *
 * 只係播放：傷害、次序、勝負全部照 replay，唔計任何戰鬥數值。
 * 3D 用 Three.js（剪影位圖貼喺平面、筆觸同墨霧係 shader），粒子用高光嘅 Canvas 2D 粒子系統。
 */
import gsap from 'gsap';
import * as THREE from 'three';
import type { CombatReplay, CombatReplayHit } from '@interfaces/lifeEngine';
import { ParticleSystem } from '../particles';
import { DUEL_TUNING as T } from './tuning';
import { CRIT_FROM_VOL, FOE_STROKE, strokeForVol, type VolumeStroke } from './strokes';
import { FOE_TRAITS } from '@data/foes/traits';
import { brushMesh, fighterMaterial, mistMaterial, strokePaths, type BrushMesh } from './shaders';

export type DuelHit = CombatReplayHit & { round: number };

export interface DuelRefs {
  root: HTMLElement;
  world: HTMLElement;
  gl: HTMLCanvasElement;
  fx: HTMLCanvasElement;
  numbers: HTMLElement;
  wash: HTMLElement;
  /** 敗：全畫面褪灰（印喺佢上面，唔會變灰） */
  fade: HTMLElement;
}

export interface DuelCallbacks {
  /** 開場題字 */
  onOpen(): void;
  /** 輪到第 k 招（題字、七卷格發光） */
  onBeat(k: number): void;
  /** 第 k 招到肉（血條更新） */
  onImpact(k: number): void;
  /** 終結：勝／敗／收手 */
  onFinale(kind: 'win' | 'lose' | 'end'): void;
  onDone(): void;
  /** 素材載唔到：退返 2D 演出 */
  onFail(): void;
}

export interface DuelAssets {
  heroIdle: string;
  heroWindup: string;
  heroStrike: string;
  foe: string;
  /** 第 20 項：衣帶點綴色 'r,g,b' */
  foeAccent?: string;
}

/** 要載成貼圖嘅素材 key */
type TexKey = 'heroIdle' | 'heroWindup' | 'heroStrike' | 'foe';

/** 'r,g,b' → '#rrggbb' */
function rgbHex(rgb: string): string {
  return `#${rgb
    .split(',')
    .map((v) => Math.max(0, Math.min(255, Number(v))).toString(16).padStart(2, '0'))
    .join('')}`;
}
/** 精英描邊金、首領描邊朱砂（同演武台一致） */
const ELITE_RIM_HEX = '#E3C46A';
const BOSS_RIM_HEX = '#D6402C';

/**
 * 主角手上兵器（同演武台一樣：剪影已擦走畫死嘅刀，按裝備欄掛返兵器上去）。
 * grips：每格握點（剪影位圖像素，616×788）同方向（度，0＝向右，順時針正）。
 */
export interface DuelWeapon {
  src: string;
  /** 貼圖尺寸、握點、鋒尖（px） */
  w: number;
  h: number;
  grip: { x: number; y: number };
  tip: { x: number; y: number };
  /** 握點到鋒尖長度（剪影設計單位，主角全高 788） */
  length: number;
  grips: { idle: GripDef; windup: GripDef; strike: GripDef };
}
export interface GripDef {
  x: number;
  y: number;
  angle: number;
}

type HeroPose = 'idle' | 'windup' | 'strike';
const SIL_W = 616;
const SIL_H = 788;

const INK = '#1C1A17';
const CINNABAR = '#A33A32';
/** 人物比例同演武台一樣（玩家要求 2026-10-08）：身高約畫面闊度四分一，兩人相距約半個畫面 */
const FIGHTER_H = 1.25;
/** 筆觸、墨濺跟人物比例縮 */
const FX_SCALE = 0.5;
const ASPECT = 616 / 788;
const HERO_X = -1.1;
const FOE_X = 1.0;
const GROUND_Y = -0.85;

interface Fighter {
  mesh: THREE.Mesh;
  mat: THREE.ShaderMaterial;
  baseX: number;
  h: number;
}

export class DuelDirector {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(35, 1, 0.1, 60);
  private cam = { z: 12.5, y: 0.55, shake: 0 };
  private particles: ParticleSystem;
  private hero!: Fighter;
  /** 兵器：掛喺主角平面上，按姿勢換握點 */
  private weapon: { pivot: THREE.Group; mat: THREE.ShaderMaterial; def: DuelWeapon } | null = null;
  private weaponTex: THREE.Texture | null = null;
  private foe!: Fighter;
  private tex: Record<TexKey, THREE.Texture> = {} as Record<TexKey, THREE.Texture>;
  private mists: THREE.ShaderMaterial[] = [];
  /** 敵人特性光霧（精英淡、首領濃；蓄力時暴漲） */
  private traitMist: THREE.ShaderMaterial | null = null;
  private traitMistBase = 0;
  private splashTex: THREE.Texture | null = null;
  private tl: gsap.core.Timeline | null = null;
  private raf = 0;
  private last = 0;
  private cssW = 1;
  private cssH = 1;
  private disposed = false;
  /** 基本速度（×1／×2／長戰）× 慢鏡 */
  private baseScale: number = 1;
  private slow = 1;
  private freezeTimer: ReturnType<typeof setTimeout> | null = null;
  private seed = 1;
  /** 開發用：截圖時放慢成場（window.__duel.debugSlow(0.2)） */
  private debugMul = 1;

  constructor(
    private refs: DuelRefs,
    private replay: CombatReplay,
    private hits: DuelHit[],
    private assets: DuelAssets & { splash: string; weapon?: DuelWeapon | null },
    private cb: DuelCallbacks,
  ) {
    this.renderer = new THREE.WebGLRenderer({ canvas: refs.gl, alpha: true, antialias: true, premultipliedAlpha: false });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.particles = new ParticleSystem(refs.fx);
    this.particles.max = T.particleCap;
    if (hits.length > T.longFightHits) this.baseScale = T.longFightScale;
    this.tick = this.tick.bind(this);
    if (import.meta.env.DEV) {
      const w = window as unknown as { __duel?: DuelDirector; __duelSlow?: number };
      w.__duel = this;
      if (w.__duelSlow) this.debugMul = w.__duelSlow;
    }
    void this.init();
  }

  // ------------------------------------------------------------ 載入 ---

  private async init() {
    const loader = new THREE.TextureLoader();
    const load = (src: string) =>
      loader.loadAsync(src).then((t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 4;
        return t;
      });
    try {
      const [heroIdle, heroWindup, heroStrike, foe, splash] = await Promise.all([
        load(this.assets.heroIdle),
        load(this.assets.heroWindup),
        load(this.assets.heroStrike),
        load(this.assets.foe),
        load(this.assets.splash),
      ]);
      if (this.disposed) return;
      this.tex = { heroIdle, heroWindup, heroStrike, foe };
      this.splashTex = splash;
      // 兵器圖載唔到就空手，唔影響演出
      if (this.assets.weapon) this.weaponTex = await load(this.assets.weapon.src).catch(() => null);
      if (this.disposed) return;
    } catch {
      if (!this.disposed) this.cb.onFail();
      return;
    }
    this.buildScene();
    this.resize();
    this.buildTimeline();
    this.raf = requestAnimationFrame(this.tick);
  }

  private buildScene() {
    // 墨霧：後面一層、地面一層
    const back = mistMaterial(INK, 1.3);
    const ground = mistMaterial(INK, 4.1);
    const m1 = new THREE.Mesh(new THREE.PlaneGeometry(13, 5.5), back);
    m1.position.set(0, 0.3, -2.5);
    const m2 = new THREE.Mesh(new THREE.PlaneGeometry(11, 2.2), ground);
    m2.position.set(0, GROUND_Y + 0.1, 0.6);
    this.scene.add(m1, m2);
    this.mists = [back, ground];

    const boss = Boolean(this.replay.foeBoss);
    this.hero = this.makeFighter(this.tex.heroIdle, HERO_X, FIGHTER_H, false);
    this.foe = this.makeFighter(this.tex.foe, FOE_X, FIGHTER_H * (boss ? 1.25 : 1), false);
    this.hero.mat.uniforms.uDissolve!.value = 1;
    this.foe.mat.uniforms.uDissolve!.value = 1;
    this.dressFoe();
    this.attachWeapon();
  }

  /** 第 20 項敵人層級：精英金邊、首領朱砂邊；衣帶點綴色；特性光霧 */
  private dressFoe() {
    const r = this.replay;
    const tier = r.foeTier ?? (r.foeBoss ? 'boss' : 'minion');
    const u = this.foe.mat.uniforms;
    if (tier !== 'minion') {
      (u.uRim!.value as THREE.Color).set(tier === 'boss' ? BOSS_RIM_HEX : ELITE_RIM_HEX);
      u.uRimAmt!.value = tier === 'boss' ? 1 : 0.85;
    }
    if (this.assets.foeAccent) {
      (u.uAccent!.value as THREE.Color).set(rgbHex(this.assets.foeAccent));
      u.uAccentAmt!.value = 0.85;
    }
    if (r.foeTrait && tier !== 'minion') {
      const mat = mistMaterial(rgbHex(FOE_TRAITS[r.foeTrait].rgb), 2.7);
      mat.uniforms.uAmt!.value = 0;
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.2, this.foe.h * 1.25), mat);
      mesh.position.set(FOE_X, GROUND_Y + this.foe.h * 0.55, -0.15);
      this.scene.add(mesh);
      this.mists.push(mat);
      this.traitMist = mat;
      this.traitMistBase = tier === 'boss' ? 0.75 : 0.42;
    }
  }

  /** 兵器平面：握點對正呢格嘅手，沿兵器方向擺（座標換算同演武台 HERO_WEAPON_GRIPS 一致） */
  private attachWeapon() {
    const def = this.assets.weapon;
    if (!def || !this.weaponTex) return;
    const H = this.hero.h;
    const worldLen = (def.length / SIL_H) * H;
    const s = worldLen / Math.max(1, def.tip.y - def.grip.y); // 每 px 幾多世界單位
    const mat = fighterMaterial(this.weaponTex, false);
    mat.uniforms.uBleed!.value = 0.2;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(def.w * s, def.h * s), mat);
    // 握點喺 pivot 原點；貼圖「向下」＝由握點去鋒尖
    mesh.position.set((def.w / 2 - def.grip.x) * s, -(def.h / 2 - def.grip.y) * s, 0);
    const pivot = new THREE.Group();
    pivot.add(mesh);
    pivot.position.z = 0.01;
    this.hero.mesh.add(pivot);
    this.weapon = { pivot, mat, def };
    this.setWeaponPose('idle');
  }

  private setWeaponPose(pose: HeroPose) {
    const w = this.weapon;
    if (!w) return;
    const g = w.def.grips[pose];
    const H = this.hero.h;
    const W = H * ASPECT;
    w.pivot.position.x = (g.x / SIL_W - 0.5) * W;
    w.pivot.position.y = (0.5 - g.y / SIL_H) * H;
    // 畫布角度（y 向下、順時針）→ Three（y 向上）：令貼圖 −y 軸指向兵器方向
    w.pivot.rotation.z = Math.PI / 2 - (g.angle * Math.PI) / 180;
  }

  private makeFighter(tex: THREE.Texture, x: number, h: number, flip: boolean): Fighter {
    const mat = fighterMaterial(tex, flip);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(h * ASPECT, h), mat);
    mesh.position.set(x, GROUND_Y + h / 2, 0);
    this.scene.add(mesh);
    return { mesh, mat, baseX: x, h };
  }

  resize() {
    const r = this.refs.root.getBoundingClientRect();
    this.cssW = Math.max(1, r.width);
    this.cssH = Math.max(1, r.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(this.cssW, this.cssH, false);
    this.particles.resize(this.cssW, this.cssH, dpr);
    this.camera.aspect = this.cssW / this.cssH;
    // 窄屏：拉闊視角，兩個人都入鏡
    this.camera.fov = this.camera.aspect < 0.8 ? 50 : 36;
    this.camera.updateProjectionMatrix();
  }

  // ------------------------------------------------------------ 時間線 ---

  private buildTimeline() {
    const tl = gsap.timeline({ paused: true });
    this.tl = tl;
    // 開場：墨霧起、剪影由墨霧凝聚、鏡頭推近、題字（霧先濃後散）
    this.mists[0]!.uniforms.uAmt!.value = 0.7;
    this.mists[1]!.uniforms.uAmt!.value = 0.9;
    tl.to(this.mists[0]!.uniforms.uAmt!, { value: 0.22, duration: 1.1, ease: 'power1.inOut' }, 0);
    tl.to(this.mists[1]!.uniforms.uAmt!, { value: 0.38, duration: 1.1, ease: 'power1.inOut' }, 0.1);
    tl.to(this.hero.mat.uniforms.uDissolve!, { value: 0, duration: 0.85, ease: 'power2.out' }, 0.1);
    tl.to(this.foe.mat.uniforms.uDissolve!, { value: 0, duration: 0.85, ease: 'power2.out' }, 0.25);
    if (this.traitMist) tl.to(this.traitMist.uniforms.uAmt!, { value: this.traitMistBase, duration: 0.9 }, 0.5);
    tl.to(this.cam, { z: 10, duration: T.openSec, ease: 'power2.out' }, 0);
    tl.call(() => this.cb.onOpen(), [], 0.15);

    let t: number = T.openSec;
    const lastIdx = this.hits.length - 1;
    this.hits.forEach((h, k) => {
      const last = k === lastIdx;
      t = h.side === 'player' ? this.playerBeat(tl, t, h, k, last) : this.foeBeat(tl, t, h, k, last);
    });
    // 終結
    const outcome = this.replay.outcome;
    const lastHit = this.hits[lastIdx];
    const kind: 'win' | 'lose' | 'end' =
      outcome === 'lost' ? 'lose' : outcome === 'won' || outcome === 'resolve' ? 'win' : 'end';
    if (kind === 'win' && lastHit && lastHit.foeHp <= 0) {
      tl.to(this.foe.mat.uniforms.uDissolve!, { value: 1, duration: T.dissolveSec, ease: 'power1.in' }, t - 0.1);
      tl.call(() => this.inkBurst(this.foe, T.dissolveSparks), [], t - 0.05);
      t += T.dissolveSec * 0.6;
    }
    if (kind === 'lose') {
      tl.to(this.hero.mat.uniforms.uDissolve!, { value: 0.55, duration: T.dissolveSec }, t - 0.1);
      tl.to(this.refs.fade, { opacity: 1, duration: 0.8 }, t - 0.1);
    }
    tl.call(() => this.cb.onFinale(kind), [], t + 0.1);
    tl.to(this.mists[0]!.uniforms.uAmt!, { value: 0.4, duration: 1 }, t);
    tl.call(() => this.cb.onDone(), [], t + T.endHoldSec);
    this.applyScale();
    tl.play(0);
  }

  /** 玩家一招：蓄勢 → 揮擊（筆觸）→ 命中／落空 → 收勢；回傳下一個 beat 開始時間 */
  private playerBeat(tl: gsap.core.Timeline, t: number, h: DuelHit, k: number, last: boolean): number {
    const s = strokeForVol(h.vol);
    const hit = h.damage > 0;
    const crit = hit && (h.vol ?? 1) >= CRIT_FROM_VOL;
    const killing = last && h.foeHp <= 0;
    const hero = this.hero;
    const foe = this.foe;
    const strikeAt = t + T.windupSec;
    const impactAt = strikeAt + T.slashSec * 0.55;

    tl.call(() => this.cb.onBeat(k), [], t);
    // 蓄勢：墨氣聚手、身形一縮
    tl.call(() => this.setTex(hero, this.tex.heroWindup), [], t);
    tl.call(() => this.gatherQi(hero, s), [], t + 0.02);
    tl.fromTo(hero.mesh.scale, { x: 1, y: 1 }, { x: 1.06, y: 0.95, duration: T.windupSec, ease: 'power2.in' }, t);
    // 揮擊：衝前、筆觸畫出
    tl.call(() => this.setTex(hero, this.tex.heroStrike), [], strikeAt);
    tl.to(hero.mesh.scale, { x: 1, y: 1, duration: 0.12, ease: 'back.out(3)' }, strikeAt);
    tl.to(hero.mesh.position, { x: foe.baseX - 0.7, duration: 0.12, ease: 'power3.in' }, strikeAt - 0.04);
    if (killing) {
      // 終結一擊：慢鏡
      tl.call(() => this.setSlow(T.slowMoScale), [], strikeAt - 0.02);
      tl.call(() => this.setSlow(1), [], impactAt + T.slowMoSec * T.slowMoScale);
    }
    tl.call(() => this.slash(s, foe, !hit, false), [], strikeAt);
    // 命中
    if (hit) {
      tl.call(() => this.impact(foe, h, s, crit, k), [], impactAt);
      for (const f of h.traitFx ?? []) {
        tl.call(() => this.traitSeal(f.kind === 'thorns' ? hero : foe, f.kind, f.value), [], impactAt + 0.05);
      }
      tl.to(foe.mesh.position, { x: foe.baseX + (crit ? 0.3 : 0.18), duration: 0.1, ease: 'power2.out' }, impactAt);
      tl.to(foe.mesh.rotation, { z: -0.12, duration: 0.1 }, impactAt);
      tl.to(foe.mat.uniforms.uTintAmt!, { value: 0.85, duration: 0.05 }, impactAt);
      tl.to(foe.mat.uniforms.uTintAmt!, { value: 0, duration: 0.3 }, impactAt + 0.08);
      if (!killing) {
        tl.to(foe.mesh.position, { x: foe.baseX, duration: 0.28, ease: 'power2.inOut' }, impactAt + 0.16);
        tl.to(foe.mesh.rotation, { z: 0, duration: 0.28 }, impactAt + 0.16);
      }
    } else {
      // 落空：敵人側身閃開
      tl.call(() => this.missText(foe, k), [], impactAt);
      tl.to(foe.mesh.position, { x: foe.baseX + 0.25, y: GROUND_Y + foe.h / 2 + 0.06, duration: 0.12, ease: 'power2.out' }, impactAt - 0.06);
      tl.to(foe.mesh.position, { x: foe.baseX, y: GROUND_Y + foe.h / 2, duration: 0.26, ease: 'power2.inOut' }, impactAt + 0.12);
    }
    // 收勢
    const back = t + T.playerBeatSec - 0.2;
    tl.call(() => this.setTex(hero, this.tex.heroIdle), [], back);
    tl.to(hero.mesh.position, { x: hero.baseX, duration: 0.2, ease: 'power2.out' }, back);
    let end = t + T.playerBeatSec;
    if (crit) end += T.hitStopSec;
    if (killing) end += T.slowMoSec;
    return end;
  }

  /** 敵人還手：撲前、反方向細筆觸、主角後仰 */
  private foeBeat(tl: gsap.core.Timeline, t0: number, h: DuelHit, k: number, last: boolean): number {
    const hit = h.damage > 0;
    const hero = this.hero;
    const foe = this.foe;
    // 蓄力重擊：先原地蓄勢（特性光霧暴漲、身形鼓起、印「蓄」），再撲
    const charged = Boolean(h.traitFx?.some((f) => f.kind === 'charge'));
    const t = charged ? t0 + T.chargeSec : t0;
    if (charged) {
      tl.call(() => this.traitSeal(foe, 'charge'), [], t0);
      if (this.traitMist) {
        tl.to(this.traitMist.uniforms.uAmt!, { value: 1.6, duration: T.chargeSec * 0.8, ease: 'power2.in' }, t0);
        tl.to(this.traitMist.uniforms.uAmt!, { value: this.traitMistBase, duration: 0.4 }, t + 0.2);
      }
      tl.fromTo(foe.mesh.scale, { x: 1, y: 1 }, { x: 1.1, y: 1.06, duration: T.chargeSec, ease: 'power2.in' }, t0);
      tl.to(foe.mesh.scale, { x: 1, y: 1, duration: 0.14, ease: 'back.out(3)' }, t);
    }
    const strikeAt = t + 0.14;
    const impactAt = strikeAt + 0.1;
    tl.call(() => this.cb.onBeat(k), [], t);
    tl.to(foe.mesh.position, { x: hero.baseX + 0.72, duration: 0.16, ease: 'power3.in' }, t);
    tl.to(foe.mesh.rotation, { z: 0.08, duration: 0.16 }, t);
    tl.call(() => this.slash(FOE_STROKE, hero, !hit, true), [], strikeAt);
    if (hit) {
      tl.call(() => this.impact(hero, h, FOE_STROKE, false, k, true), [], impactAt);
      tl.to(hero.mesh.rotation, { z: 0.16, duration: 0.09, ease: 'power2.out' }, impactAt);
      tl.to(hero.mesh.position, { x: hero.baseX - 0.15, duration: 0.09 }, impactAt);
      tl.to(hero.mat.uniforms.uTintAmt!, { value: 0.9, duration: 0.05 }, impactAt);
      tl.to(hero.mat.uniforms.uTintAmt!, { value: 0, duration: 0.32 }, impactAt + 0.08);
      tl.to(hero.mesh.rotation, { z: 0, duration: 0.3, ease: 'power2.inOut' }, impactAt + 0.14);
      tl.to(hero.mesh.position, { x: hero.baseX, duration: 0.3 }, impactAt + 0.14);
    } else {
      tl.call(() => this.missText(hero, k), [], impactAt);
      tl.to(hero.mesh.position, { x: hero.baseX - 0.22, y: GROUND_Y + hero.h / 2 + 0.05, duration: 0.12 }, impactAt - 0.05);
      tl.to(hero.mesh.position, { x: hero.baseX, y: GROUND_Y + hero.h / 2, duration: 0.24 }, impactAt + 0.12);
    }
    tl.to(foe.mesh.position, { x: foe.baseX, duration: 0.22, ease: 'power2.out' }, impactAt + 0.12);
    tl.to(foe.mesh.rotation, { z: 0, duration: 0.22 }, impactAt + 0.12);
    // 其他特性：狂怒／噬血／連擊喺命中嗰下印出
    for (const f of h.traitFx ?? []) {
      if (f.kind === 'charge') continue;
      if (f.kind === 'enrage') {
        if (this.enrageShown) continue;
        this.enrageShown = true;
      }
      tl.call(() => this.traitSeal(foe, f.kind, f.value), [], impactAt + 0.04);
    }
    void last;
    return t + T.foeBeatSec + (h.traitFx?.some((f) => f.kind === 'combo') ? 0.18 : 0);
  }

  // ------------------------------------------------------------ 特效 ---

  private setTex(f: Fighter, tex: THREE.Texture) {
    f.mat.uniforms.map!.value = tex;
    if (f === this.hero) {
      this.setWeaponPose(tex === this.tex.heroWindup ? 'windup' : tex === this.tex.heroStrike ? 'strike' : 'idle');
    }
  }

  /** 世界座標 → 畫面 CSS 座標 */
  private toScreen(x: number, y: number, z = 0): { x: number; y: number } {
    const p = new THREE.Vector3(x, y, z).project(this.camera);
    return { x: (p.x * 0.5 + 0.5) * this.cssW, y: (-p.y * 0.5 + 0.5) * this.cssH };
  }

  private chest(f: Fighter): { x: number; y: number } {
    return this.toScreen(f.mesh.position.x, f.mesh.position.y + f.h * 0.08);
  }

  /** 蓄勢：墨點由四周吸入主角手位 */
  private gatherQi(f: Fighter, s: VolumeStroke) {
    const p = this.toScreen(f.mesh.position.x + 0.22, f.mesh.position.y + f.h * 0.12);
    this.particles.attract(p.x, p.y, 10, [INK, s.color], 80, 10);
  }

  /** 揮擊筆觸：按卷別形狀，喺目標身上畫出再淡走 */
  private slash(s: VolumeStroke, target: Fighter, miss: boolean, mirror: boolean) {
    const paths = strokePaths(s, mirror);
    const scale = (mirror ? 0.75 : 1) * FX_SCALE;
    paths.forEach((path, i) => {
      const b: BrushMesh = brushMesh(path, s, (this.seed += 1.7));
      b.mesh.position.set(target.mesh.position.x, target.mesh.position.y + (miss ? target.h * 0.42 : 0.05), 0.4 + i * 0.01);
      b.mesh.scale.setScalar(scale);
      this.scene.add(b.mesh);
      const u = b.mat.uniforms;
      const tl = gsap.timeline({ onComplete: () => this.dropMesh(b) });
      tl.timeScale(this.effectiveScale());
      tl.to(u.uHead!, { value: 1.4, duration: T.slashSec, ease: 'power3.out' }, i * 0.07);
      tl.to(u.uOpacity!, { value: 0, duration: 0.35, ease: 'power1.in' }, i * 0.07 + T.slashSec * 0.8);
    });
  }

  private dropMesh(b: BrushMesh) {
    this.scene.remove(b.mesh);
    b.mesh.geometry.dispose();
    b.mat.dispose();
  }

  /** 命中：墨濺、墨點、傷害數字；暴擊加 hit-stop、全屏墨暈、震屏 */
  private impact(f: Fighter, h: DuelHit, s: VolumeStroke, crit: boolean, k: number, onHero = false) {
    this.cb.onImpact(k);
    const c = this.chest(f);
    // 墨濺（位圖）
    if (this.splashTex) {
      const mat = new THREE.MeshBasicMaterial({ map: this.splashTex, transparent: true, depthWrite: false, color: crit ? CINNABAR : '#ffffff' });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1.6 * FX_SCALE, 1.5 * FX_SCALE), mat);
      m.position.set(f.mesh.position.x, f.mesh.position.y + f.h * 0.08, 0.5);
      m.rotation.z = Math.random() * Math.PI * 2;
      m.scale.setScalar(0.3);
      this.scene.add(m);
      const big = crit ? 1.9 : onHero ? 0.95 : 1.3;
      gsap.timeline({ onComplete: () => { this.scene.remove(m); m.geometry.dispose(); mat.dispose(); } })
        .timeScale(this.effectiveScale())
        .to(m.scale, { x: big, y: big, duration: 0.22, ease: 'power3.out' })
        .to(mat, { opacity: 0, duration: 0.4, ease: 'power1.in' }, 0.12);
    }
    this.particles.sparks(c.x, c.y, crit ? T.hitSparks * 2 : onHero ? T.hitSparks * 0.6 : T.hitSparks, s.sparks, crit ? 13 : 9, 0.22);
    if (crit) this.particles.shockwave(c.x, c.y, 150, CINNABAR, 0.6);
    this.number(c, h.damage, crit ? 'crit' : onHero ? 'hurt' : 'hit');
    this.cam.shake = Math.max(this.cam.shake, crit ? T.critShake : T.shake * (onHero ? 0.7 : 1));
    if (crit) {
      this.freeze(T.hitStopSec);
      gsap.fromTo(this.refs.wash, { opacity: T.critWashMax }, { opacity: 0, duration: 0.55, ease: 'power2.out' });
    }
  }

  private enrageShown = false;

  /**
   * 特性圓印（DOM＋GSAP）：特性色實心圓配單字，喺敵人（或者反震時喺主角）胸前彈出；
   * 再配一圈特性色墨點。噬血加綠色回血數字、反震加主角紅色扣血數字。
   */
  private traitSeal(f: Fighter, kind: keyof typeof FOE_TRAITS, value = 0) {
    const def = FOE_TRAITS[kind];
    const hex = rgbHex(def.rgb);
    const c = this.chest(f);
    const at = { x: c.x + (f === this.foe ? 26 : -20), y: c.y - f.h * 34 };
    const el = document.createElement('span');
    el.dataset.kind = 'trait';
    el.textContent = def.glyph;
    el.style.left = `${at.x}px`;
    el.style.top = `${at.y}px`;
    el.style.setProperty('--trait', hex);
    this.refs.numbers.appendChild(el);
    gsap
      .timeline({ onComplete: () => el.remove() })
      .timeScale(this.effectiveScale())
      .fromTo(el, { xPercent: -50, yPercent: -50, scale: 2.4, opacity: 0, rotation: -14 }, { scale: 1, opacity: 1, rotation: -4, duration: 0.24, ease: 'back.out(2.4)' })
      .to(el, { y: -26, opacity: 0, duration: 0.5, ease: 'power1.in' }, 0.75);
    this.particles.sparks(c.x, c.y, kind === 'charge' ? 28 : 18, [hex, INK], 10, 0.12);
    if (kind === 'charge') {
      this.particles.shockwave(c.x, c.y, 120, hex, 0.5);
      this.cam.shake = Math.max(this.cam.shake, T.critShake);
    }
    if (kind === 'drain' && value > 0) this.number({ x: c.x + 30, y: c.y + 10 }, value, 'heal');
    if (kind === 'thorns' && value > 0) this.number({ x: c.x - 10, y: c.y + 20 }, value, 'hurt');
  }

  private missText(f: Fighter, _k: number) {
    const c = this.chest(f);
    this.number({ x: c.x, y: c.y - 30 }, 0, 'miss');
  }

  /** 傷害數字：DOM，GSAP 彈出飄走 */
  private number(at: { x: number; y: number }, dmg: number, kind: 'hit' | 'crit' | 'hurt' | 'miss' | 'heal') {
    const el = document.createElement('span');
    el.dataset.kind = kind;
    el.textContent = kind === 'miss' ? '落空' : `${kind === 'hurt' ? '－' : kind === 'heal' ? '＋' : ''}${dmg}`;
    el.style.left = `${at.x}px`;
    el.style.top = `${at.y}px`;
    this.refs.numbers.appendChild(el);
    const big = kind === 'crit' ? 1.5 : 1;
    gsap
      .timeline({ onComplete: () => el.remove() })
      .timeScale(this.effectiveScale())
      .fromTo(el, { xPercent: -50, yPercent: -50, scale: 0.4 * big, opacity: 0 }, { scale: 1.15 * big, opacity: 1, y: -18, duration: 0.18, ease: 'back.out(3)' })
      .to(el, { scale: big, duration: 0.12 })
      .to(el, { y: -62, opacity: 0, duration: 0.55, ease: 'power1.in' }, 0.45);
  }

  /** 敵人化墨散開：大量墨點向上飄 */
  private inkBurst(f: Fighter, n: number) {
    const c = this.chest(f);
    for (let i = 0; i < n; i++) {
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
      const sp = 1.5 + Math.random() * 4;
      this.particles.add({
        x: c.x + (Math.random() - 0.5) * 60,
        y: c.y + (Math.random() - 0.3) * 90,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp,
        gravity: -0.02,
        drag: 0.97,
        size: 1.5 + Math.random() * 3.5,
        life: 1 + Math.random() * 0.8,
        maxLife: 1.8,
        color: Math.random() < 0.8 ? INK : CINNABAR,
      });
    }
  }

  // ------------------------------------------------------------ 速度 ---

  private effectiveScale() {
    return this.baseScale * this.slow * this.debugMul;
  }

  /** 開發用：放慢（截圖） */
  debugSlow(k: number) {
    this.debugMul = k;
    this.applyScale();
  }

  private applyScale() {
    this.tl?.timeScale(this.effectiveScale());
  }

  /** 加速 ×2（同長戰加速相乘） */
  setSpeed(mul: 1 | 2) {
    const long = this.hits.length > T.longFightHits ? T.longFightScale : 1;
    this.baseScale = long * mul;
    this.applyScale();
  }

  private setSlow(k: number) {
    this.slow = k;
    this.applyScale();
  }

  /** hit-stop：時間線停一停（真實時間），筆觸／數字照郁 */
  private freeze(sec: number) {
    if (!this.tl) return;
    this.tl.timeScale(0.0001);
    if (this.freezeTimer) clearTimeout(this.freezeTimer);
    this.freezeTimer = setTimeout(() => this.applyScale(), (sec * 1000) / (this.baseScale * this.debugMul));
  }

  // ------------------------------------------------------------ 每幀 ---

  private tick(now: number) {
    if (this.disposed) return;
    const dt = this.last ? Math.min(0.05, (now - this.last) / 1000) : 0;
    this.last = now;
    for (const m of this.mists) m.uniforms.uTime!.value += dt;
    // 震屏：每幀隨機抖、逐漸收
    const sh = this.cam.shake;
    this.cam.shake = Math.max(0, sh - dt * 1.6);
    this.camera.position.set((Math.random() - 0.5) * sh, this.cam.y + (Math.random() - 0.5) * sh, this.cam.z);
    this.camera.lookAt(0, 0.1, 0);
    // 兵器跟主角一齊受擊變紅、化墨
    if (this.weapon) {
      const hu = this.hero.mat.uniforms;
      const wu = this.weapon.mat.uniforms;
      wu.uTintAmt!.value = hu.uTintAmt!.value;
      wu.uDissolve!.value = hu.uDissolve!.value;
    }
    this.renderer.render(this.scene, this.camera);
    this.particles.step(dt * this.effectiveScale());
    this.particles.draw();
    this.raf = requestAnimationFrame(this.tick);
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    if (this.freezeTimer) clearTimeout(this.freezeTimer);
    this.tl?.kill();
    gsap.killTweensOf(this.refs.wash);
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      const mat = m.material as THREE.Material | undefined;
      mat?.dispose();
    });
    Object.values(this.tex).forEach((t) => t.dispose());
    this.weaponTex?.dispose();
    this.splashTex?.dispose();
    this.renderer.dispose();
  }
}
