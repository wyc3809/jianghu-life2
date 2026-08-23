/**
 * 頂級標準戰鬥視覺系統 v3
 * 原則：零 GC、固定時間步長、批處理渲染
 */
import { useCallback, useEffect, useRef } from 'react';
import type { MoveStance } from '@core/life/moveStance';

// ========== 配置 ==========
const MAX_PARTICLES = 256;
const DPR = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2);
const FIXED_DT = 1 / 60; // 固定 60fps 步長

// ========== 粒子對象池 ==========


interface Pool {
  count: number;
  x: Float32Array;
  y: Float32Array;
  vx: Float32Array;
  vy: Float32Array;
  life: Float32Array;     // 剩餘生命（秒）
  maxLife: Float32Array;  // 總生命（秒）
  size: Float32Array;
  r: Uint8Array;
  g: Uint8Array;
  b: Uint8Array;
  a: Float32Array;
  type: Uint8Array;       // 0=splatter, 1=qi, 2=spark, 3=ink
  active: Uint8Array;
}

function createPool(): Pool {
  return {
    count: MAX_PARTICLES,
    x: new Float32Array(MAX_PARTICLES),
    y: new Float32Array(MAX_PARTICLES),
    vx: new Float32Array(MAX_PARTICLES),
    vy: new Float32Array(MAX_PARTICLES),
    life: new Float32Array(MAX_PARTICLES),
    maxLife: new Float32Array(MAX_PARTICLES),
    size: new Float32Array(MAX_PARTICLES),
    r: new Uint8Array(MAX_PARTICLES),
    g: new Uint8Array(MAX_PARTICLES),
    b: new Uint8Array(MAX_PARTICLES),
    a: new Float32Array(MAX_PARTICLES),
    type: new Uint8Array(MAX_PARTICLES),
    active: new Uint8Array(MAX_PARTICLES),
  };
}

let pool: Pool | null = null;
let freeList: number[] = [];

function initPool() {
  if (pool) return;
  pool = createPool();
  freeList = Array.from({ length: MAX_PARTICLES }, (_, i) => i);
}

function allocParticle(): number {
  if (freeList.length === 0) return -1;
  return freeList.pop()!;
}

function freeParticle(idx: number) {
  if (!pool) return;
  pool.active[idx] = 0;
  freeList.push(idx);
}

function spawnParticle(
  x: number, y: number,
  vx: number, vy: number,
  life: number, size: number,
  color: [number, number, number, number],
  type: number
) {
  initPool();
  const idx = allocParticle();
  if (idx < 0) return;
  const p = pool!;
  p.x[idx] = x;
  p.y[idx] = y;
  p.vx[idx] = vx;
  p.vy[idx] = vy;
  p.life[idx] = life;
  p.maxLife[idx] = life;
  p.size[idx] = size;
  p.r[idx] = color[0];
  p.g[idx] = color[1];
  p.b[idx] = color[2];
  p.a[idx] = color[3];
  p.type[idx] = type;
  p.active[idx] = 1;
}

// ========== 震動系統 ==========
interface ShakeState {
  ampX: number;
  ampY: number;
  freq: number;
  phase: number;
  decay: number;
  age: number;
}

function createShake(intensity: number): ShakeState {
  return {
    ampX: intensity * (0.8 + Math.random() * 0.4),
    ampY: intensity * (0.8 + Math.random() * 0.4),
    freq: 15 + Math.random() * 10, // Hz
    phase: Math.random() * Math.PI * 2,
    decay: 12, // 衰減速度
    age: 0,
  };
}

function shakeOffset(s: ShakeState, dt: number): { x: number; y: number } {
  s.age += dt;
  const envelope = Math.exp(-s.decay * s.age);
  const x = s.ampX * envelope * Math.sin(s.freq * s.age * Math.PI * 2 + s.phase);
  const y = s.ampY * envelope * Math.cos(s.freq * s.age * Math.PI * 2 + s.phase * 0.7);
  return { x, y };
}

// ========== Hitstop ==========
interface HitstopState {
  remaining: number;
  factor: number;
}

