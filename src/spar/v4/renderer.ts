/**
 * 演武台 v4 渲染（Canvas 2D 畫點陣圖層，唔畫路徑剪影）。
 *
 * 畫面由後到前：遠山 → 鎮屋 → 近景（按世界捲動做視差）→ 命中墨花 → 敵人（紅眼）→ 主角分層
 * （背層 → 袍〔按門派染色〕→ 前層 → 護甲 → 飾物 → 兵器〔掛手位、跟前臂角度〕→ 前手）
 * → 墨痕刀光 → 墨點（頭目加朱砂）→ 滴墨。季節飄落物喺背景之後、人物之前畫（唔遮人物）。
 * 鏡頭固定：唔推近、唔跟人、唔震屏、唔停格。
 */
import anchors from '@data/spar/anchors.generated.json';
import { ENEMY_CLIPS, HERO_CLIPS, clipDuration, clipFrameAt, type HeroClipId } from '@data/spar/clips';
import {
  BOSS_SCALE,
  ENEMY_SCALE,
  HERO_DESIGN_H,
  SEASON_DROPS,
  SPAR_FX,
  SPAR_LAYOUT,
  SPAR_WEAPONS,
} from '@data/spar/tuning';
import { HERO_LAYERS, imageNow, sparUrl } from './assets';
import type { SparDirector, SparHitInfo } from './director';
import type { SparLook } from './look';

const A = anchors as unknown as {
  scale: number;
  cell: { w: number; h: number; foot: [number, number]; enemyFoot: [number, number] };
  hero: Record<string, { hand: [number, number]; angle: number }[]>;
  enemy: Record<string, Record<string, { eye: [number, number] }[]>>;
  weapon: Record<string, { grip: [number, number]; len: number }>;
};

const INK = '#1C1A17';
const INK_WASH = '#6E6A63';
const CINNABAR = '#A33A32';

interface Dot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
  max: number;
  color: string;
  gravity: number;
}
interface Slash {
  style: string;
  x: number;
  y: number;
  w: number;
  angle: number;
  life: number;
  max: number;
}
interface Drop {
  x: number;
  y: number;
  vy: number;
  phase: number;
  size: number;
  rot: number;
}
interface Blot {
  x: number;
  y: number;
  r: number;
  life: number;
}

export class SparRenderer {
  private ctx: CanvasRenderingContext2D;
  private w = 1;
  private h = 1;
  private dpr = 1;
  private look: SparLook;
  private reduce: boolean;
  private dots: Dot[] = [];
  private slashes: Slash[] = [];
  private drops: Drop[] = [];
  private blots: Blot[] = [];
  private splashes: { x: number; y: number; life: number; max: number; s: number }[] = [];
  private dropAcc = 0;
  private bleedAcc = 0;
  private time = 0;
  /** 染色袍條圖快取：`${clip}|${color}` */
  private tinted = new Map<string, HTMLCanvasElement>();
  private scratch: HTMLCanvasElement | null = null;

  constructor(
    private canvas: HTMLCanvasElement,
    look: SparLook,
    opts: { reduceMotion: boolean },
  ) {
    this.ctx = canvas.getContext('2d')!;
    this.look = look;
    this.reduce = opts.reduceMotion;
    this.prefetch();
  }

  setLook(look: SparLook) {
    if (look.robe !== this.look.robe) this.tinted.clear();
    this.look = look;
    this.prefetch();
  }

  /** 先載當前外觀要用嘅圖（其餘用到先載） */
  private prefetch() {
    const L = this.look;
    for (const clip of Object.keys(HERO_CLIPS) as HeroClipId[]) {
      for (const layer of HERO_LAYERS) imageNow(sparUrl.hero(clip, layer));
    }
    for (const boss of [false, true]) {
      for (const c of Object.keys(ENEMY_CLIPS)) imageNow(sparUrl.enemy(boss, L.enemyTier, c as never));
    }
    if (L.weapon) imageNow(sparUrl.weapon(L.weapon));
    for (const s of ['arc', 'heavy', 'thrust', 'round', 'fist', 'ultimate'] as const) imageNow(sparUrl.slash(s));
    imageNow(sparUrl.drop(L.season));
    for (const layer of ['far', 'mid', 'near'] as const) imageNow(sparUrl.bg(L.place, layer));
    imageNow(sparUrl.splash());
  }

