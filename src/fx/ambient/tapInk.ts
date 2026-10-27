import { createRng } from './particles';

/** 點墨只屬操作回饋；參數不參與遊戲RNG或結算。 */
export const TAP_INK = {
  durationMs: 520,
  cooldownMs: 90,
  maxBursts: 3,
  maxTravel: 9,
  maxHoldMs: 650,
  radius: 44,
} as const;

export interface TapInkParticle {
  sprite: 'core' | 'wash' | 'speck';
  angle: number;
  distance: number;
  size: number;
  grow: number;
  alpha: number;
  delay: number;
  duration: number;
  rotation: number;
}

export interface TapInkBurst {
  x: number;
  y: number;
  started: number;
  particles: TapInkParticle[];
}

/** 落墨、吸水暈染及四粒短程飛墨；每次外觀可重現。 */
export function createTapInk(x: number, y: number, started: number, seed: number): TapInkBurst {
  const rng = createRng(seed);
  const rotation = rng() * Math.PI * 2;
  const particles: TapInkParticle[] = [
    { sprite: 'core', angle: 0, distance: 0, size: 15, grow: 1.18, alpha: .28, delay: 0, duration: 340, rotation },
    { sprite: 'wash', angle: 0, distance: 0, size: 22, grow: 1.8, alpha: .17, delay: 22, duration: 498, rotation: rotation + .7 },
  ];
  for (let i = 0; i < 4; i++) particles.push({
    sprite: 'speck', angle: rotation + i * Math.PI / 2 + rng() * .5,
    distance: 12 + rng() * 12, size: 2 + rng() * 2, grow: 1.08,
    alpha: .2 + rng() * .08, delay: 0, duration: 220 + rng() * 130, rotation: rng() * Math.PI,
  });
  return { x, y, started, particles };
}

/** 用絕對時間取樣，30／60／120Hz的墨滴路徑相同，不逐幀積分。 */
export function tapInkPose(p: TapInkParticle, elapsedMs: number) {
  const t = (elapsedMs - p.delay) / p.duration;
  if (t < 0 || t >= 1) return null;
  const spread = 1 - (1 - t) ** 3;
  const travel = p.distance * (1 - Math.exp(-5 * t));
  const attack = Math.min(1, (elapsedMs - p.delay + 8) / 22);
  return {
    x: Math.cos(p.angle) * travel,
    y: Math.sin(p.angle) * travel,
    size: p.size * (1 + (p.grow - 1) * spread),
    alpha: p.alpha * attack * (1 - t) ** 1.5,
  };
}

/** 連點時只保留最新三處墨跡，並移除已完成的尾韻。 */
export function appendTapInk(bursts: TapInkBurst[], next: TapInkBurst): TapInkBurst[] {
  return [...bursts.filter(b => next.started - b.started < TAP_INK.durationMs), next].slice(-TAP_INK.maxBursts);
}

/** 拖曳、長按及非主按鍵不作點擊；只讀事件資料。 */
export function isInkTap(dx: number, dy: number, heldMs: number): boolean {
  return Math.hypot(dx, dy) <= TAP_INK.maxTravel && heldMs >= 0 && heldMs <= TAP_INK.maxHoldMs;
}
