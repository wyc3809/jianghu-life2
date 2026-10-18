/** 第30項全目錄專屬動作：真正肢體圖集；只取樣畫面，唔產生戰鬥事件。 */
import expansion from './martialExpansion.json';
import type { IdentityTextures } from './identityFx';
import type { ArtSpriteKey } from './choreo';
import { canonicalSkillId } from '@data/skills/catalog';
import { MARTIAL_FALLBACK } from './martialFallback';
export type MartialFamily = 'fist' | 'palm' | 'kick' | 'needle' | 'sword' | 'blade' | 'spear' | 'internal' | 'step' | 'weiqi' | 'finger' | 'staff' | 'whip' | 'bow' | 'hook' | 'halberd' | 'flute' | 'mechanism' | 'dart';
export interface MartialPoseDef {
  id: string;
  family: MartialFamily;
  premium: boolean;
  /** 秒數由現有招式時間線決定；陣列只指定身體關鍵幀先後。 */
  sequence: readonly number[];
  /** 既有結果揭曉後才選擇收勢；唔預先結算、唔新增攻擊。 */
  contactIndex?: number;
  windup?: readonly number[];
  settle?: readonly number[];
  critRecovery?: readonly number[];
  killRecovery?: readonly number[];
}
const pose = (id: string, family: MartialFamily, sequence: number[], premium = false,
  critRecovery?: number[], killRecovery?: number[]): MartialPoseDef => ({ id, family, sequence, premium, critRecovery, killRecovery });

/** 103門獨立角色序列；素材及動態驗證由製作審核表逐項記錄。 */
export const MARTIAL_POSES: readonly MartialPoseDef[] = [
  pose('art_river_fist', 'fist', [0, 1, 2, 3, 2, 4, 5, 6, 7]),
  pose('sl_luohan_fist', 'fist', [0, 1, 2, 3, 4, 5, 6, 7]),
  pose('pr_mountain_split', 'fist', [0, 1, 2, 3, 4, 5, 6, 7], true, [0, 1, 2, 3, 4, 5, 6, 7], [0, 1, 2, 3, 4, 5, 6, 7]),
  pose('art_stone_palm', 'palm', [0, 1, 2, 3, 4, 5, 6, 7]),
  pose('art_wind_chase', 'kick', [0, 1, 2, 3, 4, 5, 6, 7]),
  pose('tm_flying_needle', 'needle', [0, 1, 2, 3, 4, 5, 6, 7]),
  pose('art_rain_sword', 'sword', [0, 1, 2, 3, 4, 5, 6, 7]),
  pose('pr_wind_thread', 'sword', [0, 1, 2, 3, 4, 5, 6, 7], true, [0, 1, 2, 3, 4, 5, 6, 7], [0, 1, 2, 3, 4, 5, 6, 7]),
  pose('art_thunder_blade', 'blade', [0, 1, 2, 3, 4, 5, 6, 7]),
  pose('art_spear_cloud', 'spear', [0, 1, 2, 3, 4, 5, 6, 7]),
  pose('art_iron_body', 'internal', [0, 1, 2, 3, 4, 5, 6, 7]),
  pose('pr_diamond_body', 'internal', [0, 8, 1, 9, 2, 10, 3, 11, 4, 12, 5, 13, 6, 14, 7, 15], true),
  pose('qg_broken_bridge', 'step', [0, 1, 2, 3, 4, 5, 6, 7]),
  pose('pr_cloud_step', 'step', [0, 8, 1, 9, 2, 10, 3, 11, 4, 12, 5, 13, 6, 14, 7, 15], true),
  pose('art_weiqi_trap', 'weiqi', [0, 1, 2, 3, 4, 5, 6, 7]),
  ...expansion.map(d => ({ ...d, family: d.family as MartialFamily })),
];
const byId = new Map(MARTIAL_POSES.map(d => [d.id, d]));
// 舊八門保留原結算時刻，肢體幀貼齊每次接觸，而唔係均勻播完八張圖。
const cues: Record<string, readonly (readonly [number, number])[]> = {
  art_river_fist: [[0, 0], [.1, 1], [.21, 2], [.31, 3], [.41, 4], [.64, 5], [.86, 6], [1.06, 7]],
  art_stone_palm: [[0, 0], [.12, 1], [.27, 2], [.37, 3], [.49, 4], [.55, 5], [.83, 6], [1.11, 7]],
  art_rain_sword: [[0, 0], [.1, 1], [.43, 2], [.55, 3], [.64, 4], [.68, 5], [.77, 3], [.92, 6], [1.16, 7]],
  art_wind_chase: [[0, 0], [.1, 1], [.24, 2], [.34, 3], [.46, 4], [.57, 5], [.76, 3], [.9, 6], [1.2, 7]],
  tm_flying_needle: [[0, 0], [.1, 1], [.27, 2], [.49, 3], [.6, 4], [.67, 5], [.84, 6], [1.07, 7]],
};
/** 必須傳 canonical ID；呼叫端可用 getSkillDef(alias)?.id 正規化。 */
export const martialPoseFor = (id?: string | null): MartialPoseDef | undefined => id ? byId.get(canonicalSkillId(id)) : undefined;

