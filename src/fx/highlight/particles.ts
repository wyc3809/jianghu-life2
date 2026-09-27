/**
 * Canvas 2D 粒子系統（疊加混合 'lighter'）。
 * 物理：重力、阻力、生命週期；運動模式：自由（free）、吸入（attract）、曲線飛行（curve）、環繞（orbit）。
 * 每粒火花帶一圈低透明度外暈；衝擊波三層描邊（寬而淡、中等、幼而亮）。
 */

export type ParticleShape = 'spark' | 'streak' | 'star' | 'confetti' | 'dust' | 'ring';
export type ParticleMode = 'free' | 'attract' | 'curve' | 'orbit';

export interface Particle {
  shape: ParticleShape;
  mode: ParticleMode;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  gravity: number;
  drag: number;
  rot: number;
  vr: number;
  /** attract：目標點＋加速度；curve：貝塞爾控制點；orbit：圓心、半徑、角速度 */
  tx?: number;
  ty?: number;
  accel?: number;
  /** 吸入：到呢個半徑內就淡走（唔好蓋住主體） */
  killRadius?: number;
  c1x?: number;
  c1y?: number;
  c2x?: number;
  c2y?: number;
  sx?: number;
  sy?: number;
  cx?: number;
  cy?: number;
  rx?: number;
  ry?: number;
  ang?: number;
  angV?: number;
  /** orbit 拖尾歷史 */
  trail?: { x: number; y: number }[];
  /** ring：最大半徑、線寬層 */
  maxR?: number;
}

