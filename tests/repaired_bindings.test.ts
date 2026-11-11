import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const accepted=read('design/art/character-bind-review/punch-v03/character.json');
const materials=read('design/art/independent-animation/materials.json');
const context=vm.createContext({});
vm.runInContext(readFileSync('design/art/spine-character/runtime/review.html','utf8').match(/<script>([\s\S]*?)<\/script>/)![1],context);
const sdk=context.spine;
/** 用官方Runtime嘅世界矩陣獨立核對每頂點所有影響，唔靠製作器量度報告。 */
function disagreement(document:any) {
 const data=new sdk.SkeletonJson({newMeshAttachment:(_:unknown,n:string)=>new sdk.MeshAttachment(n)}).readSkeletonData(document);
 const skeleton=new sdk.Skeleton(data);skeleton.updateWorldTransform(sdk.Physics.update);
 let worst=0,checked=0;
 for(const group of Object.values(document.skins[0].attachments) as any[])for(const attachment of Object.values(group) as any[]) {
  const v=attachment.vertices;let cursor=0;
  for(let vertex=0;vertex<attachment.uvs.length/2;vertex++) {
   const count=v[cursor++],points=[];
   for(let i=0;i<count;i++) {const [index,x,y,w]=v.slice(cursor,cursor+4);cursor+=4;if(w<1e-7)continue;const b=skeleton.bones[index];points.push([b.worldX+b.a*x+b.b*y,b.worldY+b.c*x+b.d*y]);}
   for(const a of points)for(const b of points)worst=Math.max(worst,Math.hypot(a[0]-b[0],a[1]-b[1]));
   checked++;
  }
  expect(cursor).toBe(v.length);
 }
 return {worst,checked};
}
describe('全量修正版沿已接受比例及唯一材質綁定點',()=>{
 for(const outfit of ['traveller','scholar','cloak'])it(`test_repaired_bindings_${outfit}_十八骨比例保留且所有影響重投影一致`,()=>{
  const rig=read(`design/art/independent-animation/rig/${outfit}.json`);
  expect(rig.bones.slice(0,18)).toEqual(accepted.bones);
  const result=disagreement(rig);expect(result.checked).toBeGreaterThan(1500);expect(result.worst).toBeLessThan(.0001);
  // 重現原本「每骨各自縮放」嘅負例；骨長完全不變都必須拒絕。
  const broken=structuredClone(rig),a=broken.skins[0].attachments['near-arm']['near-arm'];let cursor=0;
  while(a.vertices[cursor]===1)cursor+=5;
  a.vertices[cursor+2]+=12;
  expect(disagreement(broken).worst).toBeGreaterThan(10);
 });
 it('test_repaired_bindings_十六手形各有完整來源邊界_唔切入下一格手腕',()=>{
  const regions=Object.values(materials.hands) as any[];expect(regions).toHaveLength(16);
  for(const a of regions) {
   const [x0,y0,x1,y1]=a.sourceBounds;expect(x1-x0).toBeGreaterThan(100);expect(y1-y0).toBeGreaterThan(150);
   expect(a.wrist[1]).toBeGreaterThan(30);expect(a.wrist[1]).toBeLessThan(y1-y0);
   for(const b of regions)if(a!==b){const [u0,v0,u1,v1]=b.sourceBounds;expect(Math.max(0,Math.min(x1,u1)-Math.max(x0,u0))*Math.max(0,Math.min(y1,v1)-Math.max(y0,v0))).toBe(0);}
  }
 });
});
