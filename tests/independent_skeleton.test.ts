import {describe,it,expect}from'vitest';
import{readFileSync}from'node:fs';
import vm from'node:vm';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const ctx=vm.createContext({});vm.runInContext(readFileSync('design/art/spine-character/runtime/review.html','utf8').match(/<script>([\s\S]*?)<\/script>/)![1],ctx);const sdk=ctx.spine;
const animations=read('design/art/independent-animation/rig/animations.json'),clips=read('design/art/independent-animation/compiled-clips.json'),materials=read('design/art/independent-animation/materials.json');
describe('真Spine共用骨架與雙手持握',()=>{
 for(const outfit of['traveller','scholar','cloak'])it(`test_independent_skeleton_${outfit}_全武學接點骨長肘角及同幀持握`,()=>{
  const rig=read(`design/art/independent-animation/rig/${outfit}.json`);rig.animations=animations;
  const data=new sdk.SkeletonJson({newMeshAttachment:(_:unknown,n:string)=>new sdk.MeshAttachment(n)}).readSkeletonData(rig),s=new sdk.Skeleton(data);let sampled=0;
  expect(rig.skins[0].attachments['upper-body']['upper-body'].type).toBe('mesh');expect(rig.slots.some((z:{name:string})=>z.name==='head')).toBe(false);
  for(const[id,c]of Object.entries(clips)as[string,any][]){let previous:Record<string,number>|null=null;
   for(let i=0;i<c.sampleTimes.length;i++){
    const t=c.sampleTimes[i];s.setToSetupPose();data.findAnimation(id).apply(s,0,t,false,[],1,sdk.MixBlend.setup,sdk.MixDirection.mixIn);s.updateWorldTransform(sdk.Physics.update);
    const current:Record<string,number>={};
    for(const side of['near','far'])for(const type of['arm','leg']){
     const a=s.findBone(`${side}-upper-${type}`),b=s.findBone(`${side}-lower-${type}`),end=s.findBone(`${side}-${type==='arm'?'hand':'foot'}`);
     expect(Math.hypot(b.worldX-a.worldX,b.worldY-a.worldY),`${id} ${side} ${type} 上段`).toBeCloseTo(a.data.length,3);
     expect(Math.hypot(end.worldX-b.worldX,end.worldY-b.worldY),`${id} ${side} ${type} 下段`).toBeCloseTo(b.data.length,3);
     expect(Math.abs(b.rotation),`${id} ${side} ${type} 關節角`).toBeLessThanOrEqual(type==='arm'?155.001:150.001);
     for(const bone of[a,b,end]){expect(Number.isFinite(bone.worldX)&&Number.isFinite(bone.worldY)).toBe(true);current[bone.data.name]=bone.rotation;}
    }
    if(previous&&id!=='_down')for(const[name,v]of Object.entries(current)){const diff=(v-previous[name]+540)%360-180;expect(Math.abs(diff),`${id} ${name} ${t} 不得翻肘跳接`).toBeLessThanOrEqual(85);}
    previous=current;
    const intent=c.sampleIntents?.[i];
    if(intent?.gap){const grip=(side:string)=>{const b=s.findBone(side+'-hand'),a=s.findSlot(side+'-hand').attachment,g=materials.hands[a.name].grip;return[b.worldX+b.a*g[0]+b.b*g[1],b.worldY+b.c*g[0]+b.d*g[1]]};const near=grip('near'),far=grip('far'),chest=s.findBone('chest'),ang=Math.atan2(chest.c,chest.a)+intent.aim*Math.PI/180;
     expect(near[0]-far[0],id+' 雙手X').toBeCloseTo(intent.gap*Math.cos(ang),2);expect(near[1]-far[1],id+' 雙手Y').toBeCloseTo(intent.gap*Math.sin(ang),2);
    }
    sampled++;
   }
  }
  expect(sampled).toBeGreaterThan(4000);
 },30000);
});