export class ParticleSystem {
  private ctx: CanvasRenderingContext2D;
  private list: Particle[] = [];
  private w = 1;
  private h = 1;
  private dpr = 1;
  /** 減少動態：粒子數量打折 */
  density = 1;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
  }

  resize(w: number, h: number, dpr: number) {
    this.w = w;
    this.h = h;
    this.dpr = dpr;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
  }

  get count() {
    return this.list.length;
  }

  clear(filter?: (p: Particle) => boolean) {
    this.list = filter ? this.list.filter((p) => !filter(p)) : [];
  }

  add(p: Partial<Particle> & Pick<Particle, 'x' | 'y' | 'color'>) {
    this.list.push({
      shape: 'spark',
      mode: 'free',
      vx: 0,
      vy: 0,
      life: 1,
      maxLife: 1,
      size: 3,
      gravity: 0,
      drag: 0.98,
      rot: Math.random() * Math.PI * 2,
      vr: 0,
      ...p,
    } as Particle);
  }

  private n(k: number) {
    return Math.max(1, Math.round(k * this.density));
  }

  /** 爆發火花：向外放射，帶重力 */
  sparks(x: number, y: number, count: number, colors: string[], speed = 9, gravity = 0.16) {
    for (let i = 0; i < this.n(count); i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.35 + Math.random() * 0.8);
      const life = 0.7 + Math.random() * 0.7;
      this.add({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 2,
        color: colors[i % colors.length]!,
        size: 2 + Math.random() * 3.2,
        gravity,
        drag: 0.955,
        life,
        maxLife: life,
      });
    }
  }

  /** 細長流光：高速直線，拖長 */
  streaks(x: number, y: number, count: number, color: string, speed = 22) {
    for (let i = 0; i < this.n(count); i++) {
      const a = (i / count) * Math.PI * 2 + Math.random() * 0.2;
      const s = speed * (0.7 + Math.random() * 0.5);
      const life = 0.45 + Math.random() * 0.3;
      this.add({
        shape: 'streak',
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        color,
        size: 2.2,
        drag: 0.9,
        life,
        maxLife: life,
      });
    }
  }

  /** 旋轉閃光星點 */
  stars(x: number, y: number, count: number, color: string, spread = 180, minR = 0) {
    for (let i = 0; i < this.n(count); i++) {
      const a = Math.random() * Math.PI * 2;
      // 由 minR 開始散（唔喺主體正面閃）
      const r = minR + spread * (0.3 + Math.random() * 0.7);
      const life = 0.8 + Math.random() * 0.9;
      this.add({
        shape: 'star',
        x: x + Math.cos(a) * r,
        y: y + Math.sin(a) * r,
        vx: Math.cos(a) * 0.6,
        vy: Math.sin(a) * 0.6 - 0.4,
        color,
        size: 7 + Math.random() * 9,
        drag: 0.97,
        vr: (Math.random() - 0.5) * 0.25,
        life,
        maxLife: life,
      });
    }
  }

  /** 衝擊波（一次三層） */
  shockwave(x: number, y: number, maxR: number, color: string, life = 0.7) {
    this.add({ shape: 'ring', x, y, color, maxR, life, maxLife: life, size: 1 });
  }

  /** 吸入：由四周吸向中心，到 killRadius 內淡走 */
  attract(x: number, y: number, count: number, colors: string[], radius = 220, killRadius = 60) {
    for (let i = 0; i < this.n(count); i++) {
      const a = Math.random() * Math.PI * 2;
      const r = radius * (0.7 + Math.random() * 0.6);
      const life = 1.4;
      this.add({
        mode: 'attract',
        x: x + Math.cos(a) * r,
        y: y + Math.sin(a) * r,
        vx: -Math.sin(a) * 2,
        vy: Math.cos(a) * 2,
        tx: x,
        ty: y,
        accel: 0.9 + Math.random() * 0.6,
        killRadius,
        color: colors[i % colors.length]!,
        size: 1.8 + Math.random() * 2,
        drag: 0.9,
        life,
        maxLife: life,
      });
    }
  }

  /** 曲線飛行：三次貝塞爾由 s 到 t（用生命週期作進度） */
  curve(sx: number, sy: number, tx: number, ty: number, color: string, dur = 0.8, bend = -160) {
    const mx = (sx + tx) / 2;
    this.add({
      mode: 'curve',
      x: sx,
      y: sy,
      sx,
      sy,
      tx,
      ty,
      c1x: sx + (mx - sx) * 0.2,
      c1y: sy + bend,
      c2x: tx - (tx - mx) * 0.3,
      c2y: ty + bend * 0.5,
      color,
      size: 3,
      life: dur,
      maxLife: dur,
    });
  }

  /** 環繞星塵：橢圓軌道（半徑要大過主體輪廓），帶拖尾 */
  orbit(cx: number, cy: number, rx: number, ry: number, count: number, color: string) {
    for (let i = 0; i < this.n(count); i++) {
      const life = 999;
      this.add({
        mode: 'orbit',
        shape: 'dust',
        x: cx,
        y: cy,
        cx,
        cy,
        rx,
        ry,
        ang: (i / count) * Math.PI * 2,
        angV: 1.4 + (i % 3) * 0.15,
        trail: [],
        color,
        size: 3.4,
        life,
        maxLife: life,
      });
    }
  }

  /** 光塵：光柱入面慢慢上飄 */
  dust(x: number, y: number, width: number, count: number, color: string) {
    for (let i = 0; i < this.n(count); i++) {
      const life = 1.6 + Math.random() * 1.6;
      this.add({
        shape: 'dust',
        x: x + (Math.random() - 0.5) * width,
        y: y - Math.random() * 40,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -(0.6 + Math.random() * 0.9),
        color,
        size: 1.2 + Math.random() * 1.8,
        drag: 1,
        life,
        maxLife: life,
      });
    }
  }

  /** 彩帶（只喺最高潮用一次） */
  confetti(x: number, y: number, count: number, colors: string[]) {
    for (let i = 0; i < this.n(count); i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
      const s = 10 + Math.random() * 9;
      const life = 2.2 + Math.random() * 0.8;
      this.add({
        shape: 'confetti',
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        color: colors[i % colors.length]!,
        size: 5 + Math.random() * 4,
        gravity: 0.28,
        drag: 0.965,
        vr: (Math.random() - 0.5) * 0.5,
        life,
        maxLife: life,
      });
    }
  }

  step(dt: number) {
    const k = dt * 60; // 以 60fps 為單位
    const out: Particle[] = [];
    for (const p of this.list) {
      p.life -= dt;
      if (p.life <= 0) continue;
      if (p.mode === 'free') {
        p.vy += p.gravity * k;
        const d = Math.pow(p.drag, k);
        p.vx *= d;
        p.vy *= d;
        p.x += p.vx * k;
        p.y += p.vy * k;
      } else if (p.mode === 'attract') {
        const dx = p.tx! - p.x;
        const dy = p.ty! - p.y;
        const dist = Math.hypot(dx, dy) || 1;
        p.vx = (p.vx + (dx / dist) * p.accel! * k) * Math.pow(p.drag, k);
        p.vy = (p.vy + (dy / dist) * p.accel! * k) * Math.pow(p.drag, k);
        p.x += p.vx * k;
        p.y += p.vy * k;
        if (dist < p.killRadius!) p.life = Math.min(p.life, 0.08);
      } else if (p.mode === 'curve') {
        const t = 1 - p.life / p.maxLife;
        const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const u = 1 - e;
        p.x = u * u * u * p.sx! + 3 * u * u * e * p.c1x! + 3 * u * e * e * p.c2x! + e * e * e * p.tx!;
        p.y = u * u * u * p.sy! + 3 * u * u * e * p.c1y! + 3 * u * e * e * p.c2y! + e * e * e * p.ty!;
      } else if (p.mode === 'orbit') {
        p.ang! += p.angV! * dt;
        p.x = p.cx! + Math.cos(p.ang!) * p.rx!;
        p.y = p.cy! + Math.sin(p.ang!) * p.ry!;
        p.trail!.push({ x: p.x, y: p.y });
        if (p.trail!.length > 14) p.trail!.shift();
      }
      p.rot += p.vr * k;
      out.push(p);
    }
    this.list = out;
  }

  draw() {
    const c = this.ctx;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.clearRect(0, 0, this.w, this.h);
    c.globalCompositeOperation = 'lighter';
    for (const p of this.list) {
      const t = p.life / p.maxLife; // 1 → 0
      const a = Math.min(1, t * 1.6);
      switch (p.shape) {
        case 'spark':
        case 'dust': {
          if (p.mode === 'orbit' && p.trail) {
            // 拖尾：由淡到實
            p.trail.forEach((q, i) => {
              c.globalAlpha = (i / p.trail!.length) * 0.5;
              c.fillStyle = p.color;
              c.beginPath();
              c.arc(q.x, q.y, p.size * (0.4 + (i / p.trail!.length) * 0.6), 0, Math.PI * 2);
              c.fill();
            });
          }
          // 外暈（低透明度）
          c.globalAlpha = a * 0.22;
          c.fillStyle = p.color;
          c.beginPath();
          c.arc(p.x, p.y, p.size * 3.2, 0, Math.PI * 2);
          c.fill();
          c.globalAlpha = a;
          c.beginPath();
          c.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          c.fill();
          break;
        }
        case 'streak': {
          const len = Math.hypot(p.vx, p.vy) * 3.2;
          const ang = Math.atan2(p.vy, p.vx);
          c.save();
          c.translate(p.x, p.y);
          c.rotate(ang);
          const g = c.createLinearGradient(-len, 0, 0, 0);
          g.addColorStop(0, 'rgba(255,255,255,0)');
          g.addColorStop(1, p.color);
          c.globalAlpha = a;
          c.fillStyle = g;
          c.beginPath();
          c.moveTo(-len, 0);
          c.lineTo(0, -p.size / 2);
          c.lineTo(p.size, 0);
          c.lineTo(0, p.size / 2);
          c.closePath();
          c.fill();
          c.restore();
          break;
        }
        case 'star': {
          // 四角星（旋轉）＋ 外暈；大細隨生命先升後降
          const s = p.size * Math.sin(Math.PI * Math.min(1, (1 - t) * 1.4 + 0.1));
          c.save();
          c.translate(p.x, p.y);
          c.rotate(p.rot);
          c.globalAlpha = a * 0.25;
          c.fillStyle = p.color;
          c.beginPath();
          c.arc(0, 0, s * 1.3, 0, Math.PI * 2);
          c.fill();
          c.globalAlpha = a;
          c.fillStyle = '#ffffff';
          c.beginPath();
          for (let i = 0; i < 8; i++) {
            const r = i % 2 === 0 ? s : s * 0.22;
            const an = (i / 8) * Math.PI * 2;
            c.lineTo(Math.cos(an) * r, Math.sin(an) * r);
          }
          c.closePath();
          c.fill();
          c.restore();
          break;
        }
        case 'confetti': {
          c.save();
          c.globalCompositeOperation = 'source-over';
          c.translate(p.x, p.y);
          c.rotate(p.rot);
          c.scale(1, Math.cos(p.rot * 2)); // 翻面
          c.globalAlpha = a;
          c.fillStyle = p.color;
          c.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          c.restore();
          break;
        }
        case 'ring': {
          const prog = 1 - t;
          const e = 1 - Math.pow(1 - prog, 3);
          const r = p.maxR! * e;
          // 三層：寬而淡、中等、幼而亮
          const layers: [number, number][] = [
            [22, 0.14],
            [9, 0.32],
            [2.5, 0.9],
          ];
          for (const [lw, al] of layers) {
            c.globalAlpha = al * t;
            c.strokeStyle = lw < 3 ? '#ffffff' : p.color;
            c.lineWidth = lw * (0.5 + t * 0.5);
            c.beginPath();
            c.ellipse(p.x, p.y, r, r * 0.78, 0, 0, Math.PI * 2);
            c.stroke();
          }
          break;
        }
      }
    }
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
  }
}
