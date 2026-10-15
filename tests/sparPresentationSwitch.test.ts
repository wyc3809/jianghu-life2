import { describe, expect, it } from 'vitest';
import { SparStage } from '../src/spar/engine';

/** 換攝影機唔應重開正在進行嘅攻擊、步行或者敵人。 */
describe('演武全屏攝影機', () => {
  it('test_spar_presentation_switch_preserves_live_combat_and_actors', () => {
    const ctx = new Proxy({}, { get: () => () => ({}) });
    const canvas = { getContext: () => ctx, width: 0, height: 0 } as unknown as HTMLCanvasElement;
    const img = { width: 616, height: 788 } as HTMLImageElement;
    let strikes = 0;
    const stage = new SparStage({ canvas, images: { heroIdle: img, heroAttack: img, enemies: [img], splash: img },
      combat: { heroStrike: () => { strikes++; return { dmg: 1, crit: false, heal: 0, killed: false }; },
        foeStrike: () => ({ dmg: 0, heroDown: false }), nextFoe: () => ({ boss: true }),
        foeDefeated: () => ({ coins: 0 }), heroRecovered: () => {} } });
    stage.resize(390, 218, 1);
    stage.settleIntro();
    for (let i = 0; i < 150; i++) stage.update(1 / 60);
    const live = stage as unknown as { heroX: number; enemies: object[]; walkT: number; attackT: number | null };
    const before = { heroX: live.heroX, enemies: live.enemies, walkT: live.walkT, attackT: live.attackT, strikes };
    stage.setPresentation('battle', img);
    stage.resize(390, 500, 2);
    stage.setPresentation('stage');
    stage.resize(390, 218, 2);
    expect(live.enemies).toBe(before.enemies);
    expect(live.heroX).toBe(before.heroX);
    expect(live.walkT).toBe(before.walkT);
    expect(live.attackT).toBe(before.attackT);
    expect(strikes).toBe(before.strikes);
    for (let i = 0; i < 180; i++) stage.update(1 / 60);
    expect(strikes).toBeGreaterThan(before.strikes);
  });
});
