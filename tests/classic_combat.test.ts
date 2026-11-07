import { afterEach, describe, expect, it, vi } from 'vitest';
import { combatAppearanceSample, combatContactTime, prepareCombatAppearance } from '../src/appearance/combat';
import { drawAppearance } from '../src/appearance/model';
import { appearanceBodyFrame, appearanceComposition, BODY_FRAMES } from '../src/appearance/pose';
import { prepareAppearance, type AppearanceAssets } from '../src/appearance/assets';
import { SPINE_CATALOG } from '../src/appearance/spine/frames';

const appearance={head:'topknot',outfit:'scholar',tone:'jade'} as const;
const context=(values:Record<string,unknown>={})=>new Proxy(values,{get:(t,k)=>k in t?t[k as string]:()=>{}}) as unknown as CanvasRenderingContext2D;
function fixture(){
  const baked:unknown[]=[];
  vi.stubGlobal('document',{createElement:()=>{
    const canvas={width:0,height:0,getContext:()=>context({drawImage(){},getImageData:()=>({data:new Uint8ClampedArray(64)}),putImageData(){}})};
    baked.push(canvas);return canvas;
  }});
  const image={naturalWidth:100,naturalHeight:100};
  const spinePrepare=vi.fn(),spineImage={width:1024,height:2048};
  const assets={heads:{topknot:image},bodies:{scholar:Object.fromEntries(BODY_FRAMES.map(f=>[f,image]))},weapons:{},simplified:false,
    spine:{prepare:spinePrepare,get:()=>spineImage}} as unknown as AppearanceAssets;
  return{assets,baked,spinePrepare,spineImage};
}
afterEach(()=>vi.unstubAllGlobals());
describe('舊版戰鬥演出回復',()=>{
  it('test_classic_combat_正式戰鬥與人物頁_各自讀完整姿勢及已接受立繪',()=>{
    const {assets,baked,spineImage}=fixture(),draws:unknown[][]=[];
    const ctx=context({drawImage:(...a:unknown[])=>draws.push(a)});
    drawAppearance(ctx,assets,appearance,{x:30,y:90,height:80,pose:'attack',time:.2});
    expect(draws).toHaveLength(1);expect(baked).toContain(draws[0][0]);expect(draws[0][0]).not.toBe(spineImage);
    draws.length=0;drawAppearance(ctx,assets,appearance,{x:30,y:90,height:80,pose:'idle',quality:'portrait'});
    expect(draws).toHaveLength(1);expect(draws[0][0]).toBe(spineImage);
    expect(SPINE_CATALOG.clips.idle).toBeDefined();
  });
  it('test_classic_combat_預備與反覆播放_先合成八格且不載入戰鬥Spine圖集',async()=>{
    const {assets,baked,spinePrepare}=fixture();await prepareAppearance(assets,appearance);const count=baked.length;
    expect(count).toBeGreaterThanOrEqual(BODY_FRAMES.length);expect(spinePrepare).not.toHaveBeenCalled();
    prepareCombatAppearance(assets,appearance);expect(baked).toHaveLength(count);
    for(let i=0;i<10;i++)for(const time of [.02,.2,.48,.7])drawAppearance(context(),assets,appearance,{x:0,y:0,height:80,pose:'attack',time});
    expect(baked).toHaveLength(count);
  });
  it('test_classic_combat_不同姿勢朝向_固定身高倍率及真握點不借其他圖集座標',()=>{
    const {assets}=fixture(),scales:number[][]=[];
    for(const face of [-1,1])for(const time of [.02,.2,.48,.7]){
      const opts={x:100,y:400,height:80,face,pose:'attack' as const,time};
      const sample=combatAppearanceSample(assets,appearance,opts),p=appearanceComposition(appearance,appearanceBodyFrame('attack',time,false),1);
      expect(sample.p.grip).toEqual(p.grip);expect(sample.p.neck).toEqual(p.neck);
      drawAppearance(context({scale:(...a:number[])=>scales.push(a)}),assets,appearance,opts);
    }
    expect(scales).toEqual([...Array(4).fill([-.2,.2]),...Array(4).fill([.2,.2])]);
  });
  it('test_classic_combat_敵方撲擊_蓄勢接觸收招按原時點且掉幀後仍收束',()=>{
    const contact=.3,duration=.72;
    expect(appearanceBodyFrame('attack',combatContactTime(0,contact,duration),false)).toBe('windup');
    expect(appearanceBodyFrame('attack',combatContactTime(contact,contact,duration),false)).toBe('strike');
    expect(appearanceBodyFrame('attack',combatContactTime(duration,contact,duration),false)).toBe('idle');
    expect(combatContactTime(100,contact,duration)).toBe(.7);
    expect(combatContactTime(-1,contact,duration)).toBe(0);
  });
});
