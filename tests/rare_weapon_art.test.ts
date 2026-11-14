import { describe,it,expect } from 'vitest';
import { readFileSync,existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { GEAR_CATALOG } from '../data/equipment/catalog';
import { equipmentArtUrl } from '../src/ui/equipmentArt';
import { momentHighlight } from '../src/fx/highlight/fromGame';
import { createNewLife } from '../core/life/gameState';
import catalog from '../src/appearance/manhua/weapon-catalog.json';

const unique=GEAR_CATALOG.filter(g=>g.slot==='weapon'&&!['common','fine'].includes(g.rarity));
const low=GEAR_CATALOG.filter(g=>g.slot==='weapon'&&['common','fine'].includes(g.rarity));
type Entry={src:string;sha256:string;bounds:number[];rarity:string;source:string};
const entries=catalog.weapons as Record<string,Entry>;
describe('珍品以上兵器獨有漫畫圖',()=>{
 it('test_weaponArt_完整名錄_每件rare以上有不同真圖且沒有漏登或共用來源輸出',()=>{
  expect(Object.keys(entries).sort()).toEqual(unique.map(g=>g.id).sort());
  const urls=new Set<string>(),hashes=new Set<string>();
  for(const def of unique){
   const entry=entries[def.id];expect(entry.rarity).toBe(def.rarity);expect(entry.source).toBeTruthy();
   const url=equipmentArtUrl(def);urls.add(url);expect(url).toContain(`/weapons/${def.id}-`);
   const path=new URL(url,'https://local.invalid').pathname;expect(existsSync(`public${path}`)).toBe(true);
   const bytes=readFileSync(`public${path}`);expect(createHash('sha256').update(bytes).digest('hex')).toBe(entry.sha256);hashes.add(entry.sha256);
   const [l,t,r,b]=entry.bounds;expect(l).toBeGreaterThan(0);expect(t).toBeGreaterThan(0);expect(r).toBeLessThan(512);expect(b).toBeLessThan(512);
  }
  expect(unique).toHaveLength(30);expect(urls.size).toBe(unique.length);expect(hashes.size).toBe(unique.length);
 });
 it('test_weaponArt_凡品良品及非兵器_保留原分類圖和護甲飾品圖片',()=>{
  expect(low).toHaveLength(33);
  for(const def of low)expect(equipmentArtUrl(def)).toContain(`/icons/${def.weaponKind}.webp`);
  expect(new Set(low.map(g=>equipmentArtUrl(g))).size).toBe(7);
  for(const def of GEAR_CATALOG.filter(g=>g.slot!=='weapon'))expect(equipmentArtUrl(def)).toContain(`/icons/${def.id}.webp`);
  expect(equipmentArtUrl(null)).toContain('/icons/sword.webp');
  expect(equipmentArtUrl(null,'armor')).toContain('/icons/plain-robe.webp');
 });
 it('test_weaponArt_取得兵器開箱_卡面與裝備用同一圖且獎勵身份品階及人物保持',()=>{
  const state=createNewLife({seed:108,skipCoach:true}),before=structuredClone(state),images=new Set<string>();
  const grades=['common','fine','rare','epic','mythic','divine'];
  for(const def of unique){
   const config=momentHighlight(state,{kind:'loot',gearId:def.id})!;
   expect(config.subject).toBe('chest');expect(config.rewards[0].id).toBe(def.id);expect(config.rewards[0].name).toBe(def.name);
   expect(config.rewards[0].grade).toBe(grades.indexOf(def.rarity));expect(config.rewards[0].equipmentArt).toBe(equipmentArtUrl(def));images.add(config.rewards[0].equipmentArt!);
  }
  expect(images.size).toBe(unique.length);expect(state).toEqual(before);
 });
});
