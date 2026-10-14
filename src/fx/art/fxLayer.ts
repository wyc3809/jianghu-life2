/**
 * 外功特效層：將招式編排嘅 FxSpawn 變成位圖粒子，畫喺一個 2D canvas 上。
 * 演武台（src/spar/engine.ts）同 3D 自動交手（duel/director.ts 嘅 fx 疊層）共用。
 * 位置由畫面每幀提供嘅錨點（css px）決定；粒子本身只記 H 單位嘅偏移同速度。
 * 唔用 Math.random：隨機由呼叫者傳入嘅 seeded RNG 決定。
 */
import type { ArtSpriteKey, FxAnchor, FxSpawn } from './choreo';

export interface Pt {
  x: number;
  y: number;
}

/** 錨點（css px，y 向下）；unitH＝一個身高幾多 px */
export interface FxAnchors extends Record<FxAnchor, Pt> {
  unitH: number;
}

export interface SpriteLike {
  width: number;
  height: number;
}

interface Live {
  spec: FxSpawn;
  /** 由 spawn 起計；過咗 delay 先出現 */
  age: number;
  delay: number;
  /** 起點（css px） */
  x0: number;
  y0: number;
  /** 而家位置 */
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot0: number;
  ang: number;
  floorY: number | null;
}

export class ArtFxLayer {
  private items: Live[] = [];
  /** 特效位圖放大（演武台人物細，特效要大啲先睇得清） */
  sizeMul = 1;

  constructor(private rng: () => number) {}

  get count(): number {
    return this.items.length;
  }

  clear() {
    this.items = [];
  }

  /** 按當刻錨點生出粒子；quiet（減少動態）時粒數減半 */
  spawn(spec: FxSpawn, a: FxAnchors, quiet = false) {
    const H = a.unitH;
    const base = a[spec.at];
    const n = Math.max(1, Math.round((spec.count ?? 1) * (quiet ? 0.5 : 1)));
    for (let i = 0; i < n; i++) {
      const r = (spec.spread ?? 0) * H * Math.sqrt(this.rng());
      const th = this.rng() * Math.PI * 2;
      const x0 = base.x + (spec.dx ?? 0) * H + (n > 1 ? Math.cos(th) * r : 0);
      const y0 = base.y - (spec.dy ?? 0) * H + (n > 1 ? Math.sin(th) * r * 0.6 : 0);
      const vs = spec.vSpread ?? 0;
      this.items.push({
        spec,
        age: 0,
        delay: i * (spec.stagger ?? 0),
        x0,
        y0,
        x: x0,
        y: y0,
        vx: ((spec.vx ?? 0) + (this.rng() - 0.5) * 2 * vs) * H,
        // 資料 vy 向上為正；畫面 y 向下
        vy: -((spec.vy ?? 0) + (this.rng() - 0.5) * 2 * vs) * H,
        rot0: ((spec.rot ?? 0) + (this.rng() - 0.5) * 2 * (spec.rotSpread ?? 0)) * (Math.PI / 180),
        ang: 0,
        floorY: spec.floorDy !== undefined ? base.y - spec.floorDy * H : null,
      });
    }
  }

  /** 推進 dt 秒；to 目標用而家嘅錨點（敵人被打飛都追得到） */
  step(dt: number, a: FxAnchors) {
    const H = a.unitH;
    const keep: Live[] = [];
    for (const it of this.items) {
      it.age += dt;
      const t = it.age - it.delay;
      if (t > it.spec.life) continue;
      keep.push(it);
      if (t < 0) continue;
      const s = it.spec;
      if (s.to) {
        const p = Math.min(1, t / s.life);
        const tgt = a[s.to];
        const lift = (s.arc ?? 0) * H * 4 * p * (1 - p);
        const nx = it.x0 + (tgt.x - it.x0) * p;
        const ny = it.y0 + (tgt.y - it.y0) * p - lift;
        it.ang = Math.atan2(ny - it.y, nx - it.x || 1e-6);
        it.x = nx;
        it.y = ny;
      } else {
        it.vy += (s.gravity ?? 0) * H * dt;
        const nx = it.x + it.vx * dt;
        let ny = it.y + it.vy * dt;
        if (it.floorY !== null && ny >= it.floorY) {
          ny = it.floorY;
          it.vx = 0;
          it.vy = 0;
        }
        if (Math.abs(nx - it.x) + Math.abs(ny - it.y) > 1e-3) it.ang = Math.atan2(ny - it.y, nx - it.x);
        it.x = nx;
        it.y = ny;
      }
    }
    this.items = keep;
  }

  /** 而家生存粒子嘅畫法（測試用：位置、大細、透明度） */
  snapshot(a: FxAnchors, layer: 'back' | 'front'): { sprite: ArtSpriteKey; x: number; y: number; w: number; alpha: number; rot: number }[] {
    const H = a.unitH;
    const out: { sprite: ArtSpriteKey; x: number; y: number; w: number; alpha: number; rot: number }[] = [];
    for (const it of this.items) {
      const s = it.spec;
      if ((s.layer ?? 'front') !== layer) continue;
      const t = it.age - it.delay;
      if (t < 0) continue;
      const p = Math.min(1, t / s.life);
      const fi = s.fadeIn ?? 0.15;
      const fadeIn = fi > 0 ? Math.min(1, p / fi) : 1;
      const fadeOut = p > 0.7 ? Math.max(0, (1 - p) / 0.3) : 1;
      const size = (s.size + ((s.sizeEnd ?? s.size) - s.size) * p) * H * this.sizeMul;
      const stretch = (s.stretch ?? 1) + ((s.stretchEnd ?? s.stretch ?? 1) - (s.stretch ?? 1)) * p;
      const rot = s.faceVel ? it.ang : it.rot0 + ((s.spin ?? 0) * Math.PI / 180) * t;
      out.push({ sprite: s.sprite, x: it.x, y: it.y, w: size * stretch, alpha: (s.alpha ?? 1) * fadeIn * fadeOut, rot });
    }
    return out;
  }

