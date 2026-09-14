import { describe, expect, it } from 'vitest';
import { SparStage } from '../src/spar/engine';
import { ENEMY_SHADOW } from '../src/spar/rig';

/** 最小假 canvas：唔使真 DOM 繪圖，只驗證行過去邏輯 */
function mockCanvas(): HTMLCanvasElement {
  const ctx = {
    setTransform() {},
    clearRect() {},
    save() {},
    restore() {},
    translate() {},
    rotate() {},
    scale() {},
    beginPath() {},
    ellipse() {},
    arc() {},
    fill() {},
    stroke() {},
    fillRect() {},
    drawImage() {},
    createLinearGradient: () => ({ addColorStop() {} }),
    createRadialGradient: () => ({ addColorStop() {} }),
    measureText: () => ({ width: 10 }),
    fillText() {},
    fillStyle: '',
    strokeStyle: '',
    globalAlpha: 1,
    lineWidth: 1,
    font: '',
    textAlign: 'left',
    textBaseline: 'alphabetic',
    getTransform: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }),
  };
  return {
    getContext: () => ctx,
    width: 0,
    height: 0,
  } as unknown as HTMLCanvasElement;
}

function blankImg(): HTMLImageElement {
  return { width: 100, height: 100, complete: true } as HTMLImageElement;
}

describe('spar approach walk', () => {
  it('俠客向右行、敵人畫面 x 唔郁', () => {
    const stage = new SparStage({
      canvas: mockCanvas(),
      images: {
        heroIdle: blankImg(),
        heroAttack: blankImg(),
        enemies: [blankImg()],
        splash: blankImg(),
      },
      enemies: [ENEMY_SHADOW],
    });
    stage.resize(360, 218, 1);
    stage.settleIntro();

    const internal = stage as unknown as {
      heroX: number;
      enemies: { x: number; state: string }[];
    };
    const startHero = internal.heroX;
    const enemyXs = internal.enemies.map((e) => e.x);
    expect(startHero).toBeCloseTo(360 * 0.22, 0);
    expect(enemyXs[0]).toBeGreaterThan(360 * 0.65);

    for (let i = 0; i < 40; i++) stage.update(0.05); // 2 秒

    expect(internal.heroX).toBeGreaterThan(startHero + 80);
    expect(internal.enemies.map((e) => e.x)).toEqual(enemyXs);
    expect(internal.enemies.every((e) => e.state === 'hold' || e.state === 'spawn' || e.state === 'dead')).toBe(true);
  });
});
