import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  FOE_SILHOUETTE_KEYS,
  foeSilhouetteKey,
  foeSilhouetteUrl,
  heroSilhouetteUrl,
} from '../src/ui/inkSilhouettes';

const fileOf = (url: string) => `public/${url.replace(/^\/+/, '').replace(/\?.*$/, '')}`;

describe('inkSilhouettes', () => {
  it('maps sect ids to hero silhouettes, falling back to 無根', () => {
    expect(heroSilhouetteUrl('sect_wudang')).toContain('art/sil/hero-wudang.webp');
    expect(heroSilhouetteUrl('shaolin')).toContain('hero-shaolin.webp');
    expect(heroSilhouetteUrl(null)).toContain('hero-wugen.webp');
    expect(heroSilhouetteUrl('sect_unknown')).toContain('hero-wugen.webp');
  });

  it('maps foe names by keyword', () => {
    expect(foeSilhouetteKey('黑衣刀客')).toBe('daoke');
    expect(foeSilhouetteKey('雙鉤客')).toBe('gouke');
    expect(foeSilhouetteKey('紅衣女刺客')).toBe('nvcike');
    expect(foeSilhouetteKey('胖頭陀')).toBe('toutuo');
    expect(foeSilhouetteKey('血刀老祖')).toBe('tiemian');
  });

  it('assigns unknown names deterministically within the pool', () => {
    const k = foeSilhouetteKey('無名氏');
    expect(FOE_SILHOUETTE_KEYS).toContain(k);
    expect(foeSilhouetteKey('無名氏')).toBe(k);
  });

  it('every referenced silhouette file exists', () => {
    for (const key of FOE_SILHOUETTE_KEYS) {
      expect(existsSync(`public/ink/art/sil/enemy-${key}.webp`)).toBe(true);
      expect(existsSync(`public/ink/art/sil/boss-${key}.webp`)).toBe(true);
    }
    expect(existsSync(fileOf(heroSilhouetteUrl('sect_emei')))).toBe(true);
    expect(foeSilhouetteUrl('刀客', true)).toContain('boss-daoke.webp');
  });
});
