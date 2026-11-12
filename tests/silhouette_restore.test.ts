import {afterEach,describe,expect,it,vi} from 'vitest';
import {SparStage,loadSparImages} from '../src/spar/engine';
const image=(name:string)=>({width:616,height:788,src:name}) as HTMLImageElement;
afterEach(()=>vi.unstubAllGlobals());
describe('正式交手還原原本斗笠黑影',()=>{
 it('test_silhouette_正式預設載入_唔下載細節人物或衣櫥',async()=>{
  const urls:string[]=[];
  vi.stubGlobal('Image',class{onload:(()=>void)|null=null;onerror:(()=>void)|null=null;set src(value:string){urls.push(value);queueMicrotask(()=>this.onload?.());}});
  const loaded=await loadSparImages();
  expect(loaded.actorStyle).toBe('silhouette');expect(loaded.heroAppearance).toBeUndefined();expect(loaded.wardrobe).toBeUndefined();
  expect(urls.some(s=>s.includes('/sil/hero-idle.webp'))).toBe(true);
  expect(urls.some(s=>/hero-detail|art\/independent|art\/spine-character|appearance\//.test(s))).toBe(false);
 });
 it('test_silhouette_舊造型與遲到細節圖_唔會蓋過黑影或改身高',()=>{
  const draws:unknown[][]=[];const ctx=new Proxy({drawImage:(...args:unknown[])=>draws.push(args)},{get:(t,p)=>p in t?t[p as keyof typeof t]:()=>({})});
  const idle=image('black-idle'),attack=image('black-attack'),foe=image('black-foe'),detail=image('rejected-detail');
  const stage=new SparStage({canvas:{getContext:()=>ctx} as unknown as HTMLCanvasElement,images:{actorStyle:'silhouette',heroIdle:idle,heroAttack:attack,enemies:[foe],splash:idle,heroAppearance:{image:detail,guard:false},wardrobe:{} as never}});
  stage.resize(390,240,1);stage.setCharacterAppearance({head:'silver',outfit:'cloak',tone:'jade'});
  stage.setMartialAssets(new Map([['art_river_fist',{atlas:detail,guard:false}]]));
  const raw=stage as unknown as {attackT:number|null;heroMoving:boolean;heroHitT:number;heroDownT:number|null;drawWarrior(g:unknown):void;geom():{k:number};heroVisualHeight():number};
  for(const state of [{},{attackT:.3},{heroMoving:true},{heroHitT:.1},{heroDownT:.2}]) {
   Object.assign(raw,{attackT:null,heroMoving:false,heroHitT:9,heroDownT:null},state);draws.length=0;raw.drawWarrior(raw.geom());
   expect(draws.length).toBeGreaterThan(0);expect(draws.some(d=>d[0]===idle||d[0]===attack)).toBe(true);expect(draws.some(d=>d[0]===detail)).toBe(false);
  }
  expect(raw.heroVisualHeight()).toBeCloseTo(788*raw.geom().k,8);
 });
});