  resize(cssW: number, cssH: number, dpr: number) {
    this.w = Math.max(1, cssW);
    this.h = Math.max(1, cssH);
    this.dpr = dpr;
    this.canvas.width = Math.round(this.w * dpr);
    this.canvas.height = Math.round(this.h * dpr);
  }

  /** 每設計單位幾多 CSS px */
  ppd(): number {
    const want = Math.min(this.h * SPAR_LAYOUT.heroHeightFrac, this.w * SPAR_LAYOUT.heroWidthFrac);
    const px = Math.max(SPAR_LAYOUT.heroMinPx, Math.min(SPAR_LAYOUT.heroMaxPx, want));
    return px / HERO_DESIGN_H;
  }

  /** 舞台闊度（設計單位），畀導演 */
  widthDesign(): number {
    return this.w / this.ppd();
  }

  private groundY() {
    return this.h * SPAR_LAYOUT.groundY;
  }

  private enemyScale(boss: boolean) {
    return boss ? BOSS_SCALE * (ENEMY_SCALE[this.look.enemyTier] ?? 1) : (ENEMY_SCALE[this.look.enemyTier] ?? 1);
  }

  /** 敵人包圍盒（CSS px），撳敵人用 */
  enemyBox(d: SparDirector): { x: number; y: number; w: number; h: number } | null {
    const e = d.enemy;
    if (!e) return null;
    const k = this.ppd() * this.enemyScale(e.boss);
    const x = (e.x + e.knock) * this.ppd();
    const hgt = HERO_DESIGN_H * k * 1.05;
    return { x: x - 70 * k, y: this.groundY() - hgt, w: 150 * k, h: hgt };
  }

  hitTestEnemy(d: SparDirector, x: number, y: number): boolean {
    const b = this.enemyBox(d);
    if (!b) return false;
    const pad = 16;
    return x >= b.x - pad && x <= b.x + b.w + pad && y >= b.y - pad && y <= b.y + b.h + pad;
  }

  // ------------------------------------------------------------ 事件 ---

  /** 出手：墨痕刀光（跟兵器款式；大招用大撇） */
  onSwing(d: SparDirector, clip: HeroClipId) {
    const ppd = this.ppd();
    const spec = SPAR_WEAPONS[this.look.weapon ?? 'fist'];
    const style = clip === 'ultimate' ? 'ultimate' : spec.slash;
    const hx = d.heroX() * ppd;
    const gy = this.groundY();
    const reach = d.flags.reach * ppd;
    const angle = clip === 'combo' ? -0.35 : clip === 'ultimate' ? -0.05 : spec.slash === 'thrust' ? 0 : 0.32;
    const big = clip === 'ultimate' ? 1.7 : 1;
    this.slashes.push({
      style,
      x: hx + reach * 0.62,
      y: gy - HERO_DESIGN_H * ppd * (clip === 'ultimate' ? 0.5 : 0.56),
      w: reach * 1.05 * spec.slashScale * big,
      angle,
      life: 0,
      max: SPAR_FX.slashSec * (clip === 'ultimate' ? 1.6 : 1),
    });
  }

