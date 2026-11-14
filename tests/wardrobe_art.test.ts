import { describe,it,expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import catalog from '../src/appearance/manhua/wardrobe-catalog.json';
import { APPEARANCE_HEADS } from '../interfaces/appearance';
import { COSTUME_IDS } from '../interfaces/costumes';

describe('十派制服及免費時裝素材',()=>{
 it('test_wardrobe_art_八造型及八十四服飾_各有完整圖並保留有效頭像與頭靴邊界',()=>{
  const entries=catalog.figures as Record<string,{src:string;sha256:string;bounds:number[];portrait:number[]}>;
  const hashes=new Set<string>();
  for(const head of APPEARANCE_HEADS)for(const costume of COSTUME_IDS){
   const entry=entries[`${head}-${costume}`];expect(entry,`${head}-${costume}`).toBeDefined();
   const bytes=readFileSync(`public/${entry.src}`);expect(createHash('sha256').update(bytes).digest('hex')).toBe(entry.sha256);hashes.add(entry.sha256);
   const [l,t,r,b]=entry.bounds;expect(l).toBeGreaterThan(0);expect(t).toBeGreaterThan(0);expect(r).toBeLessThan(512);expect(b).toBeLessThan(1024);
   const [x,y,w,h]=entry.portrait;expect(x).toBeGreaterThanOrEqual(0);expect(y).toBeGreaterThanOrEqual(t);expect(x+w).toBeLessThanOrEqual(512);expect(y+h).toBeLessThanOrEqual(1024);
  }
  expect(hashes.size).toBe(672);
 });
});
