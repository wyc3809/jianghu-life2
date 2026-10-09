/**
 * 敵人圖鑑（第 20 項）：按演武台場景分 6 區，每區小兵、2 個精英、1 個首領。
 * 首領各有一個特性（data/foes/traits.ts）；同區精英跟首領特性但弱化。
 * 演武台（core/life/sparDuel.ts）同事件交手（core/life/foeTraits.ts）都由呢度攞敵人身份。
 * 設計：design/gdd/foe-roster.md；出圖 prompt：design/art/FOE-ROSTER-PROMPTS.md
 */
import type { FoeTier, FoeTraitId } from './traits';

/** 剪影款式（同 src/spar/rig.ts ENEMY_POOL／core/life/sparDuel.ts SPAR_LOOK 對應） */
export type FoeLook = 'shadow' | 'daoke' | 'nvcike' | 'toutuo' | 'tiemian' | 'gouke' | 'chifa';

export interface FoeEntry {
  id: string;
  name: string;
  /** 名號（名牌細字、首領登場卡） */
  title: string;
  tier: FoeTier;
  look: FoeLook;
  /** 點綴色（衣帶、眼光）：'r,g,b' */
  accent: string;
  /** 一句來歷 */
  blurb: string;
}

export interface FoeRegion {
  /** 場景 key（＝演武台背景 key） */
  bg: string;
  place: string;
  /** 主題名（HUD） */
  theme: string;
  /** 本區首領特性；精英跟佢 */
  trait: FoeTraitId;
  minions: FoeEntry[];
  elites: FoeEntry[];
  boss: FoeEntry;
}

const m = (id: string, name: string, title: string, look: FoeLook, accent: string, blurb: string): FoeEntry => ({
  id,
  name,
  title,
  tier: 'minion',
  look,
  accent,
  blurb,
});
const e = (id: string, name: string, title: string, look: FoeLook, accent: string, blurb: string): FoeEntry => ({
  id,
  name,
  title,
  tier: 'elite',
  look,
  accent,
  blurb,
});
const b = (id: string, name: string, title: string, look: FoeLook, accent: string, blurb: string): FoeEntry => ({
  id,
  name,
  title,
  tier: 'boss',
  look,
  accent,
  blurb,
});

