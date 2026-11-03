import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createHash } from 'node:crypto';

const root = 'design/art/spine-character/runtime/';
const html = readFileSync(root + 'review.html', 'utf8');
const context = vm.createContext({});
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)![1], context);
// 固定版本的真正Spine Runtime；測試不重寫FK或蒙皮求解器。
const runtime = context.spine;
const json = JSON.parse(readFileSync(root + 'character.json', 'utf8'));
const data = new runtime.SkeletonJson({ newMeshAttachment: (_skin: unknown, name: string) => new runtime.MeshAttachment(name) }).readSkeletonData(json);
const make = () => new runtime.Skeleton(data);
const surface = JSON.parse(readFileSync('design/art/spine-character/neck-surface.json', 'utf8'));
function connectedNeck(attachment: any) {
  const allowed = new Set<number>(surface.corridorVertices);
  const edges = new Map<number, Set<number>>();
  for (let i = 0; i < attachment.triangles.length; i += 3) {
    const tri = Array.from(attachment.triangles.slice(i, i + 3)) as number[];
    for (const a of tri) for (const b of tri) if (a !== b && allowed.has(a) && allowed.has(b)) {
      if (!edges.has(a)) edges.set(a, new Set());
      edges.get(a)!.add(b);
    }
  }
  const seen = new Set<number>(), stack = [surface.bridge[0]];
  while (stack.length) {
    const a = stack.pop()!;
    if (seen.has(a)) continue;
    seen.add(a);
    for (const b of edges.get(a) ?? []) stack.push(b);
  }
  return surface.bridge.every((i: number) => seen.has(i));
}
function pose(skeleton: any, name: string, time: number) {
  skeleton.setToSetupPose();
  data.findAnimation(name).apply(skeleton, 0, time, false, [], 1, runtime.MixBlend.setup, runtime.MixDirection.mixIn);
  skeleton.updateWorldTransform(runtime.Physics.update);
}
function vertices(skeleton: any) {
  return skeleton.slots.map((slot: any) => {
    const attachment = slot.attachment;
    const out = new Float32Array(attachment.worldVerticesLength);
    attachment.computeWorldVertices(slot, 0, out.length, out, 0, 2);
    return { attachment, out };
  });
}