  /** 命中：墨花、墨點（頭目加朱砂）；回傳命中點（CSS px，飛修為字用） */
  onHit(info: SparHitInfo): { x: number; y: number } {
    const ppd = this.ppd();
    const k = this.enemyScale(info.boss);
    const x = info.enemyX * ppd - 10 * ppd;
    const y = this.groundY() - HERO_DESIGN_H * ppd * k * 0.58;
    const n = this.reduce ? 4 : SPAR_FX.inkDots * (info.clip === 'ultimate' ? 2 : 1);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 40 + Math.random() * 150;
      const life = 0.45 + Math.random() * 0.4;
      this.dots.push({
        x,
        y,
        vx: Math.cos(a) * s + 70,
        vy: Math.sin(a) * s - 40,
        r: 1 + Math.random() * 2.8,
        life,
        max: life,
        color: i % 3 ? INK : INK_WASH,
        gravity: 260,
      });
    }
    if (info.boss) {
      for (let i = 0; i < (this.reduce ? 3 : SPAR_FX.bossCinnabarDots); i++) {
        const a = Math.random() * Math.PI * 2;
        const s = 30 + Math.random() * 120;
        const life = 0.6 + Math.random() * 0.4;
        this.dots.push({ x, y, vx: Math.cos(a) * s + 50, vy: Math.sin(a) * s - 50, r: 1.6 + Math.random() * 2.4, life, max: life, color: CINNABAR, gravity: 200 });
      }
    }
    this.splashes.push({ x, y, life: 0, max: 0.5, s: (info.clip === 'ultimate' ? 1.6 : 1) * k });
    return { x, y };
  }

  /** 敵人潰散：化成墨點散開 */
  private scatter(x: number, y: number, k: number) {
    const n = this.reduce ? 6 : 26;
    for (let i = 0; i < n; i++) {
      const life = 0.5 + Math.random() * 0.5;
      this.dots.push({
        x: x + (Math.random() - 0.5) * 60 * k,
        y: y + (Math.random() - 0.5) * 120 * k,
        vx: 40 + Math.random() * 90,
        vy: -30 - Math.random() * 60,
        r: 1 + Math.random() * 3,
        life,
        max: life,
        color: i % 4 ? INK_WASH : INK,
        gravity: -20,
      });
    }
  }

  // ------------------------------------------------------------ 畫 ---

  render(d: SparDirector, dt: number) {
    const c = this.ctx;
    this.time += dt;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.clearRect(0, 0, this.w, this.h);
    const ppd = this.ppd();
    this.drawBackground(d.scroll * ppd);
    this.stepFx(dt, d);
    // 飄落物喺人物後面：唔會遮住主角同敵人
    this.drawDrops(dt);
    this.drawSplashes();
    if (d.enemy) this.drawEnemy(d, ppd);
    this.drawHero(d, ppd);
    this.drawSlashes();
    this.drawDots();
  }

  private drawBackground(scrollPx: number) {
    const c = this.ctx;
    const P = SPAR_LAYOUT.parallax;
    for (const [layer, k] of [
      ['far', P.far],
      ['mid', P.mid],
      ['near', P.near],
    ] as const) {
      const img = imageNow(sparUrl.bg(this.look.place, layer));
      if (!img) continue;
      const th = this.h;
      const tw = (img.width / img.height) * th;
      let x = -((scrollPx * k) % tw);
      if (x > 0) x -= tw;
      for (; x < this.w; x += tw) c.drawImage(img, x, 0, tw, th);
    }
  }

  private cellRect(ppd: number, foot: [number, number], fx: number, fy: number, scale = 1) {
    const w = A.cell.w * ppd * scale;
    const h = A.cell.h * ppd * scale;
    return { x: fx - foot[0] * ppd * scale, y: fy - foot[1] * ppd * scale, w, h };
  }

  private frameSrc(img: HTMLImageElement | HTMLCanvasElement, frames: number, i: number) {
    const fw = img.width / frames;
    return { sx: fw * i, sw: fw, sh: img.height };
  }

  private tintedRobe(clip: HeroClipId, img: HTMLImageElement): HTMLCanvasElement {
    const key = `${clip}|${this.look.robe}`;
    let cv = this.tinted.get(key);
    if (cv) return cv;
    cv = document.createElement('canvas');
    cv.width = img.width;
    cv.height = img.height;
    const x = cv.getContext('2d')!;
    x.drawImage(img, 0, 0);
    x.globalCompositeOperation = 'multiply';
    x.fillStyle = this.look.robe;
    x.fillRect(0, 0, cv.width, cv.height);
    x.globalCompositeOperation = 'destination-in';
    x.drawImage(img, 0, 0);
    this.tinted.set(key, cv);
    return cv;
  }

  private drawHero(d: SparDirector, ppd: number) {
    const c = this.ctx;
    const clip = d.heroClip;
    const def = HERO_CLIPS[clip];
    const fi = clipFrameAt(def, d.heroT);
    const fx = d.heroX() * ppd;
    const fy = this.groundY();
    const r = this.cellRect(ppd, A.cell.foot, fx, fy);
    c.save();
    // 頭／身重傷：微微弓身（以腳底為軸）
    if (this.look.hunch) {
      c.translate(fx, fy);
      c.rotate(0.05);
      c.translate(-fx, -fy);
    }
    const draw = (img: HTMLImageElement | HTMLCanvasElement | null) => {
      if (!img) return;
      const s = this.frameSrc(img, def.frames, fi);
      c.drawImage(img, s.sx, 0, s.sw, s.sh, r.x, r.y, r.w, r.h);
    };
    draw(imageNow(sparUrl.hero(clip, 'back')));
    const robe = imageNow(sparUrl.hero(clip, 'robe'));
    if (robe) draw(this.tintedRobe(clip, robe));
    draw(imageNow(sparUrl.hero(clip, 'front')));
    if (this.look.armor) draw(imageNow(sparUrl.hero(clip, 'armor')));
    if (this.look.accessory) draw(imageNow(sparUrl.hero(clip, 'acc')));
    // 兵器：握點對準手位，沿前臂角度
    const a = A.hero[clip]?.[fi];
    if (this.look.weapon && a) {
      const img = imageNow(sparUrl.weapon(this.look.weapon));
      const spec = A.weapon[this.look.weapon];
      if (img && spec) {
        const hx = r.x + a.hand[0] * ppd;
        const hy = r.y + a.hand[1] * ppd;
        c.save();
        c.translate(hx, hy);
        c.rotate(a.angle);
        const k = ppd / A.scale;
        c.drawImage(img, -spec.grip[0] * ppd, -spec.grip[1] * ppd, img.width * k, img.height * k);
        c.restore();
      }
    }
    draw(imageNow(sparUrl.hero(clip, 'hand')));
    c.restore();
  }

  private drawEnemy(d: SparDirector, ppd: number) {
    const e = d.enemy!;
    const c = this.ctx;
    const def = ENEMY_CLIPS[e.clip];
    const fi = clipFrameAt(def, e.t);
    const key = `${e.boss ? 'boss' : 'enemy'}/t${this.look.enemyTier}`;
    const img = imageNow(sparUrl.enemy(e.boss, this.look.enemyTier, e.clip));
    const scale = this.enemyScale(e.boss);
    const fx = (e.x + e.knock) * ppd;
    const fy = this.groundY();
    const r = this.cellRect(ppd, A.cell.enemyFoot, fx, fy, scale);
    let alpha = 1;
    if (e.clip === 'enter') alpha = Math.min(1, e.t / clipDuration(def));
    if (e.clip === 'break') {
      const k = e.t / clipDuration(def);
      alpha = Math.max(0, 1 - Math.max(0, k - 0.45) / 0.55);
      if (fi === 4 && !(e as { scattered?: boolean }).scattered) {
        (e as { scattered?: boolean }).scattered = true;
        this.scatter(fx, fy - HERO_DESIGN_H * ppd * scale * 0.35, scale);
      }
    }
    c.save();
    c.globalAlpha = alpha;
    // 出場墨暈：淡墨圓由腳底化開
    if (e.clip === 'enter') {
      const k = e.t / clipDuration(def);
      c.globalAlpha = (1 - k) * 0.18;
      c.fillStyle = INK_WASH;
      c.beginPath();
      c.ellipse(fx, fy - 110 * ppd * scale, (30 + 50 * k) * ppd * scale, (80 + 60 * k) * ppd * scale, 0, 0, Math.PI * 2);
      c.fill();
      c.globalAlpha = alpha;
    }
    // 腳下淡墨投影
    c.fillStyle = 'rgba(28,26,23,0.16)';
    c.beginPath();
    c.ellipse(fx, fy + 2, 46 * ppd * scale, 7 * ppd * scale, 0, 0, Math.PI * 2);
    c.fill();
    if (img) {
      const s = this.frameSrc(img, def.frames, fi);
      if (e.clip === 'hit' && fi < 2) {
        // 受擊閃白
        const sc = this.scratchCanvas(Math.ceil(s.sw), Math.ceil(s.sh));
        const x = sc.getContext('2d')!;
        x.globalCompositeOperation = 'source-over';
        x.clearRect(0, 0, sc.width, sc.height);
        x.drawImage(img, s.sx, 0, s.sw, s.sh, 0, 0, s.sw, s.sh);
        x.globalCompositeOperation = 'source-atop';
        x.fillStyle = 'rgba(255,253,246,0.7)';
        x.fillRect(0, 0, sc.width, sc.height);
        c.drawImage(sc, 0, 0, s.sw, s.sh, r.x, r.y, r.w, r.h);
      } else {
        c.drawImage(img, s.sx, 0, s.sw, s.sh, r.x, r.y, r.w, r.h);
      }
    }
    // 紅眼殺氣（潰散時熄）
    const eye = A.enemy[key]?.[e.clip]?.[fi]?.eye;
    if (eye && e.clip !== 'break') {
      const ex = r.x + eye[0] * ppd * scale;
      const ey = r.y + eye[1] * ppd * scale;
      const pulse = this.reduce ? 0.8 : 0.6 + 0.4 * Math.sin(this.time * 6);
      const g = c.createRadialGradient(ex, ey, 0, ex, ey, 7 * ppd * scale + 3);
      g.addColorStop(0, `rgba(214,60,44,${0.95 * pulse})`);
      g.addColorStop(0.4, `rgba(190,50,38,${0.5 * pulse})`);
      g.addColorStop(1, 'rgba(190,50,38,0)');
      c.fillStyle = g;
      c.beginPath();
      c.arc(ex, ey, 7 * ppd * scale + 3, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  }

  private scratchCanvas(w: number, h: number) {
    if (!this.scratch) this.scratch = document.createElement('canvas');
    if (this.scratch.width < w) this.scratch.width = w;
    if (this.scratch.height < h) this.scratch.height = h;
    return this.scratch;
  }

  private drawSplashes() {
    const img = imageNow(sparUrl.splash());
    if (!img) return;
    const c = this.ctx;
    for (const s of this.splashes) {
      const k = s.life / s.max;
      const size = (40 + 50 * Math.min(1, k * 3)) * s.s;
      c.globalAlpha = 0.5 * (1 - k);
      c.drawImage(img, s.x - size / 2, s.y - size / 2, size, size);
    }
    c.globalAlpha = 1;
  }

  private drawSlashes() {
    const c = this.ctx;
    for (const s of this.slashes) {
      const img = imageNow(sparUrl.slash(s.style as never));
      if (!img) continue;
      const k = s.life / s.max;
      // 筆由左到右寫出（前 40%），之後淡走
      const reveal = Math.min(1, k / 0.4);
      const fade = k < 0.5 ? 1 : 1 - (k - 0.5) / 0.5;
      const h = s.w * (img.height / img.width);
      c.save();
      c.translate(s.x, s.y);
      c.rotate(s.angle);
      c.globalAlpha = 0.92 * fade;
      c.drawImage(img, 0, 0, img.width * reveal, img.height, -s.w / 2, -h / 2, s.w * reveal, h);
      c.restore();
    }
  }

  private drawDots() {
    const c = this.ctx;
    for (const p of this.dots) {
      const a = Math.min(1, (p.life / p.max) * 1.5);
      c.globalAlpha = a * 0.18;
      c.fillStyle = p.color;
      c.beginPath();
      c.arc(p.x, p.y, p.r * 2.6, 0, Math.PI * 2);
      c.fill();
      c.globalAlpha = a;
      c.beginPath();
      c.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      c.fill();
    }
    for (const b of this.blots) {
      c.globalAlpha = Math.min(0.5, b.life) * 0.6;
      c.fillStyle = CINNABAR;
      c.beginPath();
      c.ellipse(b.x, b.y, b.r * 1.6, b.r * 0.5, 0, 0, Math.PI * 2);
      c.fill();
    }
    c.globalAlpha = 1;
  }

  private drawDrops(dt: number) {
    const img = imageNow(sparUrl.drop(this.look.season));
    if (!img || this.reduce) return;
    const spec = SEASON_DROPS[this.look.season];
    const c = this.ctx;
    this.dropAcc += dt * spec.perSec;
    while (this.dropAcc >= 1 && this.drops.length < 40) {
      this.dropAcc -= 1;
      this.drops.push({
        x: Math.random() * this.w,
        y: spec.fall > 0 ? -10 : this.h * (0.3 + Math.random() * 0.6),
        vy: spec.fall * this.h * (0.7 + Math.random() * 0.6),
        phase: Math.random() * Math.PI * 2,
        size: spec.size * this.h * (0.7 + Math.random() * 0.6),
        rot: Math.random() * Math.PI,
      });
    }
    this.drops = this.drops.filter((p) => p.y < this.h + 20 && p.y > -30 && p.x > -30 && p.x < this.w + 30);
    for (const p of this.drops) {
      p.phase += dt * 1.6;
      p.y += p.vy * dt;
      p.x += Math.sin(p.phase) * spec.sway * 20 * dt - 6 * dt;
      p.rot += dt * spec.sway;
      c.save();
      c.translate(p.x, p.y);
      c.rotate(p.rot);
      c.globalAlpha = spec.sprite === 'firefly' ? 0.5 + 0.5 * Math.sin(p.phase * 3) : 0.85;
      c.drawImage(img, -p.size / 2, -p.size / 2, p.size, p.size);
      c.restore();
    }
    c.globalAlpha = 1;
  }

  private stepFx(dt: number, d: SparDirector) {
    for (const p of this.dots) {
      p.life -= dt;
      p.vy += p.gravity * dt;
      p.vx *= Math.pow(0.9, dt * 10);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    this.dots = this.dots.filter((p) => p.life > 0);
    for (const s of this.slashes) s.life += dt;
    this.slashes = this.slashes.filter((s) => s.life < s.max);
    for (const s of this.splashes) s.life += dt;
    this.splashes = this.splashes.filter((s) => s.life < s.max);
    for (const b of this.blots) b.life -= dt * 0.4;
    this.blots = this.blots.filter((b) => b.life > 0);
    // 流血滴墨：由腰間落地，喺地上化開一點朱墨
    if (this.look.bleeding && !this.reduce) {
      this.bleedAcc += dt * SPAR_FX.bleedPerSec;
      while (this.bleedAcc >= 1) {
        this.bleedAcc -= 1;
        const ppd = this.ppd();
        const x = d.heroX() * ppd + (Math.random() * 10 - 2) * ppd;
        const y = this.groundY() - HERO_DESIGN_H * ppd * 0.42;
        this.dots.push({ x, y, vx: 0, vy: 30, r: 1.6, life: 0.5, max: 0.5, color: CINNABAR, gravity: 500 });
        this.blots.push({ x: x + 2, y: this.groundY() - 1, r: 2 + Math.random() * 2, life: 1.2 });
      }
    }
  }
}
