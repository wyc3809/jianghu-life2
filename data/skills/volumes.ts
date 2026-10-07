/**
 * 外功七卷（玩家決定 2026-10-07）：每門外功拆成七卷，一卷＝一招。
 * 卷一＝原本嘅招式；卷二至卷七由卷一推演（名、威力、內力消耗）。
 * 內功、輕功唔分卷（玩家揀「只有外功分七卷」）。
 *
 * ⚠ 卷二至卷七嘅招名、威力倍數、內力倍數屬**測試參數**，玩家睇圖後可改。
 */
import { SKILL_DEFS, getSkillDef, type CombatMoveDef } from './catalog';

export const VOLUME_COUNT = 7;
export const VOLUME_NUMERALS = ['一', '二', '三', '四', '五', '六', '七'] as const;

/** 卷 n 威力＝卷一 × 倍數（測試參數） */
export const VOLUME_POWER_MULT = [1, 0.9, 0.95, 1.0, 1.08, 1.16, 1.32] as const;
/** 卷 n 內力消耗＝卷一 × 倍數（測試參數） */
export const VOLUME_QI_MULT = [1, 0.4, 0.45, 0.5, 0.55, 0.6, 0.7] as const;

/** 招名用字（按武學名最後一個字分類），卷二至卷七各取一個 */
const MOVE_WORDS: Record<string, string[]> = {
  fist: ['崩山', '穿心', '翻江', '摧城', '伏虎', '撼岳', '驚濤', '鎖喉'],
  palm: ['推雲', '拂柳', '翻天', '壓頂', '迴風', '印月', '震岳', '截脈'],
  finger: ['點星', '穿楊', '撥雲', '叩關', '封穴', '凝霜', '一線', '透骨'],
  leg: ['掃葉', '踏浪', '旋風', '踢斗', '連環', '鴛鴦', '鐵門', '追魂'],
  sword: ['白虹', '分花', '回風', '落雁', '星垂', '斷水', '問天', '歸元'],
  blade: ['斷浪', '開嶺', '回旋', '劈月', '橫江', '奪魄', '破陣', '刀山'],
  spear: ['游龍', '貫虹', '回馬', '梨花', '破陣', '穿雲', '定海', '透甲'],
  staff: ['伏魔', '掃塵', '橫江', '撐天', '鎮岳', '翻浪', '金剛', '點石'],
  whip: ['纏腰', '靈蛇', '回鞭', '捲雲', '抽絲', '鎖蛟', '打蛇', '斷流'],
  bow: ['連珠', '穿雲', '射鵰', '追月', '落星', '破甲', '貫日', '驚弦'],
  hidden: ['漫天', '奪命', '飛花', '暗渡', '無聲', '回燕', '星落', '透甲'],
  step: ['游魚', '踏雪', '飛燕', '凌波', '回身', '縮地', '移形', '換影'],
  other: ['起手', '回鋒', '連環', '奪勢', '破綻', '殺着', '歸一', '收勢'],
};

function category(def: { name: string; weaponKind?: string }): string {
  if (def.weaponKind && MOVE_WORDS[def.weaponKind]) return def.weaponKind;
  const n = def.name.replace(/（.*?）|\(.*?\)/g, '');
  const last = n.slice(-1);
  if ('拳'.includes(last)) return 'fist';
  if ('掌手'.includes(last)) return 'palm';
  if ('指通'.includes(last)) return 'finger';
  if ('腿'.includes(last)) return 'leg';
  if ('步'.includes(last)) return 'step';
  if (/劍/.test(n)) return 'sword';
  if (/刀|斬/.test(n)) return 'blade';
  if (/槍|戟|刺/.test(n)) return 'spear';
  if (/杖|棍/.test(n)) return 'staff';
  if (/鞭|鉤/.test(n)) return 'whip';
  if (/箭/.test(n)) return 'bow';
  if (/針|鏢/.test(n)) return 'hidden';
  if (/拳/.test(n)) return 'fist';
  if (/掌|手/.test(n)) return 'palm';
  return 'other';
}

/** 武學名主幹（去括號、取頭兩字），例：長河拳 → 長河 */
function stem(name: string): string {
  return name.replace(/（.*?）|\(.*?\)/g, '').slice(0, 2);
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
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
  const words = MOVE_WORDS[category(def)]!;
  const start = hash(skillId) % words.length;
  const st = stem(def.name);
  const out: CombatMoveDef[] = [base];
  for (let i = 1; i < VOLUME_COUNT; i++) {
    const w = words[(start + i - 1) % words.length]!;
    out.push({
      ...base,
      id: `${base.id}_v${i + 1}`,
      name: `${st}·${w}式`,
      power: Math.round(base.power * VOLUME_POWER_MULT[i]! * 100) / 100,
      qiCost: Math.max(1, Math.round(base.qiCost * VOLUME_QI_MULT[i]!)),
      description: `${def.name}第${VOLUME_NUMERALS[i]}卷：${w}。`,
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
