import { describe, expect, it } from 'vitest';
import { parseUiReviewVariant } from '../src/ui/uiReview';

describe('主畫面樣板入口', () => {
  it('test_ui_review_正式環境_即使有參數亦不啟用', () => {
    expect(parseUiReviewVariant('?ui-preview=a', false)).toBeNull();
    expect(parseUiReviewVariant('?ui-preview=b', false)).toBeNull();
  });
  it('test_ui_review_開發環境_可明確選擇兩款樣板', () => {
    expect(parseUiReviewVariant('?ui-preview=a', true)).toBe('a');
    expect(parseUiReviewVariant('?ui-preview=b', true)).toBe('b');
  });
  it('test_ui_review_缺少或錯誤參數_保留原版', () => {
    expect(parseUiReviewVariant('', true)).toBeNull();
    expect(parseUiReviewVariant('?ui-preview=dark', true)).toBeNull();
  });
});
