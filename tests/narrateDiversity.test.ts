import { describe, expect, it } from 'vitest';
import { fullCatalog } from '../core/life/eventEngine';

describe('波折／事與願違文案多樣性', () => {
  it('填充選項（事件選項不足 3 個時自動補上）唔會被塞入風險分支', () => {
    for (const ev of fullCatalog()) {
      for (const ch of ev.choices) {
        if (ch.id.startsWith('fallback_')) {
          expect(ch.outcomes.length, `${ev.id}::${ch.id}`).toBe(1);
        }
      }
    }
  });

  it('全部事件（含順遂分支）嘅結果文案幾乎冇逐字重複（1 對重複已經係殘餘 hash 碰撞嘅下限）', () => {
    const textCount = new Map<string, number>();
    let total = 0;
    for (const ev of fullCatalog()) {
      for (const ch of ev.choices) {
        for (const o of ch.outcomes) {
          const narr = o.effects.find((e) => e.type === 'narrate')?.text;
          if (!narr) continue;
          total += 1;
          textCount.set(narr, (textCount.get(narr) ?? 0) + 1);
        }
      }
    }
    const duplicateGroups = [...textCount.values()].filter((c) => c > 1).length;
    const maxRepeat = Math.max(...textCount.values());
    // 容許極少量殘餘 hash 碰撞（現時基線：2165 個結果文案入面只有 1 對重複），
    // 唔容許再出現大範圍模板重複（曾經試過一句喺 51 個事件之間逐字相同）
    expect(duplicateGroups).toBeLessThanOrEqual(3);
    expect(maxRepeat).toBeLessThanOrEqual(2);
  });
});
