import { describe, expect, it } from 'vitest';
import { createNewLife } from '../core/life/gameState';
import { SparRounds, sparRoundMoves } from '../core/life/sparRounds';
import { SparDuel, sparHeroStats, sparRand } from '../core/life/sparDuel';
import { SparStage, type SparCombatHooks } from '../src/spar/engine';

function life(volumes = [1, 2, 3]) {
  const s = createNewLife({ seed: 42, skipCoach: true });
  const c = s.character;
  c.skills = ['art_river_fist', 'art_rain_sword', 'art_iron_body'];
  c.equippedArts = ['art_river_fist', null, null, null, null];
  c.supportArts = { internal: 'art_iron_body', qinggong: null };
  c.volumes = { art_river_fist: volumes, art_rain_sword: [1, 3, 7] };
  return s;
}

describe('演武完整回合', () => {
  it.each([1, 3, 7])('test_spar_round_已學%i招_同回合按卷序全部使出後只還擊一次', count => {
    const c = life(Array.from({ length: count }, (_, i) => i + 1)).character;
    const rounds = new SparRounds();
    const before = JSON.stringify(c);
    for (let round = 1; round <= 2; round++) {
      for (let vol = 1; vol <= count; vol++) {
        expect(rounds.round).toBe(round);
        expect(rounds.phase).toBe('hero');
        expect(rounds.beginMove(c)?.volume).toBe(vol);
        expect(rounds.commitHeroMove()).toBe(true);
        expect(rounds.commitHeroMove()).toBe(false);
      }
      expect(rounds.phase).toBe('foe');
      expect(rounds.beginMove(c)).toBeNull();
      expect(rounds.commitFoeMove()).toBe(true);
      expect(rounds.commitFoeMove()).toBe(false);
    }
    expect(JSON.stringify(c)).toBe(before);
  });

  it('test_spar_round_缺卷及兩門外功_只出已學招式並逐回合換門', () => {
    const c = life([6, 1, 6]).character;
    c.equippedArts![1] = 'art_rain_sword';
    const rounds = new SparRounds();
    const seen: (number | undefined)[] = [];
    for (let i = 0; i < 2; i++) {
      while (rounds.phase === 'hero') {
        const move = rounds.beginMove(c)!;
        expect(move.artId).toBe(i ? 'art_rain_sword' : 'art_river_fist');
        seen.push(move.volume);
        rounds.commitHeroMove();
      }
      rounds.commitFoeMove();
    }
    expect(seen).toEqual([1, 6, 1, 3, 7]);
  });

  it('test_spar_round_舊檔及無外功_卷一或基本攻擊不冒充內功', () => {
    const c = life().character;
    delete c.volumes;
    expect(sparRoundMoves(c, 0).map(m => m.volume)).toEqual([1]);
    c.equippedArts = [null, null, null, null, null];
    expect(sparRoundMoves(c, 0)).toEqual([{ moveName: '基本攻擊', power: 1 }]);
  });

  it('test_spar_round_中途換武學_先讓敵人還擊不免費重開連招', () => {
    const c = life().character, rounds = new SparRounds();
    rounds.beginMove(c); rounds.commitHeroMove();
    c.equippedArts![0] = 'art_rain_sword';
    rounds.updateLoadout(c);
    expect(rounds.phase).toBe('foe');
    expect(rounds.beginMove(c)).toBeNull();
    rounds.commitFoeMove();
    expect(rounds.beginMove(c)?.artId).toBe('art_rain_sword');
    expect(rounds.activeMove?.volume).toBe(1);
  });

  it('test_spar_round_敵人中途倒下_剩餘招式不打下一人', () => {
    const c = life().character, rounds = new SparRounds();
    rounds.beginMove(c); rounds.commitHeroMove();
    rounds.nextOpponent();
    expect(rounds.round).toBe(1);
    expect(rounds.beginMove(c)?.volume).toBe(1);
  });
});

type Event = { side: 'hero' | 'foe'; round: number; volume?: number };
function fakeCanvas(): HTMLCanvasElement {
  return { getContext: () => new Proxy({}, { get: () => () => ({}) }), width: 0, height: 0 } as unknown as HTMLCanvasElement;
}
function engineBattle(count: number, presentation: 'stage' | 'battle' = 'stage', step = 1 / 60, remount = false) {
  const s = life(Array.from({ length: count }, (_, i) => i + 1));
  const duel = new SparDuel({ ...sparHeroStats(s), maxHp: 1e8 }, 1, sparRand(42, 1));
  duel.foe!.maxHp = duel.foeHp = 1e8;
  const events: Event[] = [];
  let stage: SparStage;
  const combat: SparCombatHooks = {
    heroMayAttack: () => duel.rounds.phase === 'hero' && !stage.foeAttackActive,
    foeMayAttack: () => duel.rounds.phase === 'foe' && !stage.heroAttackActive,
    nextArt: () => duel.rounds.beginMove(s.character)?.artId,
    heroStrike: () => {
      const move = duel.rounds.activeMove;
      if (!move || !duel.rounds.commitHeroMove()) throw Error('重複命中或未起手');
      events.push({ side: 'hero', round: duel.rounds.round, volume: move.volume });
      return duel.heroStrike(move.power);
    },
    foeStrike: () => {
      events.push({ side: 'foe', round: duel.rounds.round });
      expect(duel.rounds.commitFoeMove()).toBe(true);
      return duel.foeStrike();
    },
    nextFoe: () => ({ boss: false }), foeDefeated: () => ({ coins: 0 }), heroRecovered: () => {},
  };
  const make = () => {
    const img = { width: 616, height: 788 } as HTMLImageElement;
    const engine = new SparStage({ canvas: fakeCanvas(), images: { heroIdle: img, heroAttack: img, heroAtk: [img, img, img], enemies: [img], splash: img }, combat, presentation });
    engine.resize(390, 240, 1); engine.settleIntro(); return engine;
  };
  stage = make();
  let remounted = false;
  for (let frame = 0; frame < 10000 && events.filter(e => e.side === 'foe').length < 2; frame++) {
    stage.update(step);
    if (remount && !remounted && events.length === count && duel.rounds.phase === 'foe') {
      stage = make(); remounted = true;
    }
  }
  return { events, remounted };
}

describe('實際Canvas引擎的回合交接', () => {
  it.each([1, 3, 7])('test_spar_engine_%i招_兩完整回合沒有提前還擊或多結算', count => {
    const { events } = engineBattle(count);
    const expected = [1, 2].flatMap(round => [
      ...Array.from({ length: count }, (_, i) => ({ side: 'hero', round, volume: i + 1 })),
      { side: 'foe', round },
    ]);
    expect(events).toEqual(expected);
  });
  it('test_spar_engine_加速及交手演出_不改回合順序', () => {
    expect(engineBattle(7, 'battle', 1 / 30).events).toEqual(engineBattle(7).events);
  });
  it('test_spar_engine_切頁重掛時等待敵人_不能重新出免費連招', () => {
    const result = engineBattle(3, 'stage', 1 / 60, true);
    expect(result.remounted).toBe(true);
    expect(result.events).toEqual(engineBattle(3).events);
  });
});
