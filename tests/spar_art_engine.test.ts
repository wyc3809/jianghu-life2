import { describe, expect, it } from 'vitest';
import { SparStage, type SparCombatHooks } from '../src/spar/engine';

/** 唔畫嘢嘅假 canvas：只測 update（招式時間軸、結算次數） */
function fakeCanvas(): HTMLCanvasElement {
  const ctx = new Proxy({}, { get: () => () => ({}) });
  return { getContext: () => ctx, width: 0, height: 0 } as unknown as HTMLCanvasElement;
}

function run(nextArt: string | null) {
  let strikes = 0;
  const combat: SparCombatHooks = {
    heroStrike: () => {
      strikes++;
      return { dmg: 100, crit: false, heal: 0, killed: false };
    },
    foeStrike: () => ({ dmg: 0, heroDown: false }),
    nextFoe: () => ({ boss: false }),
    foeDefeated: () => ({ coins: 0 }),
    heroRecovered: () => {},
    nextArt: () => nextArt,
  };
  const img = { width: 616, height: 788 } as HTMLImageElement;
  const stage = new SparStage({ canvas: fakeCanvas(), images: { heroIdle: img, heroAttack: img, heroAtk: [img, img, img], enemies: [img], splash: img }, combat });
  stage.resize(390, 240, 1);
  // 6 秒：行埋去、出幾招；浮字會過期，逐幀收集
  const seen = new Set<{ text: string; kind?: string }>();
  for (let i = 0; i < 360; i++) {
    stage.update(1 / 60);
    for (const f of (stage as unknown as { floaters: { text: string; kind?: string }[] }).floaters) seen.add(f);
  }
  return { strikes, floaters: [...seen] };
}

describe('演武台外功動畫（第 25 項）', () => {
  it('test_spar_art_engine_one_settlement_per_art_and_split_numbers', () => {
    const { strikes, floaters } = run('art_rain_sword');
    expect(strikes).toBeGreaterThan(0);
    // 聽雨劍意三段：同一次結算分 33／33／34
    const nums = floaters.filter((f) => f.kind === 'dmg' || f.kind === 'crit').map((f) => Number(f.text));
    expect(nums).toContain(33);
    expect(nums).toContain(34);
  });

  it('test_spar_art_engine_without_choreo_uses_plain_strike', () => {
    const { strikes, floaters } = run(null);
    expect(strikes).toBeGreaterThan(0);
    const nums = floaters.filter((f) => f.kind === 'dmg').map((f) => Number(f.text));
    expect(nums.length).toBeGreaterThan(0);
    expect(nums.every((n) => n === 100)).toBe(true);
  });
});
