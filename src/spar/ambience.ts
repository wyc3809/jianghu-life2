/**
 * 演武場景氛圍（代替影片背景）：每個場景喺靜態水墨圖上面加程式化嘅天氣同物件動態。
 *   back  層：畫喺背景之後、角色之前（霧、水光、雲、煙、遠景落葉）
 *   front 層：畫喺角色之前（雨、近景落葉、螢火）
 * 全部 canvas 粒子（點、短線、橢圓、徑向漸變），唔用 SVG／路徑人偶；
 * 視覺用嘅隨機（Math.random）唔影響遊戲模擬 RNG。
 */

type Kind = 'mist' | 'shimmer' | 'leaf' | 'bamboo' | 'rain' | 'splash' | 'smoke' | 'cloud' | 'firefly';

interface P {
  kind: Kind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  rot: number;
  vr: number;
  age: number;
  life: number;
  seed: number;
  front: boolean;
}

interface SceneSpec {
  mist?: number;
  shimmer?: number;
  leaf?: number;
  bamboo?: number;
  rain?: number;
  smoke?: boolean;
  cloud?: number;
  firefly?: number;
  /** 整體色調罩（rgba），例如雨夜偏暗 */
  tint?: string;
}

/** 每個場景（背景 key）嘅氛圍配方 */
export const AMBIENCE: Record<string, SceneSpec> = {
  town: { mist: 3, shimmer: 26 },
  road: { mist: 4, leaf: 14 },
  bamboo: { mist: 2, bamboo: 14 },
  inn: { mist: 2, rain: 90, tint: 'rgba(40, 48, 60, 0.16)' },
  gate: { mist: 5, smoke: true },
  nightpeak: { cloud: 4, firefly: 16, tint: 'rgba(20, 26, 40, 0.2)' },
  valley: { mist: 4 },
};

const INK = '22,19,15';

export class SceneAmbience {
  private ps: P[] = [];
  private spec: SceneSpec = {};
  private key = '';
  private t = 0;
  private w = 0;
  private h = 0;
  private quiet = false;
  private smokeClock = 0;

  setScene(key: string, w: number, h: number, quiet: boolean): void {
    if (key === this.key && w === this.w && h === this.h && quiet === this.quiet) return;
    this.key = key;
    this.w = w;
    this.h = h;
    this.quiet = quiet;
    this.spec = AMBIENCE[key] ?? {};
    this.ps = [];
    if (!w || !h) return;
    const q = quiet ? 0.4 : 1;
    const n = (v?: number) => Math.round((v ?? 0) * q);
    for (let i = 0; i < n(this.spec.mist); i++) this.ps.push(this.make('mist', true));
    for (let i = 0; i < n(this.spec.shimmer); i++) this.ps.push(this.make('shimmer', true));
    for (let i = 0; i < n(this.spec.leaf); i++) this.ps.push(this.make('leaf', true));
    for (let i = 0; i < n(this.spec.bamboo); i++) this.ps.push(this.make('bamboo', true));
    for (let i = 0; i < n(this.spec.rain); i++) this.ps.push(this.make('rain', true));
    for (let i = 0; i < n(this.spec.cloud); i++) this.ps.push(this.make('cloud', true));
    for (let i = 0; i < n(this.spec.firefly); i++) this.ps.push(this.make('firefly', true));
  }

  private make(kind: Kind, scatter = false): P {
    const { w, h } = this;
    const rnd = Math.random;
    const p: P = { kind, x: rnd() * w, y: 0, vx: 0, vy: 0, r: 1, rot: rnd() * 6.28, vr: 0, age: 0, life: 1e9, seed: rnd() * 100, front: false };
    switch (kind) {
      case 'mist':
        p.y = h * (0.35 + rnd() * 0.45);
        p.r = h * (0.35 + rnd() * 0.3);
        p.vx = 4 + rnd() * 8;
        break;
      case 'shimmer':
        p.y = h * (0.66 + rnd() * 0.22);
        p.r = 6 + rnd() * 16;
        p.vx = 2 + rnd() * 3;
        break;
      case 'leaf':
      case 'bamboo':
        p.y = scatter ? rnd() * h : -10;
        p.vx = 10 + rnd() * 18;
        p.vy = 16 + rnd() * 22;
        p.vr = (rnd() - 0.5) * 3;
        p.r = kind === 'bamboo' ? 2.6 + rnd() * 1.8 : 2.2 + rnd() * 1.8;
        p.front = rnd() < 0.35;
        break;
      case 'rain':
        p.y = scatter ? rnd() * h : -20;
        p.vx = -60;
        p.vy = 420 + rnd() * 160;
        p.r = 9 + rnd() * 9;
        p.front = rnd() < 0.55;
        break;
      case 'splash':
        p.y = h * 0.92 + (rnd() - 0.5) * 6;
        p.life = 0.28;
        p.r = 2 + rnd() * 2;
        break;
      case 'smoke':
        p.x = w * (0.8 + rnd() * 0.05);
        p.y = h * 0.7;
        p.vx = 3 + rnd() * 4;
        p.vy = -10 - rnd() * 6;
        p.r = 9 + rnd() * 5;
        p.life = 5 + rnd() * 2;
        break;
      case 'cloud':
        p.y = h * (0.08 + rnd() * 0.35);
        p.r = h * (0.25 + rnd() * 0.25);
        p.vx = 5 + rnd() * 6;
        break;
      case 'firefly':
        p.y = h * (0.45 + rnd() * 0.45);
        p.vx = (rnd() - 0.5) * 12;
        p.vy = (rnd() - 0.5) * 8;
        p.r = 1.2 + rnd() * 1.2;
        p.front = rnd() < 0.5;
        break;
    }
    return p;
  }