// ========== 渲染器 ==========
function drawParticleBatch(
  ctx: CanvasRenderingContext2D,
  p: Pool,
  indices: number[],
  globalAlpha: number
) {
  if (indices.length === 0) return;
  ctx.save();
  ctx.globalAlpha = globalAlpha;

  // 按類型分批
  const splatters: number[] = [];
  const circles: number[] = [];

  for (const i of indices) {
    if (p.type[i] === 0 || p.type[i] === 3) splatters.push(i);
    else circles.push(i);
  }

  // 圓形粒子用 fillRect 批處理（比 arc 快）
  if (circles.length > 0) {
    for (const i of circles) {
      const size = p.size[i] * (0.3 + (p.life[i] / p.maxLife[i]) * 0.7);
      const alpha = (p.life[i] / p.maxLife[i]) * p.a[i];
      ctx.fillStyle = `rgba(${p.r[i]},${p.g[i]},${p.b[i]},${alpha})`;
      ctx.fillRect(p.x[i] - size * 0.5, p.y[i] - size * 0.5, size, size);
    }
  }

  // 墨漬粒子
  if (splatters.length > 0) {
    for (const i of splatters) {
      const t = p.life[i] / p.maxLife[i];
      const size = p.size[i] * (0.4 + t * 0.6);
      const alpha = t * p.a[i] * 0.7;
      ctx.fillStyle = `rgba(${p.r[i]},${p.g[i]},${p.b[i]},${alpha})`;

      // 簡化墨漬：旋轉橢圓
      ctx.save();
      ctx.translate(p.x[i], p.y[i]);
      ctx.rotate((i * 137.5) * Math.PI / 180); // 黃金角，固定旋轉
      ctx.beginPath();
      ctx.ellipse(0, 0, size, size * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  ctx.restore();
}

// ========== 主 Hook ==========
export interface CombatFxController {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  spawnHit: (side: 'player' | 'foe', damage: number, stance?: MoveStance) => void;
  spawnQi: (side: 'player' | 'foe') => void;
  spawnCombo: () => void;
  spawnGuard: (side: 'player' | 'foe') => void;
  triggerHitstop: (durationMs: number) => void;
  clear: () => void;
}

export function useCombatCanvas(): CombatFxController {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shakesRef = useRef<ShakeState[]>([]);
  const hitstopRef = useRef<HitstopState | null>(null);
  const rafRef = useRef<number>(0);
  const accRef = useRef(0);

  const spawnHit = useCallback((side: 'player' | 'foe', damage: number, stance?: MoveStance) => {
    initPool();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.width / DPR;
    const h = canvas.height / DPR;
    const cx = side === 'player' ? w * 0.28 : w * 0.72;
    const cy = h * 0.52;
    const intensity = Math.min(1, damage / 40);

    // 血濺粒子（對象池）
    const count = Math.floor(4 + intensity * 10);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 80 * intensity;
      const spread = 15 + intensity * 25;
      spawnParticle(
        cx + (Math.random() - 0.5) * spread,
        cy + (Math.random() - 0.5) * spread,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed - 20,
        0.25 + Math.random() * 0.35,
        2 + Math.random() * 5 * intensity,
        [140 + Math.floor(Math.random() * 50), 30 + Math.floor(Math.random() * 25), 25 + Math.floor(Math.random() * 20), 0.75],
        0
      );
    }

    // 火花
    if (damage > 12) {
      const sparkCount = Math.floor(2 + intensity * 5);
      for (let i = 0; i < sparkCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 50 + Math.random() * 100;
        spawnParticle(
          cx, cy,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed - 30,
          0.15 + Math.random() * 0.2,
          1 + Math.random() * 2,
          [255, 200 + Math.floor(Math.random() * 40), 60 + Math.floor(Math.random() * 40), 0.9],
          2
        );
      }
    }

    // 震動（指數衰減正弦）
    shakesRef.current.push(createShake(3 + intensity * 8));

    // Hitstop
    hitstopRef.current = { remaining: 80 + intensity * 120, factor: 0.05 };

    // 架勢墨漬
    if (stance) {
      const [cr, cg, cb] = stance === 'shi'
        ? [163, 58, 50]
        : stance === 'xu'
          ? [58, 79, 122]
          : [61, 92, 79];
      for (let i = 0; i < 3; i++) {
        const angle = Math.random() * Math.PI * 2;
        spawnParticle(
          cx + (Math.random() - 0.5) * 30,
          cy + (Math.random() - 0.5) * 30,
          Math.cos(angle) * 20,
          Math.sin(angle) * 20,
          0.4 + Math.random() * 0.3,
          4 + Math.random() * 8,
          [cr, cg, cb, 0.4],
          3
        );
      }
    }
  }, []);

  const spawnQi = useCallback((side: 'player' | 'foe') => {
    initPool();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.width / DPR;
    const h = canvas.height / DPR;
    const cx = side === 'player' ? w * 0.28 : w * 0.72;
    const cy = h * 0.55;

    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 15 + Math.random() * 30;
      spawnParticle(
        cx + (Math.random() - 0.5) * 20,
        cy + (Math.random() - 0.5) * 20,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed - 40,
        0.3 + Math.random() * 0.4,
        2 + Math.random() * 5,
        [50 + Math.floor(Math.random() * 30), 90 + Math.floor(Math.random() * 40), 70 + Math.floor(Math.random() * 30), 0.5],
        1
      );
    }
  }, []);

  const spawnCombo = useCallback(() => {
    initPool();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.width / DPR;
    const h = canvas.height / DPR;
    const cx = w * 0.5;
    const cy = h * 0.45;

    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2 + Math.random() * 0.3;
      const speed = 60 + Math.random() * 120;
      spawnParticle(
        cx, cy,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed - 20,
        0.2 + Math.random() * 0.3,
        1.5 + Math.random() * 3,
        [220, 170 + Math.floor(Math.random() * 30), 40 + Math.floor(Math.random() * 30), 0.9],
        2
      );
    }

    shakesRef.current.push(createShake(6));
    hitstopRef.current = { remaining: 100, factor: 0.02 };
  }, []);

  const spawnGuard = useCallback((side: 'player' | 'foe') => {
    initPool();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.width / DPR;
    const h = canvas.height / DPR;
    const cx = side === 'player' ? w * 0.28 : w * 0.72;
    const cy = h * 0.5;

    for (let i = 0; i < 5; i++) {
      const angle = Math.random() * Math.PI * 2;
      spawnParticle(
        cx + (Math.random() - 0.5) * 25,
        cy + (Math.random() - 0.5) * 25,
        Math.cos(angle) * 15,
        Math.sin(angle) * 15,
        0.3 + Math.random() * 0.25,
        3 + Math.random() * 5,
        [61, 92, 79, 0.5],
        3
      );
    }
  }, []);

  const triggerHitstop = useCallback((durationMs: number) => {
    hitstopRef.current = { remaining: durationMs, factor: 0.03 };
  }, []);

  const clear = useCallback(() => {
    initPool();
    for (let i = 0; i < MAX_PARTICLES; i++) {
      pool!.active[i] = 0;
    }
    freeList = Array.from({ length: MAX_PARTICLES }, (_, i) => i);
    shakesRef.current = [];
    hitstopRef.current = null;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    initPool();

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * DPR;
      canvas.height = rect.height * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    let lastTime = 0;

    const render = (time: number) => {
      if (!lastTime) lastTime = time;
      let dt = (time - lastTime) / 1000;
      lastTime = time;

      // Hitstop：減慢時間
      const hs = hitstopRef.current;
      if (hs && hs.remaining > 0) {
        dt *= hs.factor;
        hs.remaining -= (time - lastTime); // 用真實時間遞減
      } else {
        hitstopRef.current = null;
      }

      // 固定時間步長累積
      accRef.current += Math.min(dt, 0.1);

      const w = canvas.width / DPR;
      const h = canvas.height / DPR;

      ctx.clearRect(0, 0, w, h);

      ctx.save();

      // 應用震動
      let shakeX = 0, shakeY = 0;
      const shakes = shakesRef.current;
      for (let s = shakes.length - 1; s >= 0; s--) {
        const off = shakeOffset(shakes[s]!, dt);
        shakeX += off.x;
        shakeY += off.y;
        if (Math.exp(-shakes[s]!.decay * shakes[s]!.age) < 0.01) {
          shakes.splice(s, 1);
        }
      }
      ctx.translate(shakeX, shakeY);

      // 更新粒子（固定步長）
      while (accRef.current >= FIXED_DT) {
        accRef.current -= FIXED_DT;
        if (!pool) continue;
        for (let i = 0; i < MAX_PARTICLES; i++) {
          if (!pool.active[i]) continue;
          pool.life[i] -= FIXED_DT;
          if (pool.life[i] <= 0) {
            freeParticle(i);
            continue;
          }
          pool.x[i] += pool.vx[i] * FIXED_DT;
          pool.y[i] += pool.vy[i] * FIXED_DT;
          pool.vy[i] += 15 * FIXED_DT; // 重力
          pool.vx[i] *= 0.97;
          pool.vy[i] *= 0.97;
        }
      }

      // 渲染粒子（按類型批處理）
      if (pool) {
        const indices: number[] = [];
        for (let i = 0; i < MAX_PARTICLES; i++) {
          if (pool.active[i]) indices.push(i);
        }
        drawParticleBatch(ctx, pool, indices, 1);
      }

      ctx.restore();
      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return { canvasRef, spawnHit, spawnQi, spawnCombo, spawnGuard, triggerHitstop, clear };
}
