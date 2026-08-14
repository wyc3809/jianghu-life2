import { describe, expect, it } from 'vitest';
import {
  INK_AI_ASSETS,
  pickAiEventBanner,
  aiEventBannerUrl,
  inkAiUrl,
  findInkAiByTag,
  getInkAiAsset,
} from '../src/ui/inkAiCatalog';

describe('inkAiCatalog', () => {
  it('lists a complete AI pack with unique ids', () => {
    expect(INK_AI_ASSETS.length).toBeGreaterThanOrEqual(18);
    const ids = INK_AI_ASSETS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('builds cache-busted urls under /ink/ai/', () => {
    const url = inkAiUrl('motif-sword');
    expect(url).toContain('ink/ai/motifs/motif-sword.webp');
    expect(url).toMatch(/\?v=/);
  });

  it('picks banners from title and tags', () => {
    expect(pickAiEventBanner({ title: '夜雨投店' })).toBe('rain-inn');
    expect(pickAiEventBanner({ title: '山門拜師', tags: ['sect'] })).toBe('sect-gate');
    expect(pickAiEventBanner({ title: '陌路相逢', tags: ['combat'] })).toBe('sword-road');
    expect(pickAiEventBanner({ title: '梅下結緣' })).toBe('bond-plum');
    expect(pickAiEventBanner({ title: '市集買賣', tags: ['economy'] })).toBe('market');
    expect(pickAiEventBanner({ title: '殘碑遺言' })).toBe('legacy-stele');
    expect(pickAiEventBanner({ title: '無事發生' })).toBe('mountain-road');
    expect(pickAiEventBanner({ title: '故人來訪', tags: ['arc'] })).toBe('mountain-road');
  });

  it('resolves banner urls or null', () => {
    expect(aiEventBannerUrl('none')).toBeNull();
    expect(aiEventBannerUrl('bridge-mist')).toContain('banner-bridge-mist.webp');
    expect(aiEventBannerUrl('mountain-road')).toContain('banner-mountain-road.webp');
  });

  it('finds assets by tag and id', () => {
    expect(findInkAiByTag('seal')[0]?.id).toBe('seal-cinnabar-fate');
    expect(getInkAiAsset('backdrop-title-scroll').kind).toBe('backdrop');
  });
});
