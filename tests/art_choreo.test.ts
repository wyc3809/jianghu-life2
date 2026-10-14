import { describe, expect, it } from 'vitest';
import { ChoreoRun, sampleTrack, splitDamage, type ArtChoreo, type ArtSpriteKey } from '../src/fx/art/choreo';
import { ART_CHOREOS, choreoForArt } from '../src/fx/art/recipes';
import { ArtFxLayer, ART_SPRITE_KEYS, makeAnchors } from '../src/fx/art/fxLayer';
import { getSkillDef } from '../data/skills/catalog';
import { createRng } from '../core/random';

const spritesOf = (c: ArtChoreo): Set<ArtSpriteKey> =>
  new Set(c.events.flatMap((e) => (e.kind === 'fx' ? [e.fx.sprite] : [])));

/** 動作特徵：跳幾高、閃現、衝幾遠、後撤、轉身、命中數、有冇飛行暗器 */
function motionSignature(c: ArtChoreo): string {
  let maxY = 0;
  let minAlpha = 1;
  let maxReach = 0;
  let minX = 0;
  let spin = 0;
  let prevRot = 0;
  for (let t = 0; t <= c.dur; t += 0.01) {
    const s = sampleTrack(c.hero, t);
    maxY = Math.max(maxY, s.y);
    minAlpha = Math.min(minAlpha, s.alpha);
    maxReach = Math.max(maxReach, s.g + s.x);
    minX = Math.min(minX, s.x + s.g);
    spin += Math.abs(s.rot - prevRot) > 90 ? 0 : Math.abs(s.rot - prevRot);
    prevRot = s.rot;
  }
  const hits = c.events.filter((e) => e.kind === 'hit').length;
  const projectile = c.events.some((e) => e.kind === 'fx' && e.fx.to);
  const foeAir = Math.max(...Array.from({ length: Math.ceil(c.dur * 100) }, (_, i) => sampleTrack(c.foe, i / 100).y));
  return [
    maxY > 1 ? 'high' : maxY > 0.2 ? 'hop' : 'ground',
    minAlpha < 0.5 ? 'blink' : '',
    maxReach > 1.5 ? 'through' : maxReach > 0.7 ? 'melee' : 'range',
    minX < -0.3 ? 'retreat' : '',
    spin > 300 ? 'spin' : '',
    `h${hits}`,
    projectile ? 'proj' : '',
    foeAir > 0.6 ? 'juggle' : foeAir > 0.2 ? 'launch' : '',
  ].join('|');
}

