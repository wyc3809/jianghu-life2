import { describe, expect, it } from 'vitest';
import {
  buildCombatInkFx,
  combatFxNeedsShock,
  snapCombatVitals,
} from '../core/life/combatInkFx';
import type { PendingCombat } from '../interfaces/lifeEngine';

function fakeCombat(partial?: Partial<PendingCombat>): PendingCombat {
  return {
    id: 'c1',
    source: 'road',
    title: '狹路',
    turn: 1,
    phase: 'player',
    player: {
      name: '我',
      hp: 100,
      maxHp: 100,
      qi: 40,
      maxQi: 50,
      attack: 10,
      defense: 5,
      hitBonus: 0,
      evasion: 0,
      qiRegen: 2,
      blind: 0,
      isPlayer: true,
      stun: 0,
      bleedDamage: 0,
      bleedTurns: 0,
      defenseMod: 0,
      reflect: 0,
      chargeBonus: 0,
    },
    foe: {
      name: '匪',
      hp: 80,
      maxHp: 80,
      qi: 20,
      maxQi: 20,
      attack: 8,
      defense: 4,
      hitBonus: 0,
      evasion: 0,
      qiRegen: 1,
      blind: 0,
      isPlayer: false,
      stun: 0,
      bleedDamage: 0,
      bleedTurns: 0,
      defenseMod: 0,
      reflect: 0,
      chargeBonus: 0,
    },
    log: ['交手開始'],
    usedExternalSkillIds: [],
    ...partial,
  };
}

describe('combatInkFx', () => {
  it('emits move annotate without vitals when no prev', () => {
    const fx = buildCombatInkFx({
      prev: null,
      next: fakeCombat(),
      moveName: '平砍',
      stance: 'shi',
    });
    expect(fx.some((f) => f.kind === 'move' && f.text.includes('平砍'))).toBe(true);
    expect(fx.every((f) => f.kind === 'move')).toBe(true);
  });

  it('emits foe hp and player qi from diffs', () => {
    const prevCombat = fakeCombat();
    const prev = snapCombatVitals(prevCombat);
    const next = fakeCombat({
      turn: 2,
      player: { ...prevCombat.player, qi: 32, hp: 100 },
      foe: { ...prevCombat.foe, hp: 55 },
      log: [...prevCombat.log, '你「平砍」——命中', '匪氣血 −25'],
    });
    const fx = buildCombatInkFx({
      prev,
      next,
      moveName: '平砍',
      stance: 'shi',
    });
    expect(fx.some((f) => f.side === 'foe' && /氣血 −/.test(f.text))).toBe(true);
    expect(fx.some((f) => f.kind === 'qi' && /內力 −/.test(f.text))).toBe(true);
  });

  it('marks crit/danger for shock', () => {
    const prevCombat = fakeCombat();
    const prev = snapCombatVitals(prevCombat);
    const next = fakeCombat({
      foe: { ...prevCombat.foe, hp: 20 },
      log: [...prevCombat.log, '你一式重創要害'],
    });
    const fx = buildCombatInkFx({ prev, next, moveName: '殺招', stance: 'shi' });
    expect(combatFxNeedsShock(fx)).toBe(true);
    expect(fx.some((f) => f.kind === 'crit' || f.text.includes('危'))).toBe(true);
  });

  it('caps at 4 fx entries', () => {
    const prevCombat = fakeCombat();
    const prev = snapCombatVitals(prevCombat);
    const next = fakeCombat({
      player: { ...prevCombat.player, hp: 70, qi: 10 },
      foe: { ...prevCombat.foe, hp: 40 },
      log: [
        ...prevCombat.log,
        '你「平砍」——命中',
        '匪以架擋',
        '匪反擊重創',
        '你療傷回復',
      ],
    });
    const fx = buildCombatInkFx({
      prev,
      next,
      moveName: '平砍',
      stance: 'jia',
    });
    expect(fx.length).toBeLessThanOrEqual(4);
  });
});
