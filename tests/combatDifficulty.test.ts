import { describe, expect, it } from 'vitest';
import { buildFoe, eventFoeScale, startCombat } from '../core/life/combat';
import { createNewLife } from '../core/life/gameState';
import { initRng } from '../core/random';
import { startHuashanBracket } from '../core/life/huashan';
import { breakthroughChance, effectiveCultivationRate } from '../core/life/cultivation';

describe('combat difficulty', () => {
  it('scales foe power roughly linearly with player martial', () => {
    const early = buildFoe('剪徑', 'normal', { martial: 10, maxHp: 100, attack: 14 });
    const mid = buildFoe('剪徑', 'normal', { martial: 45, maxHp: 180, attack: 26 });
    const late = buildFoe('剪徑', 'normal', { martial: 80, maxHp: 260, attack: 38 });
    expect(mid.maxHp).toBeGreaterThan(early.maxHp);
    expect(late.maxHp).toBeGreaterThan(mid.maxHp);
    expect(late.attack).toBeGreaterThan(early.attack);
    // 線性：中期增量 ≈ 後期增量（允許少量偏差）
    const d1 = mid.maxHp - early.maxHp;
    const d2 = late.maxHp - mid.maxHp;
    expect(Math.abs(d1 - d2)).toBeLessThan(d1 * 0.55 + 20);
  });

  it('keeps normal foes clearly easier than player', () => {
    const scale = { martial: 50, maxHp: 200, attack: 30 };
    const normal = buildFoe('刀客', 'normal', scale);
    const boss = buildFoe('寨主', 'boss', scale);
    expect(normal.maxHp).toBeLessThan(scale.maxHp * 0.9);
    expect(normal.attack).toBeLessThan(scale.attack * 0.85);
    expect(boss.maxHp).toBeGreaterThan(normal.maxHp);
    expect(boss.attack).toBeGreaterThanOrEqual(normal.attack);
  });

  it('startCombat wires scaled foe from player stats', () => {
    initRng(5);
    const state = createNewLife(5);
    state.character.martial = 60;
    state.character.maxHealth = 220;
    state.character.health = 220;
    startCombat(state, {
      source: 'event',
      title: '試',
      foeName: '山賊',
      foePower: 'strong',
    });
    const player = state.pendingCombat!.player;
    const foe = state.pendingCombat!.foe;
    expect(foe.maxHp).toBeGreaterThan(player.maxHp * 0.35);
    // 強敵可有略高氣血及兩段武學，普通對手仍由上例檢查較弱。
    expect(foe.maxHp).toBeGreaterThan(player.maxHp);
    expect(foe.maxHp).toBeLessThan(player.maxHp * 1.5);
    expect(foe.actionHits).toBe(2);
    expect(foe.attack).toBeLessThan(player.attack);
  });

  it('test_江湖加壓_入門弱敵保留緩衝_高境首領增幅較大', () => {
    const multiplier = (tier: number, power: 'weak' | 'normal' | 'strong' | 'boss') =>
      eventFoeScale(tier, power).maxHp / eventFoeScale(tier, power, 1).maxHp;
    expect(multiplier(0, 'weak')).toBeCloseTo(1.6);
    expect(multiplier(1, 'strong')).toBeCloseTo(1.3);
    const growth = (power: 'normal' | 'boss') => multiplier(11, power) - multiplier(1, power);
    expect(growth('normal')).toBeGreaterThan(0);
    expect(growth('boss')).toBeGreaterThan(growth('normal'));
  });

  it('test_華山新籤_資深對手隨境界變強_入門對手保持可打', () => {
    const life = (tier: number) => {
      const state = createNewLife({ seed: 42, skipCoach: true });
      state.pending = null;
      state.character.martial = 65;
      state.character.cultivation.tier = tier;
      startHuashanBracket(state);
      return state.huashan!.contestants;
    };
    const early = life(1);
    const late = life(11);
    expect(late.ghost_0!.maxHealth).toBe(early.ghost_0!.maxHealth);
    expect(late.ghost_6!.maxHealth).toBeGreaterThan(early.ghost_6!.maxHealth * 2);
    expect(late.ghost_6!.maxHealth).toBeGreaterThan(late.ghost_4!.maxHealth);
  });

  it('test_修煉成長_保留首境突破率_中後期加大突破難度', () => {
    const state = createNewLife({ seed: 42, skipCoach: true });
    state.character.attributes.genGu = 60;
    state.character.attributes.wuXing = 60;
    expect(breakthroughChance(state)).toBeCloseTo(0.92);
    state.character.cultivation.tier = 11;
    expect(breakthroughChance(state)).toBeCloseTo(0.555);
    state.character.cultivation.tier = 13;
    expect(effectiveCultivationRate(state)).toBeGreaterThanOrEqual(1284000 / (24 * 3600));
  });
});
