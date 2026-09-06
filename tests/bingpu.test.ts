import { describe, expect, it } from 'vitest';
import { createRng } from '../core/random';
import {
  GEAR_CATALOG,
  WEAPON_KIND_LABEL,
  getGearDef,
  rollAdventureGear,
  rollForgeResult,
  type WeaponKind,
} from '../data/equipment/catalog';

describe('百兵譜（50 新兵器）', () => {
  it('目錄 id 全無重複', () => {
    const ids = GEAR_CATALOG.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('全部武器槽都有兵器種類，七門齊全', () => {
    const kinds = new Set<WeaponKind>();
    for (const g of GEAR_CATALOG) {
      if (g.slot !== 'weapon') continue;
      expect(g.weaponKind, g.id).toBeDefined();
      expect(WEAPON_KIND_LABEL[g.weaponKind!], g.id).toBeTruthy();
      kinds.add(g.weaponKind!);
    }
    expect(kinds.size).toBe(7);
  });

  it('七門各自最少有七把兵器', () => {
    const count = new Map<WeaponKind, number>();
    for (const g of GEAR_CATALOG) {
      if (g.slot !== 'weapon' || !g.weaponKind) continue;
      count.set(g.weaponKind, (count.get(g.weaponKind) ?? 0) + 1);
    }
    for (const kind of Object.keys(WEAPON_KIND_LABEL) as WeaponKind[]) {
      expect(count.get(kind) ?? 0, kind).toBeGreaterThanOrEqual(7);
    }
  });

  it('兵器總數唔少於 50 把新貨', () => {
    const weapons = GEAR_CATALOG.filter((g) => g.slot === 'weapon');
    expect(weapons.length).toBeGreaterThanOrEqual(50 + 13); // 原有 13 把武器 + 新 50
  });

  it('紫以上兵器有獨特絕技', () => {
    for (const g of GEAR_CATALOG) {
      if (g.slot !== 'weapon') continue;
      if (g.rarity === 'epic' || g.rarity === 'mythic' || g.rarity === 'divine') {
        expect(g.special, g.id).toBeDefined();
      }
    }
  });

  it('鍛造掉落全部係目錄內嘅合法 id（多 seed 掃描）', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const rng = createRng(seed);
      for (let i = 0; i < 200; i++) {
        const id = rollForgeResult(rng, { age: 20 + (i % 40), martial: i % 60 });
        expect(getGearDef(id), id).toBeDefined();
      }
    }
  });

  it('奇遇掉落全部係目錄內嘅合法 id（多 seed 掃描）', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 30; seed++) {
      const rng = createRng(seed);
      for (let i = 0; i < 200; i++) {
        const id = rollAdventureGear(rng);
        if (id) {
          expect(getGearDef(id), id).toBeDefined();
          seen.add(id);
        }
      }
    }
    // 新兵器確實會出（至少一把百兵譜新貨落過袋）
    expect(seen.has('taiya-sword') || seen.has('dragoncall-spear') || seen.has('sunshot-bow')).toBe(true);
  });
});
