import { useCallback, useEffect, useRef } from 'react';
import type { MoveStance } from '@core/life/moveStance';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'splatter' | 'qi' | 'spark' | 'ink';
}

interface CombatCanvasState {
  particles: Particle[];
  shake: number;
  shakeDecay: number;
  slowMo: number;
}

function createParticle(
  x: number,
  y: number,
  type: Particle['type'],
  opts?: { count?: number; spread?: number; color?: string }
): Particle[] {
  const count = opts?.count ?? 1;
  const spread = opts?.spread ?? 30;
  const out: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 4;
    const life = 0.3 + Math.random() * 0.7;
    let color = opts?.color ?? '#1a1a1a';
    let size = 2 + Math.random() * 4;
    if (type === 'splatter') {
      color = `rgba(${140 + Math.random() * 60}, ${30 + Math.random() * 30}, ${30 + Math.random() * 20}, ${0.6 + Math.random() * 0.4})`;
      size = 1.5 + Math.random() * 5;
    } else if (type === 'qi') {
      color = `rgba(${40 + Math.random() * 40}, ${80 + Math.random() * 60}, ${60 + Math.random() * 40}, ${0.3 + Math.random() * 0.3})`;
      size = 2 + Math.random() * 6;
    } else if (type === 'spark') {
      color = `rgba(${200 + Math.random() * 55}, ${180 + Math.random() * 40}, ${80 + Math.random() * 40}, ${0.7 + Math.random() * 0.3})`;
      size = 1 + Math.random() * 2.5;
    }
    out.push({
      x: x + (Math.random() - 0.5) * spread,
      y: y + (Math.random() - 0.5) * spread,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (type === 'qi' ? 1.5 : 0),
      life,
      maxLife: life,
      size,
      color,
      type,
    });
  }
  return out;
}

function drawInkBlot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.random() * Math.PI);
  ctx.fillStyle = color;
  ctx.beginPath();
  const spikes = 5 + Math.floor(Math.random() * 4);
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? size : size * (0.4 + Math.random() * 0.4);
    const a = (Math.PI * i) / spikes;
    if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function useCombatCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<CombatCanvasState>({
    particles: [],
    shake: 0,
    shakeDecay: 0.92,
    slowMo: 1,
  });
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const spawnHit = useCallback((side: 'player' | 'foe', damage: number, stance?: MoveStance) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.width;
    const h = canvas.height;
    const st = stateRef.current;
    const x = side === 'player' ? w * 0.25 : w * 0.75;
    const y = h * 0.5;
    const intensity = Math.min(1, damage / 50);

    // 血濺
    st.particles.push(...createParticle(x, y, 'splatter', {
      count: Math.floor(3 + intensity * 12),
      spread: 20 + intensity * 30,
    }));

    // 火花
    if (damage > 15) {
      st.particles.push(...createParticle(x, y, 'spark', {
        count: Math.floor(2 + intensity * 6),
        spread: 15,
      }));
    }

    // 打擊震動
    st.shake = Math.max(st.shake, 2 + intensity * 6);

    // 架勢墨漬
    if (stance) {
      const inkColor = stance === 'shi'
        ? 'rgba(163, 58, 50, 0.35)'
        : stance === 'xu'
          ? 'rgba(58, 79, 122, 0.35)'
          : 'rgba(61, 92, 79, 0.35)';
      st.particles.push(...createParticle(x, y, 'ink', {
        count: 2,
        spread: 40,
        color: inkColor,
      }));
    }
  }, []);

  const spawnQi = useCallback((side: 'player' | 'foe') => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.width;
    const h = canvas.height;
    const x = side === 'player' ? w * 0.25 : w * 0.75;
    const y = h * 0.55;
    stateRef.current.particles.push(...createParticle(x, y, 'qi', {
      count: 5,
      spread: 25,
    }));
  }, []);

  const spawnCombo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.width;
    const h = canvas.height;
    const st = stateRef.current;
    // 大範圍金色粒子爆發
    st.particles.push(...createParticle(w * 0.5, h * 0.45, 'spark', {
      count: 20,
      spread: 80,
      color: 'rgba(200, 160, 60, 0.8)',
    }));
    st.shake = Math.max(st.shake, 4);
  }, []);

  const spawnGuard = useCallback((side: 'player' | 'foe') => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.width;
    const h = canvas.height;
    const x = side === 'player' ? w * 0.25 : w * 0.75;
    const y = h * 0.5;
    stateRef.current.particles.push(...createParticle(x, y, 'ink', {
      count: 4,
      spread: 20,
      color: 'rgba(61, 92, 79, 0.4)',
    }));
  }, []);

  const clearCanvas = useCallback(() => {
    stateRef.current.particles = [];
    stateRef.current.shake = 0;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const render = (time: number) => {
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = time;
      const st = stateRef.current;
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);

      ctx.clearRect(0, 0, w, h);

      // 應用震動
      if (st.shake > 0.1) {
        const sx = (Math.random() - 0.5) * st.shake;
        const sy = (Math.random() - 0.5) * st.shake;
        ctx.save();
        ctx.translate(sx, sy);
      }

      // 更新並繪製粒子
      for (let i = st.particles.length - 1; i >= 0; i--) {
        const p = st.particles[i];
        p.life -= dt / p.maxLife;
        if (p.life <= 0) {
          st.particles.splice(i, 1);
          continue;
        }

        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05; // 輕微重力
        p.vx *= 0.98;
        p.vy *= 0.98;

        const alpha = Math.max(0, p.life);
        const size = p.size * (0.5 + p.life * 0.5);

        if (p.type === 'ink' || p.type === 'splatter') {
          const colorWithAlpha = p.color.replace(/[\d.]+\)$/, `${alpha * 0.6})`);
          drawInkBlot(ctx, p.x, p.y, size, colorWithAlpha);
        } else {
          ctx.globalAlpha = alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }

      if (st.shake > 0.1) {
        ctx.restore();
        st.shake *= st.shakeDecay;
      }

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return { canvasRef, spawnHit, spawnQi, spawnCombo, spawnGuard, clearCanvas };
}
