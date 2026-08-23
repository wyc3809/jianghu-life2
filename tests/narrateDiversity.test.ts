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

  it('自動生成嘅波折／事與願違文案唔會大量重複（同一句最多重複幾次，唔會成十甚至幾十次）', () => {
    const textCount = new Map<string, number>();
    for (const ev of fullCatalog()) {
      for (const ch of ev.choices) {
        for (const o of ch.outcomes) {
          const label =
            o.label ??
            (String(o.id || '').endsWith('_ill')
              ? '事與願違'
              : String(o.id || '').endsWith('_mixed')
                ? '波折'
                : '順遂');
          if (label === '順遂') continue;
          const narr = o.effects.find((e) => e.type === 'narrate')?.text;
          if (!narr) continue;
          textCount.set(narr, (textCount.get(narr) ?? 0) + 1);
        }
      }
    }
    const maxRepeat = Math.max(...textCount.values());
    expect(maxRepeat).toBeLessThanOrEqual(5);
  });
});
