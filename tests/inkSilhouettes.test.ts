import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  FOE_SILHOUETTE_KEYS,
  foeSilhouetteKey,
  bossSilhouetteUrl,
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
      expect(existsSync(`public/ink/art/sil/boss-${key}.webp`)).toBe(true);
    }
    expect(existsSync(fileOf(heroSilhouetteUrl('sect_emei')))).toBe(true);
    expect(bossSilhouetteUrl('刀客')).toContain('boss-daoke.webp');
  });
});

describe('seal coverage', () => {
  it('every sealText used by the store has a bitmap seal', async () => {
    const { sealUrlForText, INK_SEAL_TEXTS } = await import('../src/ui/inkAssets');
    const used = ['定', '劍', '勝', '宗', '戰', '收', '敗', '教', '晉', '月', '武', '煉', '生', '終', '裝', '遁'];
    for (const t of used) {
      expect(sealUrlForText(t), t).not.toBeNull();
    }
    for (const t of INK_SEAL_TEXTS) {
      expect(existsSync(fileOf(sealUrlForText(t)!)), t).toBe(true);
    }
  });

  it('seal phrases are 2–4 chars and match the generator script', async () => {
    const { sealPhrase, sealUrlForText, INK_SEAL_TEXTS } = await import('../src/ui/inkAssets');
    const script = readFileSync('scripts/art/build_ink_stamps.py', 'utf8');
    const generated = new Map(
      [...script.matchAll(/\("([\w-]+)", "([^"]+)", "(?:zhuwen|baiwen)"/g)].map((m) => [m[1], m[2]] as const),
    );
    for (const t of INK_SEAL_TEXTS) {
      const phrase = sealPhrase(t);
      expect([...phrase].length, t).toBeGreaterThanOrEqual(2);
      expect([...phrase].length, t).toBeLessThanOrEqual(4);
      const id = sealUrlForText(t)!.match(/seal-([\w-]+)\.webp/)![1]!;
      expect(generated.get(id), t).toBe(phrase);
    }
  });
});
