import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import { APPEARANCE_HEADS, APPEARANCE_OUTFITS } from '../interfaces/appearance';
import { SPINE_CATALOG, spineFrame, spineSkinKey, spineAppearanceBounds, contactSpineTime, choreoSpineTime } from '../src/appearance/spine/frames';
import { drawSpineAppearance } from '../src/appearance/spine/draw';
import { choreoForArt } from '../src/fx/art/recipes';
import { hitEvents } from '../src/fx/art/choreo';
import type { AppearanceAssets } from '../src/appearance/assets';

const original = JSON.parse(readFileSync('design/art/spine-character/runtime/character.json','utf8'));
const production = JSON.parse(readFileSync('design/art/spine-character/production/character.json','utf8'));
const skins = JSON.parse(readFileSync('design/art/spine-character/production/skins.json','utf8'));
const hash=(path:string)=>createHash('sha256').update(readFileSync(path)).digest('hex');

describe('正式連續蒙皮輸出',()=>{
  it('test_spine_production_八頭三衣舊ID_各有真圖集及來源而非全換同一人',()=>{
    const seen=new Set<string>();
    for(const head of APPEARANCE_HEADS)for(const outfit of APPEARANCE_OUTFITS){
      const key=spineSkinKey({head,outfit,tone:'ink'}),skin=SPINE_CATALOG.skins[key];
      expect(skin).toBeDefined();expect(hash('public/'+skin.src)).toBe(skin.sha256);seen.add(skin.sha256);
      expect(hash('public/'+skin.idle)).toHaveLength(64);expect(hash('public/'+skin.seated)).toHaveLength(64);
      expect(skin.fallbackSeated).toMatch(/^data:image\/webp;base64,/);
      expect(skins.skins.find((s:{head:string;outfit:string})=>s.head===head&&s.outfit===outfit).minNeckAlpha).toBeGreaterThanOrEqual(200);
    }
    expect(seen.size).toBe(24);
  });

  it('test_spine_production_正式資料_共用已接受骨架及三動作而非另寫人體規則',()=>{
    expect(production.bones).toEqual(original.bones);
    for(const name of ['idle','attack','hurt'])expect(production.animations[name]).toEqual(original.animations[name]);
    expect(hash('design/art/spine-character/production/character.json')).toBe(SPINE_CATALOG.skeletonSha256);
    const slots=production.skins[0].attachments;expect(slots.head).toBeUndefined();expect(slots.torso).toBeUndefined();expect(slots['upper-body']['upper-body'].type).toBe('mesh');
  });

  it('test_spine_production_透明裁切及選幀_保留每幀原點和固定骨架比例',()=>{
    const count=Object.values(SPINE_CATALOG.clips).reduce((n,c)=>n+c.frames,0);
    for(const skin of Object.values(SPINE_CATALOG.skins)){
      expect(skin.rects).toHaveLength(count);expect(skin.grips).toHaveLength(count);expect(skin.bounds).toHaveLength(count);
      skin.rects.forEach(([x,y,w,h,dx,dy],i)=>{
        const box=skin.bounds[i];expect([x,y,w,h,dx,dy].every(Number.isFinite)).toBe(true);
        expect(w).toBe(box[2]-box[0]);expect(h).toBe(box[3]-box[1]);expect([dx,dy]).toEqual(box.slice(0,2));
        expect(box[0]).toBeGreaterThan(0);expect(box[2]).toBeLessThan(SPINE_CATALOG.frameWidth);expect(box[1]).toBeGreaterThan(0);expect(box[3]).toBeLessThan(SPINE_CATALOG.frameHeight);
      });
    }
    for(const pose of ['idle','attack','hurt','walk','down','seated']as const){
      const c=SPINE_CATALOG.clips[pose];
      for(const t of [-1,0,.19,.35,1,1000,NaN]){const i=spineFrame(pose,t);expect(i).toBeGreaterThanOrEqual(c.start);expect(i).toBeLessThan(c.start+c.frames);}
      expect(spineFrame(pose,.1,true)).toBe(spineFrame(pose,99,true));
    }
    expect(SPINE_CATALOG.pixelsPerHeight).toBe(1533*.125);
  });

  it('test_spine_production_圖集接點和左右轉向_每次只畫一個完整角色且不按包圍盒縮放',()=>{
    const image={width:1024,height:2048},assets={spine:{get:()=>image},weapons:{}}as unknown as AppearanceAssets;
    const draws:unknown[][]=[],scales:unknown[][]=[];
    const ctx=new Proxy({drawImage:(...args:unknown[])=>draws.push(args),scale:(...args:unknown[])=>scales.push(args)},{get:(t,k)=>k in t?t[k as keyof typeof t]:()=>{}})as unknown as CanvasRenderingContext2D;
    for(const face of [-1,1])for(const time of [0,.19,.35,1.15]){
      draws.length=0;scales.length=0;drawSpineAppearance(ctx,assets,{head:'topknot',outfit:'traveller',tone:'ink'},{x:50,y:200,height:80,face,pose:'attack',motionTime:time});
      expect(draws).toHaveLength(1);expect(scales).toEqual([[face,1]]);
      const args=draws[0] as number[];expect(args[7]/args[3]).toBeCloseTo(80/SPINE_CATALOG.pixelsPerHeight,12);expect(args[8]/args[4]).toBeCloseTo(80/SPINE_CATALOG.pixelsPerHeight,12);
      expect(Object.values(spineAppearanceBounds({head:'topknot',outfit:'traveller',tone:'ink'},'seated')).every(Number.isFinite)).toBe(true);
    }
  });

  it('test_spine_production_既有接觸事件_只映射動作不修改招式時序或重播資料',()=>{
    const c=choreoForArt('art_river_fist');
    if(!c)throw Error('真武學編排未找到');const saved=JSON.stringify(c);
    for(const hit of hitEvents(c))expect(choreoSpineTime(c,hit.t)).toBeCloseTo(.35,10);
    expect(JSON.stringify(c)).toBe(saved);expect(contactSpineTime(.3,.3,.72)).toBe(.35);expect(contactSpineTime(.72,.3,.72)).toBe(SPINE_CATALOG.clips.attack.duration);
  });

  it('test_spine_production_新增走路倒地盤坐與三動作_同一Runtime所有骨長有限且頭頸親子不變',()=>{
    const context=vm.createContext({});const html=readFileSync('design/art/spine-character/runtime/review.html','utf8');vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)![1],context);const runtime=context.spine;
    const data=new runtime.SkeletonJson({newMeshAttachment:(_s:unknown,name:string)=>new runtime.MeshAttachment(name)}).readSkeletonData(production);
    const s=new runtime.Skeleton(data);
    for(const animation of data.animations)for(let i=0;i<=Math.ceil(animation.duration*60);i++){
      s.setToSetupPose();animation.apply(s,0,Math.min(i/60,animation.duration),false,[],1,runtime.MixBlend.setup,runtime.MixDirection.mixIn);s.updateWorldTransform(runtime.Physics.update);
      for(const bone of s.bones){expect([bone.worldX,bone.worldY,bone.a,bone.b,bone.c,bone.d].every(Number.isFinite)).toBe(true);expect(Math.hypot(bone.a,bone.c)).toBeCloseTo(1,5);}
      const n=s.findBone('neck'),h=s.findBone('head');expect(Math.hypot(h.worldX-n.worldX,h.worldY-n.worldY)).toBeCloseTo(35,4);expect(h.parent).toBe(n);
    }
  });
});
