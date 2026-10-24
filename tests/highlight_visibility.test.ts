import { afterEach, describe, expect, it, vi } from 'vitest';
import { holdHighlightVisibility, highlightCoversPage } from '../src/ui/highlightVisibility';
afterEach(() => vi.unstubAllGlobals());
describe('全屏高光只遮住背景繪製', () => {
  it('test_highlight_重疊及重複清理不會提早恢復背景', () => {
    vi.stubGlobal('document', { documentElement: { dataset: {} } });
    const first = holdHighlightVisibility();
    const second = holdHighlightVisibility();
    expect(highlightCoversPage()).toBe(true);
    first(); first();
    expect(highlightCoversPage()).toBe(true);
    second();
    expect(highlightCoversPage()).toBe(false);
  });
  it('test_highlight_StrictMode重掛後離場會恢復背景', () => {
    vi.stubGlobal('document', { documentElement: { dataset: {} } });
    const old = holdHighlightVisibility(); old();
    const current = holdHighlightVisibility();
    expect(highlightCoversPage()).toBe(true);
    current();
    expect(highlightCoversPage()).toBe(false);
  });
});
