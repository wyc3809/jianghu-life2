import {describe, expect, it} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';

const base = 'design/art/character-bind-review/upright-v02/';
const rig = JSON.parse(readFileSync(base+'character.json','utf8'));
const report = JSON.parse(readFileSync(base+'measurements.json','utf8'));
const previous = JSON.parse(readFileSync('design/art/character-bind-review/traveller-review.json','utf8'));
const context = vm.createContext({});
vm.runInContext(readFileSync('design/art/spine-character/runtime/review.html','utf8').match(/<script>([\s\S]*?)<\/script>/)![1],context);
const sdk = context.spine;

function skeletonFor(document = rig) {
  const data = new sdk.SkeletonJson({newMeshAttachment: (_: unknown,name: string) => new sdk.MeshAttachment(name)}).readSkeletonData(document);
  const skeleton = new sdk.Skeleton(data);
  data.findAnimation('stand').apply(skeleton,0,0,false,[],1,sdk.MixBlend.setup,sdk.MixDirection.mixIn);
  skeleton.updateWorldTransform(sdk.Physics.update);
  return skeleton;
}

function surfaceError(skeleton: any): number {
  const slot=skeleton.findSlot('whole-body'),attachment=slot.attachment;
  const world=new Float32Array(attachment.worldVerticesLength);
  attachment.computeWorldVertices(slot,0,world.length,world,0,2);
  const uvs=attachment.regionUVs;
  let error=0;
  for(let i=0;i<uvs.length/2;i++) {
    error=Math.max(error,Math.hypot(world[i*2]-(uvs[i*2]*1024-512),world[i*2+1]-(1520-uvs[i*2+1]*1536)));
  }
  return error;
}

describe('自然站姿重設：上一版姿勢已否決，唔當動畫驗收',()=>{
  it('test_upright_站姿無壓低重心及戰鬥IK_舊約40度屈膝必須拒絕',()=>{
    const skeleton=skeletonFor();
    expect(Object.keys(rig.animations)).toEqual(['stand']);
    expect(rig.animations.stand).toEqual({});
    for(const side of ['near','far']) {
      const name=side+'-lower-leg';
      const oldBone=previous.bones.find((b:{name:string})=>b.name===name);
      const oldAngle=oldBone.rotation+previous.animations.guard.bones[name].rotate[0].value;
      expect(Math.abs(oldAngle)).toBeGreaterThan(35);
      expect(Math.abs(skeleton.findBone(name).rotation)).toBeLessThan(12);
    }
    expect(skeleton.findBone('hip').x).toBe(rig.bones.find((b:{name:string})=>b.name==='hip').x);
  });

  it('test_upright_真關節逐點對照母版_雙腳方向各自保留',()=>{
    const skeleton=skeletonFor();
    const authoring=new Map<string,[number,number,number]>();
    for(const bone of rig.bones) {
      const [px,py,pa]=authoring.get(bone.parent)??[0,0,0];
      const x=px+bone.x*Math.cos(pa)-bone.y*Math.sin(pa);
      const y=py+bone.x*Math.sin(pa)+bone.y*Math.cos(pa);
      authoring.set(bone.name,[x,y,pa+bone.rotation*Math.PI/180]);
      if(bone.name!=='root') {
        const point=report.landmarks[bone.name];
        expect(x, bone.name+' 原始綁定X').toBeCloseTo(point[0]-512,7);
        expect(y, bone.name+' 原始綁定Y').toBeCloseTo(1520-point[1],7);
      }
    }
    for(const bone of skeleton.bones) {
      if(bone.data.name==='root')continue;
      const point=report.landmarks[bone.data.name];
      // 官方Runtime嘅三角函數／Float32有約0.0001單位誤差；
      // 上面另以double驗原始綁定至1e-7，唔以SDK數值門檻掩蓋對位錯誤。
      expect(bone.worldX, bone.data.name).toBeCloseTo(point[0]-512,3);
      expect(bone.worldY, bone.data.name).toBeCloseTo(1520-point[1],3);
      expect(bone.scaleX).toBe(1);expect(bone.scaleY).toBe(1);
    }
    const near=skeleton.findBone('near-foot'),far=skeleton.findBone('far-foot');
    expect(Math.abs(Math.atan2(near.c,near.a)-Math.atan2(far.c,far.a))).toBeGreaterThan(.5);
  });

  it('test_upright_每個蒙皮頂點都係母版一比一_禁止獨立壓縮頭身手腳',()=>{
    const skeleton=skeletonFor();
    // 官方SDK使用Float32頂點；0.001設計單位低於一個原圖像素千分之一。
    expect(surfaceError(skeleton)).toBeLessThan(.001);
    skeleton.findBone('near-upper-arm').scaleX=.9;
    skeleton.updateWorldTransform(sdk.Physics.update);
    expect(surfaceError(skeleton)).toBeGreaterThan(5);
  });

  it('test_upright_原圖完整保留且有真多骨權重_唔另切前臂浮喺身前',()=>{
    const image=readFileSync(base+'images/whole-body.png');
    expect(image.equals(readFileSync(report.source))).toBe(true);
    expect(createHash('sha256').update(image).digest('hex')).toBe(report.sourceSha256);
    expect(rig.slots.map((s:{name:string})=>s.name)).toEqual(['whole-body']);
    const mesh=rig.skins[0].attachments['whole-body']['whole-body'];
    const bones=new Set<number>();
    let cursor=0;
    for(let n=0;n<mesh.uvs.length/2;n++) {
      const count=mesh.vertices[cursor++];
      for(let i=0;i<count;i++) {
        const bone=mesh.vertices[cursor];
        const weight=mesh.vertices[cursor+3];
        if(weight>.05)bones.add(bone);
        cursor+=4;
      }
    }
    for(const name of ['head','neck','chest','hip','near-upper-arm','near-lower-arm','near-hand','far-upper-arm','far-lower-arm','far-hand','near-upper-leg','near-lower-leg','near-foot','far-upper-leg','far-lower-leg','far-foot']) {
      expect(bones.has(rig.bones.findIndex((b:{name:string})=>b.name===name)),name).toBe(true);
    }
  });
});
