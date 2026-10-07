/**
 * 外功七卷（玩家決定 2026-10-07）：每門外功拆成七卷，一卷＝一招。
 * 卷一＝原本嘅招式；卷二至卷七由卷一推演威力、內力消耗；七卷招名喺 content/martial/volumes.json（2–4 字）。
 * 內功、輕功唔分卷（玩家揀「只有外功分七卷」）。
 *
 * ⚠ 威力倍數、內力倍數屬**測試參數**，玩家睇圖後可改。
 */
import VOLUMES_RAW from '@content/martial/volumes.json';
import { SKILL_DEFS, getSkillDef, type CombatMoveDef } from './catalog';

export const VOLUME_COUNT = 7;
export const VOLUME_NUMERALS = ['一', '二', '三', '四', '五', '六', '七'] as const;

/** 卷 n 威力＝卷一 × 倍數（測試參數） */
export const VOLUME_POWER_MULT = [1, 0.9, 0.95, 1.0, 1.08, 1.16, 1.32] as const;
/** 卷 n 內力消耗＝卷一 × 倍數（測試參數） */
export const VOLUME_QI_MULT = [1, 0.4, 0.45, 0.5, 0.55, 0.6, 0.7] as const;

/** 七卷招名（content/martial/volumes.json，玩家可直接改字） */
const VOLUME_NAMES: Record<string, string[]> = (VOLUMES_RAW as { volumes: Record<string, string[]> }).volumes;

/** 未寫名嘅外功（新加嘅武學未補名）：用「武學名·第幾式」頂住 */
function fallbackName(artName: string, i: number): string {
  return `${artName.replace(/（.*?）|\(.*?\)/g, '').slice(0, 2)}${VOLUME_NUMERALS[i]}式`;
}

const cache = new Map<string, CombatMoveDef[]>();

/** 呢門武學分唔分卷（有招式嘅外功先分） */
export function hasVolumes(skillId: string): boolean {
  const def = getSkillDef(skillId);
  return def?.kind === 'external' && Boolean(def.move);
}

/** 一門外功嘅七卷招式（index 0＝卷一＝原招） */
export function artVolumeMoves(skillId: string): CombatMoveDef[] {
  const hit = cache.get(skillId);
  if (hit) return hit;
  const def = getSkillDef(skillId);
  if (!def?.move || def.kind !== 'external') return [];
  const base = def.move;
  const names = VOLUME_NAMES[skillId];
  const nameOf = (i: number) => names?.[i] ?? fallbackName(def.name, i);
  const out: CombatMoveDef[] = [{ ...base, name: nameOf(0) }];
  for (let i = 1; i < VOLUME_COUNT; i++) {
    const w = nameOf(i);
    out.push({
      ...base,
      id: `${base.id}_v${i + 1}`,
      name: w,
      power: Math.round(base.power * VOLUME_POWER_MULT[i]! * 100) / 100,
      qiCost: Math.max(1, Math.round(base.qiCost * VOLUME_QI_MULT[i]!)),
      description: `${def.name}第${VOLUME_NUMERALS[i]}卷「${w}」。`,
    });
  }
  cache.set(skillId, out);
  return out;
}

/** 卷 n（1–7）嘅招式 */
export function volumeMove(skillId: string, vol: number): CombatMoveDef | undefined {
  return artVolumeMoves(skillId)[vol - 1];
}

/** 由招式 id 反查「邊門武學第幾卷」 */
export function volumeOfMoveId(moveId: string): { skillId: string; vol: number } | null {
  const m = /^(.*)_v([2-7])$/.exec(moveId);
  const baseId = m ? m[1]! : moveId;
  const vol = m ? Number(m[2]) : 1;
  for (const d of Object.values(SKILL_DEFS)) {
    if (d.kind === 'external' && d.move?.id === baseId) return { skillId: d.id, vol };
  }
  return null;
}

/** 卷名：「長河拳・卷三」 */
export function volumeLabel(skillId: string, vol: number): string {
  const def = getSkillDef(skillId);
  return `${def?.name ?? skillId}·卷${VOLUME_NUMERALS[vol - 1] ?? vol}`;
}

/** 整理卷號：去重、排序、只留 1–7 */
export function normalizeVolumes(vols: readonly number[] | undefined): number[] {
  return [...new Set((vols ?? []).filter((v) => Number.isInteger(v) && v >= 1 && v <= VOLUME_COUNT))].sort(
    (a, b) => a - b,
  );
}
