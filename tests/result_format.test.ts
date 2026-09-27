import { describe, expect, it } from 'vitest';
import { parseDelta, splitFeedback } from '../src/ui/resultFormat';

describe('result formatting (事件結果排版)', () => {
  it('test_result_split_moves_system_notices_out_of_story', () => {
    const fb =
      '你刃下不留——「宿敵」這一頁，就此撕去。 你補上最後一擊。血線落地的一瞬，你知這筆債已結，心性卻也添了幾分戾氣。 【完滿】 【成就】「初勝」記入卷首。 【成就】「血手」記入卷首。 江湖威望大增——你已是「略有小成」。';
    const { story, notices } = splitFeedback(fb);
    expect(story.join('')).not.toMatch(/成就|威望|完滿/);
    expect(story.join('')).toContain('你補上最後一擊。');
    expect(notices).toEqual([
      { label: '了結', text: '此事已了' },
      { label: '成就', text: '初勝' },
      { label: '成就', text: '血手' },
      { label: '威望', text: '略有小成' },
    ]);
  });

  it('test_result_split_keeps_plain_story_and_paragraphs', () => {
    const { story, notices } = splitFeedback('第一段。\n\n第二段，江湖上開始有人稱你「小俠」。');
    expect(notices).toEqual([]);
    expect(story).toHaveLength(2);
  });

  it('test_result_title_line_becomes_notice', () => {
    expect(splitFeedback('江湖上開始有人稱你「千燈鎮小俠」。').notices).toEqual([
      { label: '稱號', text: '千燈鎮小俠' },
    ]);
  });

  it('test_result_parse_delta_variants', () => {
    expect(parseDelta('名望-1')).toMatchObject({ label: '名望', value: '−1', tone: 'down' });
    expect(parseDelta('銀兩＋12')).toMatchObject({ label: '銀兩', value: '+12', tone: 'up' });
    expect(parseDelta('俠↓↓')).toMatchObject({ label: '俠', value: '↓↓', tone: 'down' });
    // 惡升係壞事：朱砂
    expect(parseDelta('惡↑↑↑')).toMatchObject({ label: '惡', value: '↑↑↑', tone: 'down' });
    expect(parseDelta('疲勞－5')).toMatchObject({ tone: 'up' });
    expect(parseDelta('修為＋2（殺敵所得）')).toMatchObject({
      label: '修為',
      value: '+2',
      tone: 'up',
      note: '殺敵所得',
    });
    expect(parseDelta('獲得裝備：墨雨劍（絕品）').tone).toBe('note');
  });
});
