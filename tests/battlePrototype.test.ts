import { describe, expect, it } from 'vitest';
import { battleMotionHeight, fitBattleBackdrop, BATTLE_CAMERA, BATTLE_PORTRAIT_GROUND } from '../src/spar/battleViewport';
import { makeBattlePreview } from '../src/prototypes/battleFixtures';
import { getRngState, initRng } from '../core/random';

describe('統一戰鬥原型攝影機', () => {
  it('test_battle_viewport_floor_alignment_aspect_and_full_coverage', () => {
    for(const width of [320,390,420])for(const height of [300,500,700]){
      for(const source of [{width:1000,height:500,ground:.845},{width:1000,height:1333,ground:BATTLE_PORTRAIT_GROUND}]){
      const rect=fitBattleBackdrop(width,height,source.width,source.height,source.ground);
      expect(rect.width/rect.height).toBeCloseTo(source.width/source.height);
      expect(rect.y+rect.height*source.ground).toBeCloseTo(height*BATTLE_CAMERA.ground);
      expect(rect.x).toBeLessThanOrEqual(0);
      expect(rect.y).toBeLessThanOrEqual(0);
      expect(rect.x+rect.width).toBeGreaterThanOrEqual(width);
      expect(rect.y+rect.height).toBeGreaterThanOrEqual(height-1e-8);
      }
      expect(battleMotionHeight(width)*.26).toBeGreaterThan(60);
      expect(battleMotionHeight(width)*.26).toBeLessThan(69);
    }
  });
});

describe('真引擎戰報嘅隔離原型', () => {
  it.each(['spar','event','event-boss'] as const)('test_battle_fixture_%s_deterministic_without_touching_player_rng', kind => {
    initRng(808);
    const before=getRngState();
    const a=makeBattlePreview(kind),b=makeBattlePreview(kind);
    expect(a).toEqual(b);
    expect(getRngState()).toBe(before);
    expect(a.rounds.length).toBeGreaterThan(0);
    expect(a.arts).toHaveLength(3);
    for(const round of a.rounds)for(const hit of round.hits){
      expect(hit.playerHp).toBeGreaterThanOrEqual(0);
      expect(hit.playerHp).toBeLessThanOrEqual(a.playerMaxHp);
      expect(hit.foeHp).toBeGreaterThanOrEqual(0);
      expect(hit.foeHp).toBeLessThanOrEqual(a.foeMaxHp);
    }
  });
});
