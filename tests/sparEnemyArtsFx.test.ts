import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { ENEMY_POOL } from '../src/spar/rig';
import { learnedArtNames } from '../src/components/ink/InkSparStage';
import { enemyKeyFromSrc } from '../src/spar/silhouetteDraw';

describe('spar enemy roster + learned arts FX', () => {
  it('出敵池含弓手／強盗等十款新模型且素材檔存在', () => {
    const keys = ENEMY_POOL.map((e) => enemyKeyFromSrc(e.part.src));
    const needed = [
      'gongshou',
      'qiangdao',
      'dunbing',
      'nuxia',
      'shushi',
      'yiren',
      'yaoren',
      'daoshi',
      'tongzi',
      'biaoshi',
    ];
    for (const k of needed) {
      expect(keys).toContain(k);
      const abs = resolve(`public/ink/spar/sil/enemy-${k}.webp`);
      expect(existsSync(abs), `missing ${k}`).toBe(true);
    }
    // 舊款仍在
    expect(keys).toContain('daoke');
    expect(keys).toContain('shadow');
    // 池內無重複 key
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('learnedArtNames：只取已學外功招式名，排除普攻／系統招', () => {
    expect(learnedArtNames([])).toEqual([]);
    expect(learnedArtNames(['基礎吐納'])).toEqual([]); // 內功唔出
    const names = learnedArtNames(['art_river_fist', 'art_stone_palm', '基礎吐納']);
    expect(names).toContain('長河崩拳');
    expect(names).toContain('裂石掌');
    expect(names).not.toContain('普通攻擊');
    expect(names).not.toContain('守勢');
    // 去重
    expect(learnedArtNames(['art_river_fist', 'art_river_fist'])).toEqual(['長河崩拳']);
  });
});
