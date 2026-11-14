import { describe,it,expect } from 'vitest';
import { readFileSync,existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import catalog from '../src/appearance/manhua/catalog.json';
import { APPEARANCE_HEADS,APPEARANCE_OUTFITS } from '../interfaces/appearance';
import { GEAR_CATALOG } from '../data/equipment/catalog';
import { equipmentArtUrl } from '../src/ui/personEquipment';
import { tintManhuaCloth } from '../src/appearance/manhua/figures';

describe('漫畫立繪與裝備素材',()=>{
  it('test_manhua_既有造型與衣著_全部有不同完整圖及頭靴留白',()=>{
    const hashes=new Set<string>();
    for(const head of APPEARANCE_HEADS)for(const outfit of APPEARANCE_OUTFITS){
      const entry=catalog.figures[`${head}-${outfit}` as keyof typeof catalog.figures];
      const bytes=readFileSync(`public/${entry.src}`);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(entry.sha256);hashes.add(entry.sha256);
      const [l,t,r,b]=entry.bounds;
      expect(l).toBeGreaterThan(0);expect(t).toBeGreaterThan(0);expect(r).toBeLessThan(catalog.width);expect(b).toBeLessThan(catalog.height);
    }
    expect(hashes.size).toBe(24);
  });
  it('test_manhua_真裝備_全部有對應圖且護甲飾品不再共用同一圖片',()=>{
    for(const gear of GEAR_CATALOG){const path=new URL(equipmentArtUrl(gear),'https://local.invalid').pathname;expect(existsSync(`public${path}`)).toBe(true);}
    const armorAndAccessories=GEAR_CATALOG.filter(g=>g.slot!=='weapon').map(g=>equipmentArtUrl(g));
    expect(new Set(armorAndAccessories).size).toBe(armorAndAccessories.length);
  });
  it('test_manhua_改衣料色_霜髮膚色與皮革及透明度保持',()=>{
    const data=new Uint8ClampedArray([100,120,95,254,235,230,224,255,203,155,118,255,95,66,45,255,100,120,95,0]);
    const original=data.slice();tintManhuaCloth(data,[136,66,57]);
    expect(data[0]).toBeGreaterThan(data[1]);expect(data[3]).toBe(254);
    expect(data.slice(4)).toEqual(original.slice(4));
  });
});
