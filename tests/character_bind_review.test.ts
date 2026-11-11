import {describe, expect, it} from 'vitest';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const read = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
const original = read('design/art/character-bind-review/rejected-baseline.json');
const review = read('design/art/character-bind-review/traveller-review.json');
const measurements = read('design/art/character-bind-review/measurements.json');
const context = vm.createContext({});
vm.runInContext(readFileSync('design/art/spine-character/runtime/review.html', 'utf8').match(/<script>([\s\S]*?)<\/script>/)![1], context);
const sdk = context.spine;
const dataFor = (rig: any) => new sdk.SkeletonJson({newMeshAttachment: (_: unknown, name: string) => new sdk.MeshAttachment(name)}).readSkeletonData(rig);

function bindDisagreement(rig: any, attachment: any): number {
  const skeleton = new sdk.Skeleton(dataFor(rig));
  skeleton.updateWorldTransform(sdk.Physics.update);
  const vertices = attachment.vertices;
  let cursor = 0, maximum = 0;
  for (let n = 0; n < attachment.uvs.length / 2; n++) {
    const count = vertices[cursor++], points: number[][] = [];
    for (let i = 0; i < count; i++) {
      const bone = skeleton.bones[vertices[cursor++]], x = vertices[cursor++], y = vertices[cursor++];
      const weight = vertices[cursor++];
      if (weight > 1e-7) points.push([bone.worldX + bone.a*x + bone.b*y, bone.worldY + bone.c*x + bone.d*y]);
    }
    for (const a of points) for (const b of points) maximum = Math.max(maximum, Math.hypot(a[0]-b[0], a[1]-b[1]));
  }
  return maximum;
}

function sampleTexturePoint(skeleton: any, slotName: string, point: number[]): number[] {
  const slot = skeleton.findSlot(slotName), attachment = slot.attachment;
  const world = new Float32Array(attachment.worldVerticesLength);
  attachment.computeWorldVertices(slot, 0, world.length, world, 0, 2);
  const uvs = Array.from(attachment.regionUVs) as number[];
  const us = [...new Set(uvs.filter((_, i) => i%2 === 0))].sort((a,b)=>a-b);
  const vs = [...new Set(uvs.filter((_, i) => i%2 === 1))].sort((a,b)=>a-b);
  const u = point[0]/attachment.width, v = point[1]/attachment.height;
  const x = Math.min(us.length-2, Math.floor(u*(us.length-1))), y = Math.min(vs.length-2, Math.floor(v*(vs.length-1)));
  const fx = (u-us[x])/(us[x+1]-us[x]), fy = (v-vs[y])/(vs[y+1]-vs[y]);
  const result = [0,0];
  for (const [ox,oy,w] of [[0,0,(1-fx)*(1-fy)],[1,0,fx*(1-fy)],[0,1,(1-fx)*fy],[1,1,fx*fy]]) {
    const n = (y+oy)*us.length+x+ox;
    result[0] += world[n*2]*w; result[1] += world[n*2+1]*w;
  }
  return result;
}

describe('第60g項單角色兩姿勢守門；唔代表美術已獲接受', () => {
  it('test_character_bind_原始骨長正常但蒙皮基準分歧_必須攔截', () => {
    expect(bindDisagreement(original, original.skins[0].attachments['near-leg']['near-leg'])).toBeGreaterThan(30);
    for (const group of Object.values(review.skins[0].attachments) as any[]) {
      for (const attachment of Object.values(group)) expect(bindDisagreement(review, attachment)).toBeLessThan(1e-5);
    }
  });

  it('test_character_bind_刻意移走單一骨影響_即使骨節不變亦拒絕', () => {
    const damaged = structuredClone(review.skins[0].attachments['near-arm']['near-arm']);
    let cursor = 0;
    while (damaged.vertices[cursor] === 1) cursor += 5;
    damaged.vertices[cursor+2] += 40;
    expect(bindDisagreement(review, damaged)).toBeGreaterThan(39);
  });

  it('test_character_bind_兩個實際姿勢_袖口及手腕材質點對齊而非只驗骨長', () => {
    const data = dataFor(review), skeleton = new sdk.Skeleton(data);
    for (const name of ['guard','punch']) {
      skeleton.setToSetupPose();
      data.findAnimation(name).apply(skeleton,0,0,false,[],1,sdk.MixBlend.setup,sdk.MixDirection.mixIn);
      skeleton.updateWorldTransform(sdk.Physics.update);
      for (const side of ['near','far']) {
        const socket = measurements.sockets[side];
        const cuff = sampleTexturePoint(skeleton, side === 'far' ? 'far-forearm' : 'near-arm', socket.textureCuff);
        const wrist = sampleTexturePoint(skeleton, side+'-hand', socket.textureWrist);
        expect(Math.hypot(cuff[0]-wrist[0], cuff[1]-wrist[1]), `${name} ${side} 袖口／手腕`).toBeLessThan(.1);
      }
    }
  });

  it('test_character_bind_遠臂分前後遮擋_三角形無重複亦無遺失', () => {
    const attachments = review.skins[0].attachments;
    const triangles = [...attachments['far-upper']['far-upper'].triangles, ...attachments['far-forearm']['far-forearm'].triangles];
    const keys = (v: number[]) => Array.from({length:v.length/3}, (_, i) => v.slice(i*3,i*3+3).join(',')).sort();
    expect(keys(triangles)).toEqual(keys(original.skins[0].attachments['far-arm']['far-arm'].triangles));
    expect(Object.keys(review.animations).sort()).toEqual(['guard','punch']);
    expect(review.slots.some((s: {name: string})=>s.name==='head')).toBe(false);
  });
});