export const FOE_REGIONS: readonly FoeRegion[] = [
  {
    bg: 'town',
    place: '千燈鎮',
    theme: '市井潑皮',
    trait: 'guard',
    minions: [
      m('town_rascal', '市井潑皮', '街頭混混', 'daoke', '176,122,60', '仗住人多，喺街口收保護費'),
      m('town_collector', '收數打手', '追債鉤手', 'gouke', '176,122,60', '收唔到數就落手'),
    ],
    elites: [
      e('town_guard', '惡霸護院', '鐵衫護院', 'toutuo', '176,122,60', '練過幾年鐵布衫，刀槍難入'),
      e('town_bruiser', '鐵衫打手', '橫行街坊', 'daoke', '176,122,60', '惡霸手下嘅頭馬'),
    ],
    boss: b('town_boss', '鎮上惡霸', '鐵肚金剛', 'toutuo', '176,122,60', '一身橫練，鎮上冇人敢惹'),
  },
  {
    bg: 'road',
    place: '山道',
    theme: '山道劫匪',
    trait: 'charge',
    minions: [
      m('road_bandit', '攔路刀匪', '剪徑小賊', 'daoke', '192,57,43', '山道上專劫單身客'),
      m('road_hooker', '雙鉤山賊', '鉤鐮手', 'gouke', '192,57,43', '雙鉤鉤馬腳、鉤人頸'),
    ],
    elites: [
      e('road_brute', '開山力士', '劈石手', 'toutuo', '192,57,43', '一斧落地，碎石四濺'),
      e('road_captain', '寨中刀頭', '赤巾刀頭', 'daoke', '192,57,43', '寨主親手帶出嚟嘅刀手'),
    ],
    boss: b('road_boss', '赤髮寨主', '開山赤鬼', 'chifa', '192,57,43', '蓄滿一刀，可以劈開山門'),
  },
  {
    bg: 'bamboo',
    place: '竹林',
    theme: '影門殺陣',
    trait: 'drain',
    minions: [
      m('bamboo_killer', '影門殺手', '竹影刺', 'shadow', '142,44,90', '竹影一晃就到你身後'),
      m('bamboo_assassin', '影門女刺', '青竹娘', 'nvcike', '142,44,90', '短刃淬咗血毒'),
    ],
    elites: [
      e('bamboo_bloodguard', '影門血衛', '飲血衛', 'tiemian', '142,44,90', '每殺一人就飲一口血'),
      e('bamboo_bloodmaid', '影門血姬', '紅袖刃', 'nvcike', '142,44,90', '紅袖一揚，血就倒流'),
    ],
    boss: b('bamboo_boss', '影門門主', '噬血竹魔', 'tiemian', '142,44,90', '靠飲人血續命嘅邪功'),
  },
  {
    bg: 'inn',
    place: '雨夜客棧',
    theme: '夜行刺客',
    trait: 'combo',
    minions: [
      m('inn_stalker', '夜行女刺', '雨夜燕', 'nvcike', '63,95,138', '趁雨聲落手'),
      m('inn_shade', '影衛', '簷下影', 'shadow', '63,95,138', '專守客棧簷角'),
    ],
    elites: [
      e('inn_twin', '分影刺客', '雙影', 'nvcike', '63,95,138', '一刀未收，第二刀已到'),
      e('inn_blades', '雙刃影衛', '對刃', 'gouke', '63,95,138', '雙刃交錯，連環出手'),
    ],
    boss: b('inn_boss', '鐵面影魁', '千影', 'tiemian', '63,95,138', '身法快到留低殘影'),
  },
  {
    bg: 'gate',
    place: '山門',
    theme: '邪寺頭陀',
    trait: 'thorns',
    minions: [
      m('gate_monk', '護寺頭陀', '守門僧', 'toutuo', '212,169,55', '把守邪寺山門'),
      m('gate_soldier', '黑衣僧兵', '夜巡僧', 'shadow', '212,169,55', '夜晚巡山嘅僧兵'),
    ],
    elites: [
      e('gate_vajra', '金剛護法', '銅皮羅漢', 'toutuo', '212,169,55', '打佢一拳，手骨都震痛'),
      e('gate_ironbone', '鐵骨僧兵', '鐵骨', 'shadow', '212,169,55', '金剛功練到三成'),
    ],
    boss: b('gate_boss', '鬼面頭陀', '金剛鬼面', 'toutuo', '212,169,55', '金剛不壞，反震傷人'),
  },
  {
    bg: 'nightpeak',
    place: '夜山',
    theme: '黑風寨',
    trait: 'enrage',
    minions: [
      m('peak_blade', '黑風刀手', '風刀', 'daoke', '122,31,26', '黑風寨嘅刀手'),
      m('peak_strong', '黑風力士', '扛鼎', 'toutuo', '122,31,26', '一身蠻力'),
      m('peak_hook', '黑風鉤客', '鉤魂', 'gouke', '122,31,26', '鉤人入寨'),
    ],
    elites: [
      e('peak_berserk', '黑風狂刀', '血眼刀', 'daoke', '122,31,26', '受傷越重，出刀越狠'),
      e('peak_vanguard', '黑風先鋒', '赤狼', 'chifa', '122,31,26', '寨主帳下先鋒'),
    ],
    boss: b('peak_boss', '黑風寨主', '黑風狂獅', 'chifa', '122,31,26', '半血之後狂性大發'),
  },
];

/** 全部敵人（名 → 條目），事件交手用名字搵返身份 */
export const FOE_BY_NAME: ReadonlyMap<string, { entry: FoeEntry; region: FoeRegion }> = new Map(
  FOE_REGIONS.flatMap((region) =>
    [...region.minions, ...region.elites, region.boss].map((entry) => [entry.name, { entry, region }] as const),
  ),
);

/** 剪影 → 用呢個剪影做首領嘅地區（事件交手冇喺圖鑑嘅敵人，按剪影借特性） */
export function regionForLook(look: FoeLook): FoeRegion | undefined {
  return FOE_REGIONS.find((r) => r.boss.look === look) ?? FOE_REGIONS.find((r) => r.elites.some((x) => x.look === look));
}

/** 名稱關鍵字 → 剪影（先中先得）；src/ui/inkSilhouettes.ts 都用呢份 */
const LOOK_KEYWORDS: readonly [RegExp, FoeLook][] = [
  [/鉤|鈎|勾/, 'gouke'],
  [/刺客|女|娘|姬|婆/, 'nvcike'],
  [/頭陀|和尚|僧|禪|羅漢|杖/, 'toutuo'],
  [/鐵面|面具|影|鬼|殺手|魔|血|邪|赤髮/, 'tiemian'],
  [/刀|劍|盜|匪|賊|寇|俠|客/, 'daoke'],
];

/** 冇關鍵字時按名字固定分配嘅剪影（唔包墨影、赤髮：佢哋係演武台專用款） */
export const NAMED_FOE_LOOKS = ['daoke', 'gouke', 'nvcike', 'toutuo', 'tiemian'] as const;

function hashName(name: string): number {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.codePointAt(0)!) >>> 0;
  return h;
}

/** 敵人名 → 剪影：圖鑑有就用圖鑑；否則關鍵字；再唔中就按名字固定分配 */
export function lookForFoeName(name: string): FoeLook {
  const hit = FOE_BY_NAME.get(name);
  if (hit) return hit.entry.look;
  for (const [re, key] of LOOK_KEYWORDS) if (re.test(name)) return key;
  return NAMED_FOE_LOOKS[hashName(name) % NAMED_FOE_LOOKS.length]!;
}
