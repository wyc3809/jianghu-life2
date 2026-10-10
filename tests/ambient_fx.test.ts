import { describe, expect, it } from 'vitest';
import {
  createRng,
  mistOffset,
  particleAlpha,
  particleSize,
  spawnInkMote,
  spawnSeasonParticle,
  spawnSplash,
  stepParticles,
} from '../src/fx/ambient/particles';
import { AMBIENT_TUNING, type AmbientSeason } from '../src/fx/ambient/tuning';

const W = 400;
const H = 800;
const SEASONS: AmbientSeason[] = ['spring', 'summer', 'autumn', 'winter'];

describe('環境特效粒子', () => {
  it('test_ambient_same_seed_same_particles', () => {
    const a = spawnSeasonParticle('spring', W, H, createRng(5));
    const b = spawnSeasonParticle('spring', W, H, createRng(5));
    expect(a).toEqual(b);
  });

  it('test_ambient_each_season_spawns_its_own_kind', () => {
    const kinds = SEASONS.map((s) => spawnSeasonParticle(s, W, H, createRng(1)).kind);
    expect(kinds).toEqual(['petal', 'rain', 'leaf', 'snow']);
  });

  it('test_ambient_falling_particles_enter_from_top', () => {
    const rng = createRng(3);
    for (let i = 0; i < 50; i++) {
      const p = spawnSeasonParticle('winter', W, H, rng);
      expect(p.y).toBeLessThan(0);
      expect(p.vy).toBeGreaterThan(0);
    }
  });

  it('test_ambient_scatter_fills_the_scene', () => {
    const rng = createRng(4);
    for (let i = 0; i < 50; i++) {
      const p = spawnSeasonParticle('autumn', W, H, rng, true);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(H);
      expect(p.age).toBeLessThan(p.life);
    }
  });

  it('test_ambient_ink_motes_stay_off_the_centre', () => {
    const rng = createRng(9);
    const band = W * AMBIENT_TUNING.ink.edgeBand;
    for (let i = 0; i < 200; i++) {
      const p = spawnInkMote(W, H, rng);
      const nearSide = p.x <= band || p.x >= W - band;
      const nearTopBottom = p.y <= band || p.y >= H - band;
      expect(nearSide || nearTopBottom).toBe(true);
    }
  });

  it('test_ambient_splash_is_burst_and_fades_out', () => {
    const parts = spawnSplash(100, 200, createRng(2));
    expect(parts.length).toBe(2 + AMBIENT_TUNING.splash.droplets);
    expect(parts.every((p) => p.burst)).toBe(true);
    let left = parts;
    for (let i = 0; i < 120; i++) left = stepParticles(left, 1 / 60, W, H);
    expect(left.length).toBe(0);
  });

  it('test_ambient_splash_grows_then_droplets_slow_down', () => {
    const [splash, , drop] = spawnSplash(100, 200, createRng(2));
    const s0 = particleSize(splash);
    const v0 = Math.hypot(drop.vx, drop.vy);
    stepParticles([splash, drop], 0.2, W, H);
    expect(particleSize(splash)).toBeGreaterThan(s0);
    expect(Math.hypot(drop.vx, drop.vy)).toBeLessThan(v0);
  });

  it('test_ambient_alpha_fades_in_and_out', () => {
    const p = spawnSeasonParticle('spring', W, H, createRng(6));
    p.age = 0;
    expect(particleAlpha(p)).toBe(0);
    p.age = p.life / 2;
    expect(particleAlpha(p)).toBeCloseTo(p.alpha);
    p.age = p.life;
    expect(particleAlpha(p)).toBe(0);
  });

  it('test_ambient_particles_leaving_bottom_are_removed', () => {
    const p = spawnSeasonParticle('winter', W, H, createRng(8));
    p.y = H + 100;
    p.life = 100;
    expect(stepParticles([p], 0.01, W, H)).toHaveLength(0);
  });

  it('test_ambient_mist_offset_wraps_within_tile', () => {
    for (const t of [0, 3.3, 100, 9999]) {
      const o = mistOffset(1, t, 300);
      expect(o).toBeGreaterThanOrEqual(0);
      expect(o).toBeLessThan(300);
    }
    expect(mistOffset(0, 10, 300)).toBeCloseTo(AMBIENT_TUNING.mist.layers[0].speed * 10);
  });
});
