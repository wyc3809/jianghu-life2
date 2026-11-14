import {afterEach,describe,expect,it,vi} from 'vitest';
import {SparStage,loadSparImages} from '../src/spar/engine';
const image=(name:string)=>({width:616,height:788,src:name}) as HTMLImageElement;
afterEach(()=>vi.unstubAllGlobals());
describe('正式交手還原原本斗笠黑影',()=>{
 it('test_silhouette_出場及招式走位_同待機用一致尺寸黑影且缺幀不改用大型行路圖',()=>{
  const draws:unknown[][]=[];const ctx=new Proxy({drawImage:(...args:unknown[])=>draws.push(args)},{get:(t,p)=>p in t?t[p as keyof typeof t]:()=>({})});
  const idle=image('idle'),attack=image('attack'),walk=Array.from({length:4},(_,i)=>image(`walk-${i}`));
  const oversized=Array.from({length:4},(_,i)=>({width:900,height:800,src:`oversized-${i}`} as HTMLImageElement));
  const stage=new SparStage({canvas:{getContext:()=>ctx} as unknown as HTMLCanvasElement,images:{actorStyle:'silhouette',heroIdle:idle,heroAttack:attack,heroWalk:walk,enemies:[idle],splash:idle,art:{walk:oversized} as never}});
  stage.resize(390,240,1);
  const raw=stage as unknown as {heroMoving:boolean;walkT:number;drawWarrior(g:unknown):void;geom():{k:number};images:{heroWalk?:HTMLImageElement[]};artHeroSample:()=>unknown;artHeroOffset:()=>{dx:number;dy:number}};
  const g=raw.geom();raw.drawWarrior(g);
  raw.heroMoving=true;
  for(let i=0;i<4;i++){
   raw.walkT=i/4;draws.length=0;raw.drawWarrior(g);
   expect(draws.some(d=>d[0]===walk[i])).toBe(true);expect(draws.some(d=>oversized.includes(d[0] as HTMLImageElement))).toBe(false);
  }
  raw.heroMoving=false;raw.artHeroSample=()=>({pose:'walk',rot:0,sx:1,alpha:1});raw.artHeroOffset=()=>({dx:0,dy:0});
  draws.length=0;raw.drawWarrior(g);expect(draws.some(d=>walk.includes(d[0] as HTMLImageElement))).toBe(true);
  raw.images.heroWalk=undefined;
  for(let i=0;i<4;i++){
   raw.walkT=i/4;draws.length=0;raw.drawWarrior(g);const fallback=draws.filter(d=>d[0]===idle);
   expect(fallback.length).toBeGreaterThan(0);expect(fallback[0]![7]).toBeCloseTo(616*g.k);
   expect(draws.some(d=>oversized.includes(d[0] as HTMLImageElement))).toBe(false);
  }
 });
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
