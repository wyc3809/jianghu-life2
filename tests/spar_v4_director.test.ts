import { describe, expect, it } from 'vitest';
import { SparDirector, type SparHitInfo } from '../src/spar/v4/director';
import { enemyTierForCultivation, lookFromState } from '../src/spar/v4/look';
import { ENEMY_CLIPS, HERO_CLIPS, clipDuration } from '../data/spar/clips';
import { SPAR_BOSS, SPAR_TIMING } from '../data/spar/tuning';
import anchors from '../data/spar/anchors.generated.json';
import { createNewLife } from '../core/life/gameState';
import { initRng } from '../core/random';

const DT = 1 / 60;

function run(d: SparDirector, seconds: number) {
  for (let t = 0; t < seconds; t += DT) d.update(DT);
}

function makeDirector() {
  const hits: SparHitInfo[] = [];
  const swings: string[] = [];
  const d = new SparDirector({ onHit: (h) => hits.push(h), onSwing: (c) => swings.push(c) });
  d.setViewport(900);
  return { d, hits, swings };
}

describe('spar v4 director (演武台節奏)', () => {
  it('test_minion_cycle_takes_about_2_5_seconds_and_hits_once', () => {
    const { d, hits } = makeDirector();
    const T = SPAR_TIMING;
    const cycle = T.nextSec + T.walkSec + T.windupSec + T.strikeSec + T.recoverSec;
    expect(cycle).toBeCloseTo(2.5, 5);
    run(d, cycle * 4 + 0.05);
    expect(hits.length).toBe(4);
    expect(hits.every((h) => !h.boss && h.final && h.hitNo === 1)).toBe(true);
  });

  it('test_boss_every_15_minions_takes_3_hits_with_ultimate_last', () => {
    const { d, hits, swings } = makeDirector();
    run(d, 2.5 * SPAR_BOSS.every + 6);
    const bossHits = hits.filter((h) => h.boss);
    expect(hits.slice(0, SPAR_BOSS.every).every((h) => !h.boss)).toBe(true);
    expect(bossHits.slice(0, 3).map((h) => h.hitNo)).toEqual([1, 2, 3]);
    expect(bossHits.slice(0, 3).map((h) => h.final)).toEqual([false, false, true]);
    expect(bossHits[2]!.clip).toBe('ultimate');
    expect(swings).toContain('combo');
    expect(swings).toContain('ultimate');
    // 頭目之後重新計小兵
    expect(d.kills).toBeLessThan(SPAR_BOSS.every);
  });

  it('test_tap_enemy_dashes_and_strikes_without_windup', () => {
    const { d, hits } = makeDirector();
    run(d, SPAR_TIMING.nextSec + 0.1); // 行路中
    expect(d.phase).toBe('walk');
    expect(d.tapEnemy()).toBe(true);
    expect(d.phase).toBe('dash');
    run(d, SPAR_TIMING.dashSec + SPAR_TIMING.strikeSec + 0.02);
    expect(hits.length).toBe(1);
    // 交手中再撳無效
    expect(d.tapEnemy()).toBe(false);
  });

  it('test_limp_and_arm_hurt_flags_pick_injury_clips', () => {
    const { d } = makeDirector();
    d.setFlags({ limp: true, armHurt: true, reach: 170 });
    run(d, 2.5 * 2);
    const seen = new Set<string>();
    for (let t = 0; t < 2.5; t += DT) {
      d.update(DT);
      seen.add(d.heroClip);
    }
    expect(seen.has('walk-limp')).toBe(true);
    expect(seen.has('idle-hurt')).toBe(true);
    expect(seen.has('walk')).toBe(false);
  });

  it('test_walk_scrolls_world_for_parallax', () => {
    const { d } = makeDirector();
    run(d, 2.5);
    expect(d.scroll).toBeGreaterThan(100);
  });
});

describe('spar v4 data (動作表同錨點)', () => {
  it('test_anchor_frame_counts_match_clip_table', () => {
    for (const [id, def] of Object.entries(HERO_CLIPS)) {
      expect((anchors.hero as Record<string, unknown[]>)[id]?.length, id).toBe(def.frames);
    }
    for (const [key, clips] of Object.entries(anchors.enemy)) {
      for (const [id, def] of Object.entries(ENEMY_CLIPS)) {
        expect((clips as Record<string, unknown[]>)[id]?.length, `${key}/${id}`).toBe(def.frames);
      }
    }
    expect(Object.keys(anchors.enemy)).toHaveLength(12);
  });

  it('test_timing_matches_clip_lengths', () => {
    expect(clipDuration(HERO_CLIPS.windup)).toBeCloseTo(SPAR_TIMING.windupSec, 5);
    expect(clipDuration(HERO_CLIPS.strike)).toBeCloseTo(SPAR_TIMING.strikeSec, 5);
    expect(clipDuration(HERO_CLIPS.recover)).toBeCloseTo(SPAR_TIMING.recoverSec, 5);
    expect(clipDuration(ENEMY_CLIPS.break)).toBeCloseTo(SPAR_TIMING.recoverSec, 5);
  });
});

describe('spar v4 look (同遊戲狀態連動)', () => {
  it('test_enemy_tier_follows_cultivation_tier', () => {
    expect(enemyTierForCultivation(0)).toBe(1);
    expect(enemyTierForCultivation(5)).toBe(6);
    expect(enemyTierForCultivation(6)).toBe(6);
  });

  it('test_look_reads_sect_gear_injuries_and_bleeding', () => {
    initRng(7);
    const s = createNewLife(7);
    s.character.sectId = 'sect_wudang';
    s.character.equipment.armor = 'x';
    s.character.injuries = [{ part: 'leg', tier: 'light', monthsLeft: 2, cause: 't' }];
    s.character.conditions = [{ id: 'bleeding', name: '流血不止', monthsLeft: 2, severity: 1 }];
    s.character.location = '華山';
    s.month = 10;
    const look = lookFromState(s);
    expect(look.robe).toBe('#86A7A2');
    expect(look.armor).toBe(true);
    expect(look.limp).toBe(true);
    expect(look.armHurt).toBe(false);
    expect(look.bleeding).toBe(true);
    expect(look.place).toBe('mountain');
    expect(look.season).toBe('autumn');
  });
});