/** 依實際接觸節點取樣。減少動態仍用正確手形／持武，唔退回持劍舊圖。 */
export function sampleMartialPose(def: MartialPoseDef, time: number, duration: number, contact: number,
  result: { crit: boolean; killed: boolean; dmg: number } | null = null, reduced = false): number {
  const t = Math.max(0, Math.min(duration, time));
  const touch = def.contactIndex ?? 3;
  if (reduced) return t >= contact && t < duration * .8 ? def.sequence[touch]! : def.sequence[0]!;
  // 真實步進會跨過接觸嘅精確小數；保留短暫接觸格，唔會跳過放箭／推出掌心。
  if (def.contactIndex !== undefined && t >= contact - .02 && t <= contact + .04) return def.sequence[touch]!;
  const authored = cues[def.id];
  if (authored) return [...authored].reverse().find(([at]) => at <= t)?.[1] ?? 0;
  if (t <= contact) {
    const p = contact > 0 ? t / contact : 1;
    const beats = touch === 3 ? def.windup ?? [0, .25, .5, .75] : Array.from({ length: touch + 1 }, (_, i) => i / touch);
    let index = 0; for (let i = 0; i < beats.length; i++) if (p >= beats[i]!) index = i;
    return def.sequence[Math.min(touch, index)]!;
  }
  const recovery = result && result.dmg > 0 && result.killed ? def.killRecovery
    : result && result.dmg > 0 && result.crit ? def.critRecovery : undefined;
  const seq = recovery ?? def.sequence.slice(touch + 1);
  const p = (t - contact) / Math.max(.001, duration - contact);
  if (!recovery && seq.length === 4 && def.settle) {
    let index = 0; for (let i = 0; i < def.settle.length; i++) if (p >= def.settle[i]!) index = i;
    return seq[index]!;
  }
  return seq[Math.min(seq.length - 1, Math.floor(p * seq.length))]!;
}

export interface MartialAsset { atlas: HTMLImageElement; guard: boolean;
  variants?: Partial<Record<'crit' | 'kill' | 'detail', HTMLImageElement>>;
  effects?: Partial<Record<ArtSpriteKey, HTMLImageElement>>; identityEffects?: IdentityTextures }
const cache = new Map<string, Promise<MartialAsset | null>>();
const base = () => `${import.meta.env.BASE_URL || '/'}ink/art/martial/`;
const image = (url: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const im = new Image();
  const timer = setTimeout(() => { im.onload = null; im.onerror = null; reject(new Error('武學素材逾時')); }, 4000);
  im.onload = () => { clearTimeout(timer); resolve(im); };
  im.onerror = e => { clearTimeout(timer); reject(e); }; im.src = url;
});
const effectKeys: Record<MartialFamily, readonly ArtSpriteKey[]> = {
  fist: ['wave', 'wave-big', 'qi', 'crack', 'spark'], palm: ['crack', 'rock', 'dust'], kick: ['wind'],
  needle: ['needle'], sword: ['rain', 'streak'], blade: ['lightning', 'spark'], spear: ['thrust', 'cloud'],
  internal: ['qi'], step: ['dust', 'cloud'], weiqi: [],
  finger: [], staff: [], whip: [], bow: [], hook: [], halberd: [], flute: [], mechanism: [], dart: [],
};
/** 只載當前用到嘅武學；最多保留七門加一門正在切換嘅快取。失敗唔永久快取。 */
export async function loadMartialAssets(ids: readonly string[]): Promise<Map<string, MartialAsset>> {
  const entries = await Promise.all([...new Set(ids.map(canonicalSkillId))].filter(id => byId.has(id)).map(async id => {
    let pending = cache.get(id);
    if (!pending) {
      pending = (async () => {
        const art = byId.get(id)!;
        const actor = await image(`${base()}${id}.webp`).then(atlas => ({ atlas, guard: false }))
          .catch(() => image(`${base()}${id}-guard.webp`).then(atlas => ({ atlas, guard: true }))
            .catch(() => image(MARTIAL_FALLBACK[art.family]).then(atlas => ({ atlas, guard: true })).catch(() => null)));
        if (!actor) return null;
        const variantNames = art.critRecovery ? ['crit', 'kill'] : art.premium && (art.family === 'internal' || art.family === 'step') ? ['detail'] : [];
        const variantEntries = await Promise.all(variantNames.map(async key =>
          [key, await image(`${base()}${id}-${key}.webp`).catch(() => null)] as const));
        const entries = await Promise.all(effectKeys[art.family].map(async key =>
          [key, await image(`${base()}fx-${art.premium && art.family === 'internal' && key === 'qi' ? 'diamond' : key}.webp`).catch(() => null)] as const));
        const identityEntries = await Promise.all((art.premium ? ['signature', 'detail', 'finish'] : ['signature']).map(async key =>
          [key, await image(`${base()}${id}-fx-${key}.webp`).catch(() => null)] as const));
        return { ...actor, identityEffects: Object.fromEntries(identityEntries.filter(([, im]) => im)), variants: Object.fromEntries(variantEntries.filter(([, im]) => im)), effects: Object.fromEntries(entries.filter(([, im]) => im)) };
      })();
      cache.set(id, pending);
      while (cache.size > 8) cache.delete(cache.keys().next().value!);
    }
    const asset = await pending;
    if (!asset) cache.delete(id);
    return [id, asset] as const;
  }));
  return new Map(entries.filter((e): e is readonly [string, MartialAsset] => e[1] !== null));
}