  /** 畫一層（back＝人物後面；front＝前面） */
  draw(
    ctx: CanvasRenderingContext2D,
    sprites: Partial<Record<ArtSpriteKey, CanvasImageSource & SpriteLike>>,
    a: FxAnchors,
    layer: 'back' | 'front',
  ) {
    const H = a.unitH;
    for (const it of this.items) {
      const s = it.spec;
      if ((s.layer ?? 'front') !== layer) continue;
      const t = it.age - it.delay;
      if (t < 0) continue;
      const img = sprites[s.sprite];
      if (!img || !img.width) continue;
      const p = Math.min(1, t / s.life);
      const fi = s.fadeIn ?? 0.15;
      const fadeIn = fi > 0 ? Math.min(1, p / fi) : 1;
      const fadeOut = p > 0.7 ? Math.max(0, (1 - p) / 0.3) : 1;
      const alpha = (s.alpha ?? 1) * fadeIn * fadeOut;
      if (alpha <= 0.01) continue;
      const w0 = (s.size + ((s.sizeEnd ?? s.size) - s.size) * p) * H * this.sizeMul;
      const h = (w0 * img.height) / img.width;
      const stretch = (s.stretch ?? 1) + ((s.stretchEnd ?? s.stretch ?? 1) - (s.stretch ?? 1)) * p;
      const w = w0 * stretch;
      const rot = s.faceVel ? it.ang : it.rot0 + ((s.spin ?? 0) * Math.PI / 180) * t;
      ctx.save();
      ctx.globalAlpha *= alpha;
      ctx.globalCompositeOperation = s.blend === 'multiply' ? 'multiply' : s.blend === 'screen' ? 'screen' : 'source-over';
      ctx.translate(it.x, it.y);
      if (rot) ctx.rotate(rot);
      ctx.drawImage(img, -w * (s.originX ?? 0.5), -h / 2, w, h);
      ctx.restore();
    }
  }
}

/** 由兩個人嘅位置推出全部錨點（css px） */
export function makeAnchors(o: {
  unitH: number;
  heroFootX: number;
  heroFootY: number;
  foeFootX: number;
  foeFootY: number;
  /** 敵人身高（H 倍，首領大隻） */
  foeScale?: number;
  /** 天頂最高去到邊（css px），唔好飛出畫面 */
  skyMinY?: number;
}): FxAnchors {
  const H = o.unitH;
  const fs = o.foeScale ?? 1;
  const hero = { x: o.heroFootX, y: o.heroFootY - 0.55 * H };
  const foe = { x: o.foeFootX, y: o.foeFootY - 0.55 * H * fs };
  return {
    unitH: H,
    hero,
    heroHand: { x: o.heroFootX + 0.28 * H, y: o.heroFootY - 0.6 * H },
    heroGround: { x: o.heroFootX, y: o.heroFootY },
    foe,
    foeGround: { x: o.foeFootX, y: o.foeFootY },
    foeTop: { x: o.foeFootX, y: o.foeFootY - 1.05 * H * fs },
    sky: { x: (o.heroFootX + o.foeFootX) / 2, y: Math.max(o.skyMinY ?? -Infinity, o.foeFootY - 2.1 * H) },
    between: { x: (o.heroFootX + o.foeFootX) / 2, y: (hero.y + foe.y) / 2 },
  };
}

/** 載入特效位圖（public/ink/art/artfx/） */
export function loadArtSprites(keys: readonly ArtSpriteKey[]): Promise<Partial<Record<ArtSpriteKey, HTMLImageElement>>> {
  const base = `${import.meta.env.BASE_URL || '/'}ink/art/artfx/`;
  return Promise.all(
    keys.map(
      (k) =>
        new Promise<[ArtSpriteKey, HTMLImageElement | null]>((resolve) => {
          const img = new Image();
          img.onload = () => resolve([k, img]);
          img.onerror = () => resolve([k, null]);
          img.src = `${base}${k}.webp`;
        }),
    ),
  ).then((pairs) => {
    const out: Partial<Record<ArtSpriteKey, HTMLImageElement>> = {};
    for (const [k, img] of pairs) if (img) out[k] = img;
    return out;
  });
}

export const ART_SPRITE_KEYS: readonly ArtSpriteKey[] = [
  'wave', 'wave-big', 'droplet', 'crack', 'rock', 'dust', 'rain', 'drop', 'thrust', 'storm', 'lightning', 'spark',
  'scorch', 'streak', 'cloud', 'cloud-ring', 'needle', 'glint', 'poison', 'wind', 'wind-ring', 'board',
  'stone-black', 'stone-white', 'board-glow', 'qi',
];