  update(dt: number): void {
    if (!this.w) return;
    this.t += dt;
    const { w, h } = this;
    const add: P[] = [];
    for (const p of this.ps) {
      p.age += dt;
      switch (p.kind) {
        case 'mist':
        case 'cloud':
          p.x += p.vx * dt;
          if (p.x - p.r > w) p.x = -p.r;
          break;
        case 'shimmer':
          p.x += p.vx * dt;
          if (p.x > w + 20) p.x = -20;
          break;
        case 'leaf':
        case 'bamboo': {
          const sway = Math.sin(this.t * 1.6 + p.seed) * 14;
          p.x += (p.vx + sway) * dt;
          p.y += p.vy * dt;
          p.rot += p.vr * dt;
          if (p.y > h + 10 || p.x > w + 20) Object.assign(p, this.make(p.kind), { x: Math.random() * w * 0.9 - 20 });
          break;
        }
        case 'rain':
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          if (p.y > h * 0.92) {
            if (!this.quiet && Math.random() < 0.35) add.push({ ...this.make('splash'), x: p.x });
            Object.assign(p, this.make('rain'), { y: -20 - Math.random() * 40 });
          }
          break;
        case 'smoke':
          p.x += (p.vx + Math.sin(this.t + p.seed) * 4) * dt;
          p.y += p.vy * dt;
          p.r += 5 * dt;
          break;
        case 'firefly':
          p.vx += (Math.random() - 0.5) * 30 * dt;
          p.vy += (Math.random() - 0.5) * 30 * dt;
          p.vx *= 0.98;
          p.vy *= 0.98;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          if (p.x < 0) p.x = w;
          if (p.x > w) p.x = 0;
          p.y = Math.max(h * 0.35, Math.min(h * 0.92, p.y));
          break;
        default:
          break;
      }
    }
    if (this.spec.smoke && !this.quiet) {
      this.smokeClock += dt;
      if (this.smokeClock > 0.6) {
        this.smokeClock = 0;
        add.push(this.make('smoke'));
      }
    }
    this.ps = this.ps.filter((p) => p.age < p.life).concat(add);
  }

  /** layer：back＝背景後、角色前；front＝角色前 */
  draw(ctx: CanvasRenderingContext2D, layer: 'back' | 'front'): void {
    if (!this.w) return;
    const { h } = this;
    if (layer === 'back' && this.spec.tint) {
      ctx.save();
      ctx.fillStyle = this.spec.tint;
      ctx.fillRect(0, 0, this.w, h);
      ctx.restore();
    }
    for (const p of this.ps) {
      const front = p.front || p.kind === 'splash';
      if ((layer === 'front') !== front) continue;
      ctx.save();
      switch (p.kind) {
        case 'mist':
        case 'cloud': {
          const a = p.kind === 'cloud' ? 0.2 : 0.14;
          const col = p.kind === 'cloud' ? '70,74,86' : '244,240,230';
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
          g.addColorStop(0, `rgba(${col},${a})`);
          g.addColorStop(1, `rgba(${col},0)`);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, p.r, p.r * 0.32, 0, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case 'shimmer': {
          const a = 0.35 + 0.35 * Math.sin(this.t * 3 + p.seed);
          ctx.strokeStyle = `rgba(255,252,240,${Math.max(0, a)})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(p.x - p.r, p.y);
          ctx.lineTo(p.x + p.r, p.y);
          ctx.stroke();
          break;
        }
        case 'leaf':
        case 'bamboo': {
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = `rgba(${INK},${p.front ? 0.55 : 0.32})`;
          ctx.beginPath();
          const lx = p.kind === 'bamboo' ? p.r * 2.6 : p.r * 1.6;
          ctx.ellipse(0, 0, lx, p.r * (p.kind === 'bamboo' ? 0.42 : 0.8), 0, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case 'rain':
          ctx.strokeStyle = `rgba(210,220,232,${p.front ? 0.5 : 0.28})`;
          ctx.lineWidth = p.front ? 1.1 : 0.7;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx * 0.03, p.y + p.r);
          ctx.stroke();
          break;
        case 'splash': {
          const u = p.age / p.life;
          ctx.strokeStyle = `rgba(220,228,236,${0.5 * (1 - u)})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, p.r * (1 + u * 2), p.r * 0.4 * (1 + u), 0, 0, Math.PI * 2);
          ctx.stroke();
          break;
        }
        case 'smoke': {
          const u = p.age / p.life;
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
          g.addColorStop(0, `rgba(96,94,90,${0.4 * (1 - u)})`);
          g.addColorStop(1, 'rgba(120,118,112,0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case 'firefly': {
          const a = 0.35 + 0.45 * Math.max(0, Math.sin(this.t * 2.4 + p.seed));
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
          g.addColorStop(0, `rgba(250,226,140,${a})`);
          g.addColorStop(1, 'rgba(250,226,140,0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 5, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
      }
      ctx.restore();
    }
  }
}
