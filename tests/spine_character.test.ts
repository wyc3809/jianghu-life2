import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const root = 'design/art/spine-character/runtime/';
const html = readFileSync(root + 'review.html', 'utf8');
const context = vm.createContext({});
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)![1], context);
// 固定版本的真正Spine Runtime；測試不重寫FK或蒙皮求解器。
const runtime = context.spine;
const json = JSON.parse(readFileSync(root + 'character.json', 'utf8'));
const data = new runtime.SkeletonJson({ newMeshAttachment: (_skin: unknown, name: string) => new runtime.MeshAttachment(name) }).readSkeletonData(json);
const make = () => new runtime.Skeleton(data);
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
