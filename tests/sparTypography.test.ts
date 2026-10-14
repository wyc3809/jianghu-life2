import { expect, it } from 'vitest';
import { SparStage } from '../src/spar/engine';

it('test_spar_all_floating_text_uses_ui_font_even_with_bitmap_glyphs_loaded', () => {
  const family = 'Noto Sans CJK TC, sans-serif';
  const labels: { text: string; font: string }[] = [];
  const bitmaps: unknown[] = [];
  const ctx = {
    font: '', save() {}, restore() {}, beginPath() {}, arc() {}, fill() {}, stroke() {},
    measureText: () => ({ width: 56 }),
    drawImage: (img: unknown) => bitmaps.push(img),
    fillText(text: string) { labels.push({ text, font: this.font }); }, strokeText() {},
  };
  const paper = { width: 100, height: 50 } as HTMLImageElement;
  const stage = new SparStage({
    canvas: { getContext: () => ctx } as unknown as HTMLCanvasElement,
    uiFontFamily: family,
    images: { heroIdle: paper, heroAttack: paper, enemies: [], splash: paper,
      ui: { splashPaper: paper, xiuwei: {} as HTMLImageElement, glyphs: { '+': {} as HTMLImageElement } } },
  });
  const view = stage as unknown as { floaters: unknown[]; drawFloaters(): void };
  view.floaters = ['xp', 'crit', 'hurt', 'heal', 'trait'].map(kind => ({
    kind, x: 10, y: 50, text: kind === 'xp' ? '+2 修為' : '16', gain: 2, age: .3, dur: 1,
  }));
  view.drawFloaters();
  expect(labels.map(x => x.text)).toContain('+2 修為');
  expect(labels.map(x => x.text)).toContain('暴擊');
  expect(labels).toHaveLength(6);
  expect(labels.every(x => x.font.includes(family) && !x.font.includes('italic'))).toBe(true);
  // 修為底同特性墨印可用位圖，文字仍然全部經同一UI字體。
  expect(bitmaps).toEqual([paper, paper]);
});
