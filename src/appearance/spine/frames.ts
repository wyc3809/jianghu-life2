import raw from './catalog.json';
import { readAppearance } from '@interfaces/appearance';
import type { AppearancePose } from '../pose';
import { hitEvents, type ArtChoreo } from '../../fx/art/choreo';

export interface SpineSkin { src: string; idle: string; seated: string; fallback: string; fallbackSeated: string; grips: number[][]; bounds: number[][]; rects: number[][]; sha256: string }
export interface SpineClip { start: number; frames: number; duration: number; loop: boolean }
export const SPINE_CATALOG = raw as unknown as {
  rig: string; skeletonSha256: string; frameWidth: number; frameHeight: number; columns: number;
  origin: number[]; pixelsPerHeight: number; clips: Record<AppearancePose, SpineClip>; skins: Record<string, SpineSkin>;
};

/** 固定骨架身高及同一時間來源選幀；不按PNG透明包圍盒縮放角色。 */
export function spineFrame(pose: AppearancePose = 'idle', time = 0, reduced = false): number {
  const clip = SPINE_CATALOG.clips[pose];
  const t = Number.isFinite(time) ? Math.max(0, time) : 0;
  if (reduced) return clip.start + (pose === 'attack' ? Math.round((clip.frames - 1) * .35 / clip.duration) : pose === 'down' ? clip.frames - 1 : 0);
  const phase = clip.loop ? t % clip.duration / clip.duration : Math.min(1, t / clip.duration);
  return clip.start + Math.min(clip.frames - 1, Math.floor(phase * (clip.loop ? clip.frames : clip.frames - 1)));
}

/** 造型ID保持原存檔的頭／衣服，不用角色名字或遊戲RNG選素材。 */
export function spineSkinKey(value: unknown): string { const a = readAppearance(value); return `${a.head}-${a.outfit}`; }

/** 跟既有命中時點對齊蓄勢、接觸及收招；多段命中仍只讀原事件。 */
export function choreoSpineTime(choreo: ArtChoreo, time: number): number {
  const hits = hitEvents(choreo);
  if (!hits.length) return Math.max(0, Math.min(1, time / choreo.dur)) * SPINE_CATALOG.clips.attack.duration;
  let i = 0;
  while (i < hits.length - 1 && time > (hits[i].t + hits[i + 1].t) / 2) i++;
  const contact = hits[i].t, begin = i ? (hits[i - 1].t + contact) / 2 : 0;
  const end = i + 1 < hits.length ? (contact + hits[i + 1].t) / 2 : choreo.dur;
  return time <= contact ? .35 * Math.max(0, time - begin) / Math.max(.001, contact - begin)
    : .35 + (SPINE_CATALOG.clips.attack.duration - .35) * Math.min(1, (time - contact) / Math.max(.001, end - contact));
}

/** 單次撲擊使用原本接觸點；只調整顯示速度，不更動結算時點。 */
export function contactSpineTime(time:number,contact:number,duration:number):number {
  return time<=contact ? .35*Math.max(0,time)/Math.max(.001,contact)
    : .35+(SPINE_CATALOG.clips.attack.duration-.35)*Math.min(1,(time-contact)/Math.max(.001,duration-contact));
}

/** 畫面只讀輸出的像素邊界供人物立繪fit；戰鬥始終使用固定身高。 */
export function spineAppearanceBounds(value: unknown, pose: AppearancePose = 'idle') {
  const skin = SPINE_CATALOG.skins[spineSkinKey(value)], index = spineFrame(pose, 0, true);
  const b = skin.bounds[index], [x, y] = SPINE_CATALOG.origin, scale = 400 / SPINE_CATALOG.pixelsPerHeight;
  return { left: (b[0] - x) * scale, top: (b[1] - y) * scale, right: (b[2] - x) * scale, bottom: (b[3] - y) * scale };
}
