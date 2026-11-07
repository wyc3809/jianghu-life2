import{afterEach,describe,it,expect,vi}from'vitest';
import{readFileSync}from'node:fs';
import{drawAppearance}from'../src/appearance/model';
import{BODY_FRAMES}from'../src/appearance/pose';
import{drawIndependentAppearance,independentContact}from'../src/appearance/independent/draw';
import{independentFrame}from'../src/appearance/independent/frames';
import type{AppearanceAssets}from'../src/appearance/assets';
const json=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const context=(values:Record<string,unknown>={})=>new Proxy(values,{get:(o,k)=>k in o?o[k as string]:()=>{}})as unknown as CanvasRenderingContext2D;
afterEach(()=>vi.unstubAllGlobals());
describe('所選造型的同幀整體繪圖',()=>{
 it('test_independent_draw_真三衣八頭幀資料_每次只畫整體且朝向不影響比例',()=>{
  const made:unknown[]=[];vi.stubGlobal('document',{createElement:()=>{const canvas={width:0,height:0,getContext:()=>context({drawImage(){}})};made.push(canvas);return canvas;}});
  for(const outfit of['traveller','scholar','cloak'])for(const head of['bamboo','topknot','master','silver','ponytail','loose','bun','short']){
   const body={meta:json(`public/ink/art/independent/${outfit}/art_river_fist.json`),image:{}},upper={meta:json(`public/ink/art/independent/${outfit}/_upper-${head}.json`),image:{}};
   const assets={independent:{getClip:()=>body,getUpper:()=>upper,getProp:()=>undefined}}as unknown as AppearanceAssets;
   for(const face of[-1,1])for(const time of[0,.3,.6,1.1]){const draws:unknown[][]=[],scales:number[][]=[];const target=context({drawImage:(...a:unknown[])=>draws.push(a),scale:(...a:number[])=>scales.push(a)});
    expect(drawIndependentAppearance(target,assets,{outfit,head,tone:'jade'},{x:200,y:300,height:80,face,pose:'attack',martialId:'art_river_fist',motionTime:time,family:'fist'})).toBe(true);
    expect(draws).toHaveLength(1);expect(made).toContain(draws[0][0]);expect(scales).toEqual([[face*80/191.625,80/191.625]]);
   }
  }
 });
 it('test_independent_draw_地掌接觸點與鏡像_讀同幀副手而非借拳的握點',()=>{
  const body={meta:json('public/ink/art/independent/traveller/art_stone_palm.json'),image:{}},assets={independent:{getClip:()=>body}}as unknown as AppearanceAssets;
  const t=body.meta.contacts[0],f=independentFrame(body.meta,t).frame;expect(f.contact).toBe('far');
  const a={head:'topknot',outfit:'traveller',tone:'ink'},o={x:100,y:200,height:191.625,pose:'attack' as const,martialId:'art_stone_palm',motionTime:t,family:'palm'};
  expect(independentContact(assets,a,o)).toEqual({x:100+f.farGrip[0]-192,y:200+f.farGrip[1]-272});
  expect(independentContact(assets,a,{...o,face:-1})?.x).toBeCloseTo(100-(f.farGrip[0]-192),8);
 });
 it('test_independent_draw_未接真時計的舊預覽_不暗中切換暫停的多人呈現器',()=>{
  vi.stubGlobal('document',{createElement:()=>({width:4,height:4,getContext:()=>context({drawImage(){},getImageData:()=>({data:new Uint8ClampedArray(64)}),putImageData(){}})})});
  const im={naturalWidth:100,naturalHeight:100},getClip=vi.fn(()=>undefined),getUpper=vi.fn(()=>undefined),assets={heads:{bamboo:im},bodies:{traveller:Object.fromEntries(BODY_FRAMES.map(f=>[f,im]))},weapons:{},simplified:false,independent:{getClip,getUpper}}as unknown as AppearanceAssets;
  const a={head:'bamboo',outfit:'traveller',tone:'ink'},o={x:0,y:0,height:80,pose:'attack' as const,time:.2};drawAppearance(context(),assets,a,o);expect(getClip).not.toHaveBeenCalled();
  drawAppearance(context(),assets,a,{...o,motionTime:.2,martialId:'art_river_fist'});expect(getClip).toHaveBeenCalledTimes(1);
 });
 it('test_independent_draw_來源失敗_回傳同身份後備選擇而不拋錯或執行結算',()=>{
  const getClip=vi.fn(()=>undefined),getUpper=vi.fn(()=>undefined),assets={independent:{getClip,getUpper}}as unknown as AppearanceAssets;
  expect(drawIndependentAppearance(context(),assets,{head:'bun',outfit:'scholar',tone:'sand'},{x:0,y:0,height:80,pose:'attack',martialId:'art_river_fist',motionTime:.2})).toBe(false);
  expect(getClip.mock.calls.length).toBe(1);expect(getUpper.mock.calls.length).toBe(1);
 });
});
