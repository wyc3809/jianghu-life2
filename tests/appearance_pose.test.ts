import { afterEach, describe, expect, it, vi } from 'vitest';
import { appearanceBodyFrame, appearanceComposition, BODY_FRAMES } from '../src/appearance/pose';
import { drawAppearance } from '../src/appearance/model';
import type { AppearanceAssets } from '../src/appearance/assets';
import type { CharacterAppearance } from '../interfaces/appearance';
import atlas from '../src/appearance/pose-layout.json';
import mapping from '../src/appearance/asset-map.json';
const a:CharacterAppearance={head:'topknot',outfit:'scholar',tone:'jade'};
afterEach(()=>vi.unstubAllGlobals());
describe('完整姿勢肢體回歸',()=>{
  it('test_appearance_pose_各套衣著八種完整姿勢_不以舊肢體零件代替',()=>{
    for(const outfit of ['traveller','scholar','cloak']as const)for(const frame of BODY_FRAMES){
      expect(mapping.bodies[outfit][frame]).toContain(`/body-${outfit}-${frame}.webp`);
      const m=atlas[outfit][frame];expect(m.neck[0]).toBeGreaterThan(0);expect(m.neck[0]).toBeLessThan(m.width);expect(m.neck[1]).toBeGreaterThan(0);expect(m.neck[1]).toBeLessThan(m.height);
    }
  });
  it('test_appearance_pose_頭頸握點與身體同一個變換_不按姿勢高低拉長手腳',()=>{
    for(const outfit of ['traveller','scholar','cloak']as const)for(const frame of BODY_FRAMES){
      const m=atlas[outfit][frame],unit=1/atlas[outfit].pixelsPerUnit,p=appearanceComposition({...a,outfit},frame,1);
      expect(p.body.height/m.height).toBeCloseTo(unit,10);expect(p.body.width/m.width).toBeCloseTo(unit,10);
      expect(p.neck.x).toBeCloseTo((m.neck[0]-m.origin[0])*unit,10);expect(p.neck.y).toBeCloseTo((m.neck[1]-m.origin[1])*unit,10);
      expect(p.grip.x).toBeCloseTo((m.grip[0]-m.origin[0])*unit,10);expect(p.grip.y).toBeCloseTo((m.grip[1]-m.origin[1])*unit,10);
      expect(appearanceComposition({...a,outfit,head:'bun',tone:'cinnabar'},frame,1).body).toEqual(p.body);
    }
  });
  it('test_appearance_pose_出招倒地盤坐及減少動態_只選真姿勢不超出圖集',()=>{
    expect([.02,.2,.48,.7].map(t=>appearanceBodyFrame('attack',t,false))).toEqual(['windup','strike','windup','idle']);
    expect(appearanceBodyFrame('seated',0,false)).toBe('seated');expect(appearanceBodyFrame('down',1,false)).toBe('down');
    expect(appearanceBodyFrame('walk',NaN,true)).toBe('idle');expect(appearanceBodyFrame('attack',99,true)).toBe('strike');
    for(let t=-1;t<10;t+=.05)expect(BODY_FRAMES).toContain(appearanceBodyFrame('walk',t,false));
  });
  it('test_appearance_pose_繪製盤坐行走與出招_每次只有一個完整身體不重複畫袖手腿',()=>{
    const body={naturalWidth:4,naturalHeight:4},head={naturalWidth:100,naturalHeight:100,marker:'head'},canvases:unknown[]=[];
    vi.stubGlobal('document',{createElement:()=>{const canvas={width:4,height:4,marker:'whole-body',getContext:()=>({drawImage(){},getImageData:()=>({data:new Uint8ClampedArray(64)}),putImageData(){}})};canvases.push(canvas);return canvas;}});
    const assets={heads:{topknot:head},bodies:{scholar:Object.fromEntries(BODY_FRAMES.map(frame=>[frame,body]))},weapons:{},simplified:false}as unknown as AppearanceAssets;
    const draws:unknown[][]=[];const ctx=new Proxy({drawImage:(...args:unknown[])=>draws.push(args)},{get:(target,key)=>key in target?target[key as keyof typeof target]:()=>{}})as unknown as CanvasRenderingContext2D;
    for(const pose of ['idle','walk','attack','hurt','down','seated']as const){
      draws.length=0;drawAppearance(ctx,assets,a,{x:100,y:400,height:350,pose,time:.2});
      expect(draws.filter(args=>canvases.includes(args[0]))).toHaveLength(1);expect(draws.filter(args=>args[0]===head)).toHaveLength(1);expect(draws).toHaveLength(2);
    }
  });
});
