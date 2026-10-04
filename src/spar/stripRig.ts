/**
 * 條帶變形骨架（演武台剪影）：唔切件，將整個剪影位圖由頭到腳切成 N 條橫帶，
 * 每條按「骨架彈簧」橫向位移，做出：
 *   - lean  上身前傾／後仰（腳底固定，越上越郁）——揮擊、受擊、撲擊
 *   - cloth 衣擺／披風擺動（膝下一段最大，腳底同腰以上唔郁）——行路拖尾、急停甩動
 *   - hair  頭髮／斗笠飄（頭頂一截）——慢半拍跟住身郁
 * 彈簧係臨界阻尼附近嘅二階系統，畀「速度」同「衝擊」驅動，所以有慣性、會晃返嚟。
 *
 * 純位圖繪製（drawImage 分條），唔用 SVG／路徑人偶。數學部份係純函數，有單元測試。
 */

export interface Spring {
  x: number;
  v: number;
}

export interface SpringParams {
  /** 剛度 */
  k: number;
  /** 阻尼 */
  c: number;
}

/** 推進一個阻尼彈簧向 target（半隱式歐拉，dt 秒） */
export function stepSpring(s: Spring, target: number, p: SpringParams, dt: number): void {
  const a = -p.k * (s.x - target) - p.c * s.v;
  s.v += a * dt;
  s.x += s.v * dt;
}

const LEAN: SpringParams = { k: 90, c: 11 };
const CLOTH: SpringParams = { k: 46, c: 4.2 };
const HAIR: SpringParams = { k: 30, c: 3.4 };

/** 位移上限（設計單位）：太大會令條帶錯位成鋸齒 */
export const RIG_LIMIT = { lean: 38, cloth: 30, hair: 26 } as const;

const clamp = (v: number, m: number) => Math.max(-m, Math.min(m, v));

/** 每個角色一個 rig：位移單位係「剪影設計單位」（主角全高 788） */
export class StripRig {
  lean: Spring = { x: 0, v: 0 };
  cloth: Spring = { x: 0, v: 0 };
  hair: Spring = { x: 0, v: 0 };
  private t = 0;
  private lastX: number | null = null;

  /**
   * @param worldX  角色而家嘅畫面位置（css px），用嚟計移動速度
   * @param pxPerDu 一個設計單位幾多 css px（換算速度）
   * @param leanTarget 想要嘅傾側量（設計單位；正＝向畫面右）
   */
  update(dt: number, worldX: number, pxPerDu: number, leanTarget = 0): void {
    if (dt <= 0) return;
    this.t += dt;
    const vel = this.lastX === null ? 0 : (worldX - this.lastX) / dt / Math.max(1e-4, pxPerDu);
    this.lastX = worldX;
    // 衣擺：被速度拖後（移動方向相反），加少少隨時間嘅風
    const wind = Math.sin(this.t * 1.7) * 10 + Math.sin(this.t * 4.3) * 4;
    stepSpring(this.cloth, -vel * 0.09 + wind, CLOTH, dt);
    stepSpring(this.lean, leanTarget, LEAN, dt);
    // 頭髮慢半拍追上身前傾，再加衣擺嘅一半
    stepSpring(this.hair, this.lean.x * 0.6 + this.cloth.x * 0.5, HAIR, dt);
  }

  /** 瞬間衝擊（設計單位／秒）：揮擊、受擊 */
  kick(lean: number, cloth = lean * 0.8): void {
    this.lean.v += lean;
    this.cloth.v += cloth;
  }

  /** 第 t（0＝頭頂、1＝腳底）高度嘅橫向位移（設計單位） */
  offsetAt(t: number): number {
    return stripOffset(
      t,
      clamp(this.lean.x, RIG_LIMIT.lean),
      clamp(this.cloth.x, RIG_LIMIT.cloth),
      clamp(this.hair.x, RIG_LIMIT.hair),
      this.t,
    );
  }
}

/** 純函數：條帶位移。腳底 (t=1) 永遠 0，唔會「腳底打滑」 */
export function stripOffset(t: number, lean: number, cloth: number, hair: number, time: number): number {
  const u = Math.max(0, Math.min(1, t));
  const leanW = Math.pow(1 - u, 1.4); // 頭頂 1 → 腳底 0
  // 衣擺：t 0.45→1 一段 sin 拱形，膝下最大、腳底歸零；加細波浪
  const hemU = (u - 0.45) / 0.55;
  const hemW = hemU > 0 && hemU < 1 ? Math.sin(hemU * Math.PI) : 0;
  const ripple = 1 + 0.12 * Math.sin(u * 6 + time * 6);
  const hairW = u < 0.22 ? (0.22 - u) / 0.22 : 0;
  return lean * leanW + cloth * hemW * ripple + hair * hairW;
}

/**
 * 清走位圖入面極淡嘅半透明雜點（alpha < 28 → 0）並快取。
 * 分條畫時條與條有少少重疊，雜點會疊深變成「淡灰長方形」，所以先清。
 */
const cleanCache = new WeakMap<object, CanvasImageSource>();

export function cleanSilhouette(img: CanvasImageSource): CanvasImageSource {
  const hit = cleanCache.get(img as object);
  if (hit) return hit;
  const w = (img as HTMLImageElement).naturalWidth || (img as HTMLCanvasElement).width || 0;
  const h = (img as HTMLImageElement).naturalHeight || (img as HTMLCanvasElement).height || 0;
  if (!w || !h || typeof document === 'undefined') return img;
  try {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const x = c.getContext('2d', { willReadFrequently: true });
    if (!x) return img;
    x.drawImage(img, 0, 0);
    const data = x.getImageData(0, 0, w, h);
    const d = data.data;
    for (let i = 3; i < d.length; i += 4) if (d[i]! < 28) d[i] = 0;
    x.putImageData(data, 0, 0);
    cleanCache.set(img as object, c);
    return c;
  } catch {
    return img; // 跨域等情況：用返原圖
  }
}

/**
 * 將剪影位圖分條畫出（座標同 drawSilhouetteSprite 一致：已 translate 到腳底）。
 * offsetFn 回傳設計單位位移（正＝向右；flipX 時喺鏡像座標入面）。
 */
export function drawWarpedSprite(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  opts: { k: number; w: number; h: number; dx: number; dy: number; flipX?: boolean; strips?: number },
  offsetFn: (t: number) => number,
): void {
  const src = cleanSilhouette(img);
  const natW = (src as HTMLCanvasElement).width || (img as HTMLImageElement).naturalWidth || opts.w;
  const natH = (src as HTMLCanvasElement).height || (img as HTMLImageElement).naturalHeight || opts.h;
  const n = Math.max(4, opts.strips ?? 40);
  const k = opts.k;
  const dW = opts.w * k;
  const x0 = opts.dx * k;
  const y0 = opts.dy * k;
  ctx.save();
  if (opts.flipX) ctx.scale(-1, 1);
  for (let i = 0; i < n; i++) {
    const sy = (natH * i) / n;
    const sh = natH / n;
    const dy = y0 + (opts.h * k * i) / n;
    const dh = (opts.h * k) / n;
    const t = (i + 0.5) / n;
    const off = offsetFn(t) * k;
    // 多畫 0.35px 重疊，避免條與條之間見縫
    ctx.drawImage(src, 0, sy, natW, Math.min(sh + 0.5, natH - sy), x0 + off, dy, dW, dh + 0.35);
  }
  ctx.restore();
}