describe('Spine人物三動作', () => {
  it('test_spine_頭頸皮膚到上胸_真圖像不透明且表面網格連通', () => {
    const image = readFileSync('design/art/spine-character/parts/upper-body.png');
    expect(createHash('sha256').update(image).digest('hex')).toBe(surface.sourceSha256);
    expect(Math.min(...surface.bridgeAlphaSamples)).toBeGreaterThanOrEqual(200);
    const skeleton = make();
    pose(skeleton, 'idle', 0);
    const { attachment } = vertices(skeleton).find(({ attachment }: any) => attachment.name === surface.attachment)!;
    expect(connectedNeck(attachment)).toBe(true);
  });

  it('test_spine_三段動作的實際頸面_保持連通及有限拉伸', () => {
    const skeleton = make();
    pose(skeleton, 'idle', 0);
    const get = () => vertices(skeleton).find(({ attachment }: any) => attachment.name === surface.attachment)!;
    const base = get().out;
    const distance = (v: Float32Array, a: number, b: number) => Math.hypot(v[a * 2] - v[b * 2], v[a * 2 + 1] - v[b * 2 + 1]);
    let largestStrain = 0;
    for (const animation of data.animations) for (let i = 0; i <= Math.ceil(animation.duration * 120); i++) {
      pose(skeleton, animation.name, Math.min(i / 120, animation.duration));
      const { out } = get();
      for (let j = 1; j < surface.bridge.length; j++) {
        const a = surface.bridge[j - 1], b = surface.bridge[j];
        largestStrain = Math.max(largestStrain, Math.abs(distance(out, a, b) / distance(base, a, b) - 1));
      }
    }
    expect(largestStrain).toBeLessThan(.08);
  });

  it('test_spine_頸面連通時_臉部材質仍相對胸口轉動而非鎖死', () => {
    const skeleton = make();
    pose(skeleton, 'hurt', .19);
    const { out } = vertices(skeleton).find(({ attachment }: any) => attachment.name === surface.attachment)!;
    const angle = ([a, b]: number[]) => Math.atan2(out[b * 2 + 1] - out[a * 2 + 1], out[b * 2] - out[a * 2]);
    expect(Math.abs(angle(surface.faceTangent) - angle(surface.chestTangent)) * 180 / Math.PI).toBeGreaterThan(2);
  });

  it('test_spine_即使骨節仍正常但頸面被切斷_表面守門必須拒絕', () => {
    const broken = structuredClone(json);
    const attachment = broken.skins[0].attachments[surface.attachment][surface.attachment];
    const kept: number[] = [];
    for (let i = 0; i < attachment.triangles.length; i += 3) {
      const tri = attachment.triangles.slice(i, i + 3);
      const ys = tri.map((index: number) => surface.rect.y + attachment.uvs[index * 2 + 1] * surface.rect.height);
      if (!(Math.min(...ys) < 307 && Math.max(...ys) > 307)) kept.push(...tri);
    }
    attachment.triangles = kept;
    const brokenData = new runtime.SkeletonJson({ newMeshAttachment: (_skin: unknown, name: string) => new runtime.MeshAttachment(name) }).readSkeletonData(broken);
    const skeleton = new runtime.Skeleton(brokenData); skeleton.updateWorldTransform(runtime.Physics.update);
    const neck = skeleton.findBone('neck'), head = skeleton.findBone('head');
    expect(Math.hypot(head.worldX - neck.worldX, head.worldY - neck.worldY)).toBeCloseTo(35, 4);
    expect(skeleton.bones.every((bone: any) => [bone.worldX, bone.worldY].every(Number.isFinite))).toBe(true);
    expect(connectedNeck(attachment)).toBe(false);
  });
  it('test_spine_完整三段每秒120次採樣_骨長穩定且網格沒有翻面', () => {
    const skeleton = make();
    let samples = 0;
    let maximumBoneScaleError = 0;
    let largestTriangleArea = -Infinity;
    for (const animation of data.animations) {
      for (let i = 0; i <= Math.ceil(animation.duration * 120); i++) {
        pose(skeleton, animation.name, Math.min(i / 120, animation.duration));
        for (const bone of skeleton.bones) {
          if (![bone.worldX, bone.worldY, bone.a, bone.b, bone.c, bone.d].every(Number.isFinite)) throw new Error(`${animation.name}: ${bone.data.name} nonfinite`);
          maximumBoneScaleError = Math.max(maximumBoneScaleError, Math.abs(Math.hypot(bone.a, bone.c) - 1), Math.abs(Math.hypot(bone.b, bone.d) - 1));
        }
        for (const { attachment, out } of vertices(skeleton)) {
          if (!Array.from(out).every(Number.isFinite)) throw new Error(`${animation.name}: ${attachment.name} nonfinite`);
          for (let j = 0; j < attachment.triangles.length; j += 3) {
            const [a, b, c] = Array.from(attachment.triangles.slice(j, j + 3), (x: number) => x * 2);
            const area = (out[b] - out[a]) * (out[c + 1] - out[a + 1]) - (out[b + 1] - out[a + 1]) * (out[c] - out[a]);
            largestTriangleArea = Math.max(largestTriangleArea, area);
            if (area >= -0.000001) throw new Error(`${animation.name} ${i / 120} ${attachment.name} triangle ${j / 3}: ${area}`);
          }
        }
        samples++;
      }
    }
    expect(samples).toBeGreaterThan(490);
    expect(maximumBoneScaleError).toBeLessThan(.000005);
    expect(largestTriangleArea).toBeLessThan(-.000001);
  });

  it('test_spine_出拳_真正手部前進並保留頸長與足部支點', () => {
    const skeleton = make();
    pose(skeleton, 'attack', 0);
    const startHand = skeleton.findBone('near-hand').worldX;
    const feet = ['near-foot', 'far-foot'].map(name => [skeleton.findBone(name).worldX, skeleton.findBone(name).worldY]);
    pose(skeleton, 'attack', .35);
    expect(skeleton.findBone('near-hand').worldX - startHand).toBeGreaterThan(350);
    const neck = skeleton.findBone('neck'), head = skeleton.findBone('head');
    expect(Math.hypot(head.worldX - neck.worldX, head.worldY - neck.worldY)).toBeCloseTo(35, 4);
    ['near-foot', 'far-foot'].forEach((name, i) => {
      expect(skeleton.findBone(name).worldX).toBeCloseTo(feet[i][0], 5);
      expect(skeleton.findBone(name).worldY).toBeCloseTo(feet[i][1], 5);
    });
  });

  it('test_spine_三段收束_回到同一骨架與網格姿勢', () => {
    const skeleton = make();
    for (const animation of data.animations) {
      pose(skeleton, animation.name, 0);
      const before = vertices(skeleton).map(({ out }: any) => Array.from(out));
      pose(skeleton, animation.name, animation.duration);
      vertices(skeleton).forEach(({ out }: any, part: number) => {
        Array.from(out, (value: number, i: number) => expect(value).toBeCloseTo(before[part][i] as number, 3));
      });
    }
  });

  it('test_spine_出拳與受擊反覆中斷_實際Runtime維持有限座標', () => {
    const skeleton = make();
    const settings = new runtime.AnimationStateData(data); settings.defaultMix = .12;
    const state = new runtime.AnimationState(settings);
    for (let n = 0; n < 30; n++) {
      state.setAnimation(0, n % 2 ? 'hurt' : 'attack', false);
      for (let i = 0; i < 20; i++) {
        state.update(1 / 60); state.apply(skeleton); skeleton.update(1 / 60); skeleton.updateWorldTransform(runtime.Physics.update);
        for (const { out } of vertices(skeleton)) expect(Array.from(out).every(Number.isFinite)).toBe(true);
      }
    }
  });
});