describe('外功招式編排（第 25 項）', () => {
  it('test_art_choreo_track_interpolates_and_holds', () => {
    const keys = [{ t: 0.5, g: 1, pose: 'strike' as const }, { t: 1, g: 0, pose: 'idle' as const }];
    expect(sampleTrack(keys, 0).g).toBe(0);
    expect(sampleTrack(keys, 0.25).g).toBeCloseTo(0.5);
    expect(sampleTrack(keys, 0.5).pose).toBe('strike');
    expect(sampleTrack(keys, 2).g).toBe(0);
  });

  it('test_art_choreo_split_damage_sums_to_total', () => {
    for (const total of [1, 7, 100, 12345]) {
      const parts = splitDamage(total, [0.33, 0.33, 0.34]);
      expect(parts.reduce((a, b) => a + b, 0)).toBe(total);
      expect(parts.every((p) => p >= 0)).toBe(true);
    }
  });

  it('test_art_choreo_first_batch_has_eight_external_arts', () => {
    expect(ART_CHOREOS).toHaveLength(8);
    for (const c of ART_CHOREOS) {
      const def = getSkillDef(c.artId);
      expect(def?.move, c.artId).toBeTruthy();
      expect(choreoForArt(c.artId)).toBe(c);
    }
  });

  it('test_art_choreo_each_recipe_is_well_formed', () => {
    for (const c of ART_CHOREOS) {
      const hits = c.events.filter((e) => e.kind === 'hit');
      expect(hits.length, c.artId).toBeGreaterThan(0);
      const shares = hits.reduce((n, e) => n + (e.kind === 'hit' ? e.share : 0), 0);
      expect(shares, c.artId).toBeCloseTo(1, 2);
      for (const track of [c.hero, c.foe]) {
        for (let i = 1; i < track.length; i++) expect(track[i]!.t, c.artId).toBeGreaterThanOrEqual(track[i - 1]!.t);
        expect(track.at(-1)!.t, c.artId).toBeLessThanOrEqual(c.dur);
      }
      for (const e of c.events) expect(e.t, c.artId).toBeLessThanOrEqual(c.dur);
      // 收招一定返原位、睇得見、企直
      const end = sampleTrack(c.hero, c.dur);
      expect(end.g + end.x, c.artId).toBeCloseTo(0);
      expect(end.y, c.artId).toBeCloseTo(0);
      expect(end.alpha, c.artId).toBeCloseTo(1);
      expect(((end.rot % 360) + 360) % 360, c.artId).toBeCloseTo(0);
      const foeEnd = sampleTrack(c.foe, c.dur);
      expect(foeEnd.x + foeEnd.y, c.artId).toBeCloseTo(0);
      for (const sp of spritesOf(c)) expect(ART_SPRITE_KEYS, c.artId).toContain(sp);
    }
  });

  it('test_art_choreo_every_art_moves_differently_not_just_colour', () => {
    // 動作特徵兩兩唔同
    const sigs = ART_CHOREOS.map(motionSignature);
    expect(new Set(sigs).size).toBe(ART_CHOREOS.length);
    expect(new Set(ART_CHOREOS.map((c) => c.motion)).size).toBe(ART_CHOREOS.length);
    // 每套都有其他套冇用嘅招牌特效（按功夫名：浪、裂石、雨、雷、雲、針、風、棋）
    for (const c of ART_CHOREOS) {
      const others = new Set(ART_CHOREOS.filter((o) => o !== c).flatMap((o) => [...spritesOf(o)]));
      const own = [...spritesOf(c)].filter((s) => !others.has(s));
      expect(own.length, c.artId).toBeGreaterThan(0);
    }
  });

  it('test_art_choreo_run_fires_each_event_once', () => {
    for (const c of ART_CHOREOS) {
      const run = new ChoreoRun(c);
      const seen: number[] = [];
      while (!run.done) for (const e of run.advance(1 / 60)) seen.push(e.t);
      expect(seen).toHaveLength(c.events.length);
    }
  });
});

describe('外功特效層', () => {
  const anchors = makeAnchors({ unitH: 100, heroFootX: 100, heroFootY: 300, foeFootX: 300, foeFootY: 300 });
  const rand = () => {
    const r = createRng(5);
    return () => r.nextFloat();
  };

  it('test_art_fx_projectile_reaches_target', () => {
    const layer = new ArtFxLayer(rand());
    layer.spawn({ sprite: 'needle', at: 'heroHand', to: 'foe', life: 0.2, size: 0.2 }, anchors);
    layer.step(0.2, anchors);
    const [p] = layer.snapshot(anchors, 'front');
    expect(p!.x).toBeCloseTo(anchors.foe.x, 0);
    expect(p!.y).toBeCloseTo(anchors.foe.y, 0);
  });

  it('test_art_fx_falling_stone_stops_on_floor', () => {
    const layer = new ArtFxLayer(rand());
    layer.spawn({ sprite: 'stone-black', at: 'foeGround', dy: 0.9, floorDy: 0, vy: -9, life: 1, size: 0.17, layer: 'back' }, anchors);
    for (let i = 0; i < 30; i++) layer.step(1 / 60, anchors);
    const [p] = layer.snapshot(anchors, 'back');
    expect(p!.y).toBeCloseTo(anchors.foeGround.y);
  });

  it('test_art_fx_quiet_halves_count_and_stagger_delays', () => {
    const layer = new ArtFxLayer(rand());
    layer.spawn({ sprite: 'rain', at: 'sky', count: 10, stagger: 0.1, life: 2, size: 0.05 }, anchors, true);
    expect(layer.count).toBe(5);
    layer.step(0.05, anchors);
    expect(layer.snapshot(anchors, 'front')).toHaveLength(1);
  });

  it('test_art_fx_expired_particles_removed', () => {
    const layer = new ArtFxLayer(rand());
    layer.spawn({ sprite: 'spark', at: 'foe', count: 4, life: 0.3, size: 0.1 }, anchors);
    layer.step(0.31, anchors);
    expect(layer.count).toBe(0);
  });
});
