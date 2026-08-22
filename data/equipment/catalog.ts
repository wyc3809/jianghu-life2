import { applyGearPatch, getGearPatch } from './overrides';

export type GearSlot = 'weapon' | 'armor' | 'accessory';
/** 白（common）＜綠（fine）＜藍（rare）＜紫（epic）＜橙（mythic）＜紅（divine） */
export type GearRarity = 'common' | 'fine' | 'rare' | 'epic' | 'mythic' | 'divine';
export type WeaponKind = 'sword' | 'blade' | 'spear' | 'staff' | 'whip' | 'bow' | 'hidden';

/** 裝備戰鬥特效（與 attack/defense 等基礎數值並存） */
export interface GearCombatBonus {
  hitBonus?: number;
  evasion?: number;
  reflect?: number;
  pierce?: number;
  lifesteal?: number;
  bleedChance?: number;
}

export type GearSpecialEffectKind = 'burst' | 'stun_proc' | 'revive';

/** 紫（epic）以上裝備獨有嘅特別效果——唔止數值加成，係真正嘅獨特戰鬥機制 */
export interface GearSpecialEffect {
  kind: GearSpecialEffectKind;
  name: string;
  description: string;
  /** 觸發機率 0-1（revive 唔需要：一場戰鬥限一次，血見底時觸發） */
  chance?: number;
  /** 視乎 kind：burst＝額外傷害倍率；revive＝復活後氣血比例 */
  power?: number;
}

export interface GearDef {
  id: string;
  name: string;
  slot: GearSlot;
  rarity: GearRarity;
  /** 兵器種類（僅武器槽） */
  weaponKind?: WeaponKind;
  attack?: number;
  defense?: number;
  maxHpBonus?: number;
  maxQiBonus?: number;
  martialBonus?: number;
  combat?: GearCombatBonus;
  /** 紫（epic）／橙（mythic）／紅（divine）裝備嘅獨特效果 */
  special?: GearSpecialEffect;
  description: string;
}

export const WEAPON_KIND_LABEL: Record<WeaponKind, string> = {
  sword: '劍',
  blade: '刀',
  spear: '槍',
  staff: '杖',
  whip: '鞭',
  bow: '弓',
  hidden: '暗器',
};

export const GEAR_CATALOG: GearDef[] = [
  {
    id: 'old-sword',
    name: '舊鐵劍',
    slot: 'weapon',
    rarity: 'common',
    weaponKind: 'sword',
    attack: 4,
    combat: { hitBonus: 0.02 },
    description: '市井鐵匠的粗胚，勉強能防身。',
  },
  {
    id: 'plain-robe',
    name: '青布衣',
    slot: 'armor',
    rarity: 'common',
    defense: 2,
    combat: { evasion: 0.01 },
    description: '離家時母親縫好的衣裳。',
  },
  {
    id: 'iron-blade',
    name: '精鋼刀',
    slot: 'weapon',
    rarity: 'fine',
    weaponKind: 'blade',
    attack: 10,
    martialBonus: 2,
    combat: { pierce: 0.05 },
    description: '刃口寒光隱現，適合行路。',
  },
  {
    id: 'pine-armor',
    name: '松紋皮甲',
    slot: 'armor',
    rarity: 'fine',
    defense: 8,
    maxHpBonus: 20,
    combat: { reflect: 0.04 },
    description: '輕便防身，不礙運氣。',
  },
  {
    id: 'cloud-boots',
    name: '踏雲靴',
    slot: 'accessory',
    rarity: 'rare',
    defense: 4,
    maxQiBonus: 15,
    combat: { evasion: 0.05 },
    description: '步履輕捷，似可踏雲。',
  },
  {
    id: 'jade-token',
    name: '青玉令',
    slot: 'accessory',
    rarity: 'rare',
    martialBonus: 5,
    maxQiBonus: 25,
    combat: { hitBonus: 0.04 },
    description: '門中信物，內息更穩。',
  },
  {
    id: 'inkrain-sword',
    name: '墨雨劍',
    slot: 'weapon',
    rarity: 'epic',
    weaponKind: 'sword',
    attack: 22,
    martialBonus: 8,
    maxQiBonus: 20,
    combat: { pierce: 0.08, hitBonus: 0.03 },
    special: {
      kind: 'burst',
      name: '劍雨驟至',
      description: '出手時偶有劍氣暴漲，追加一記重擊',
      chance: 0.25,
      power: 0.6,
    },
    description: '劍身如墨，雨夜出鞘更冷。',
  },
  {
    id: 'hundredfold-blade',
    name: '百煉百折刀',
    slot: 'weapon',
    rarity: 'epic',
    weaponKind: 'blade',
    attack: 28,
    martialBonus: 10,
    maxHpBonus: 30,
    combat: { lifesteal: 0.06 },
    special: {
      kind: 'stun_proc',
      name: '百折驚魂',
      description: '刀勢連環，偶爾令敵方穴道一窒，錯失一回合',
      chance: 0.2,
    },
    description: '百煉而成，刃口隱有折光。',
  },
  {
    id: 'divine-xuan-sword',
    name: '玄鐵重劍',
    slot: 'weapon',
    rarity: 'divine',
    weaponKind: 'sword',
    attack: 48,
    martialBonus: 18,
    maxHpBonus: 60,
    maxQiBonus: 40,
    combat: { pierce: 0.12, hitBonus: 0.06 },
    special: {
      kind: 'stun_proc',
      name: '重劍無鋒',
      description: '劍重勢沉，一擊之下常令敵方氣血逆流、穴道錯亂',
      chance: 0.3,
    },
    description: '神兵遺響，重若千鈞，唯有根骨深厚者可御。',
  },
  {
    id: 'bronze-spear',
    name: '青銅槍',
    slot: 'weapon',
    rarity: 'fine',
    weaponKind: 'spear',
    attack: 11,
    martialBonus: 1,
    combat: { pierce: 0.06 },
    description: '槍尖沉穩，進退有度，江湖行腳常見。',
  },
  {
    id: 'crescent-blade',
    name: '月牙彎刀',
    slot: 'weapon',
    rarity: 'rare',
    weaponKind: 'blade',
    attack: 16,
    martialBonus: 4,
    combat: { bleedChance: 0.12 },
    description: '刀弧如月，擅取側翼。',
  },
  {
    id: 'pine-staff',
    name: '鐵頭竹杖',
    slot: 'weapon',
    rarity: 'fine',
    weaponKind: 'staff',
    attack: 8,
    defense: 3,
    martialBonus: 2,
    combat: { reflect: 0.03 },
    description: '杖法入門，攻守兼備。',
  },
  {
    id: 'meteor-whip',
    name: '流星軟鞭',
    slot: 'weapon',
    rarity: 'rare',
    weaponKind: 'whip',
    attack: 14,
    martialBonus: 5,
    maxQiBonus: 10,
    combat: { hitBonus: 0.08 },
    description: '鞭影連綿，遠近皆宜。',
  },
  {
    id: 'hunter-bow',
    name: '獵弓',
    slot: 'weapon',
    rarity: 'fine',
    weaponKind: 'bow',
    attack: 9,
    martialBonus: 3,
    combat: { hitBonus: 0.1 },
    description: '弓弦緊繃，百步穿楊需日課。',
  },
  {
    id: 'sleeve-darts',
    name: '袖裡飛針',
    slot: 'weapon',
    rarity: 'rare',
    weaponKind: 'hidden',
    attack: 12,
    martialBonus: 6,
    combat: { bleedChance: 0.15 },
    description: '暗器無形，出手須留三分。',
  },
  {
    id: 'twin-hooks',
    name: '鴛鴦雙鉤',
    slot: 'weapon',
    rarity: 'epic',
    weaponKind: 'blade',
    attack: 24,
    martialBonus: 9,
    combat: { pierce: 0.1, hitBonus: 0.04 },
    special: {
      kind: 'burst',
      name: '雙鉤連環',
      description: '雙鉤相扣連削，偶有一記追加斬擊',
      chance: 0.2,
      power: 0.5,
    },
    description: '雙鉤相扣，專破兵刃格擋。',
  },
  {
    id: 'phoenix-blood-blade',
    name: '鳳血刀',
    slot: 'weapon',
    rarity: 'mythic',
    weaponKind: 'blade',
    attack: 34,
    martialBonus: 13,
    maxHpBonus: 40,
    combat: { lifesteal: 0.05 },
    special: {
      kind: 'burst',
      name: '鳳血噬魂',
      description: '刀刃如浴火鳳血，偶有噬魂一擊，傷勢倍增',
      chance: 0.28,
      power: 0.65,
    },
    description: '傳說以鳳血淬煉而成，刀身隱隱透紅。',
  },
  {
    id: 'stormcloud-armor',
    name: '驚雷戰甲',
    slot: 'armor',
    rarity: 'mythic',
    defense: 26,
    maxHpBonus: 70,
    maxQiBonus: 20,
    combat: { reflect: 0.06 },
    special: {
      kind: 'stun_proc',
      name: '驚雷反震',
      description: '受擊時偶有驚雷反震，令敵方穴道一滯',
      chance: 0.18,
    },
    description: '甲上雷紋隱現，交手時偶有雷鳴之聲。',
  },
  {
    id: 'divine-silk-armor',
    name: '金絲軟甲',
    slot: 'armor',
    rarity: 'divine',
    defense: 36,
    maxHpBonus: 100,
    maxQiBonus: 30,
    combat: { reflect: 0.08, evasion: 0.03 },
    special: {
      kind: 'revive',
      name: '金絲護體',
      description: '氣血將盡時，金絲軟甲護住心脈，保命一次（一場戰鬥限一次）',
      power: 0.3,
    },
    description: '柔若無物，刀槍難入，傳聞出自奇人秘造。',
  },
  {
    id: 'divine-moon-pendant',
    name: '寒月心佩',
    slot: 'accessory',
    rarity: 'divine',
    martialBonus: 15,
    maxQiBonus: 80,
    defense: 8,
    combat: { hitBonus: 0.08, evasion: 0.04 },
    special: {
      kind: 'burst',
      name: '寒月奪魄',
      description: '內息隨月盈虧，偶有奪魄一擊，傷勢驟增',
      chance: 0.25,
      power: 0.7,
    },
    description: '佩之則內息如潮，夜觀星斗似有所悟。',
  },
];

export const rarityLabel: Record<GearRarity, string> = {
  common: '凡品',
  fine: '良品',
  rare: '珍品',
  epic: '絕品',
  mythic: '曠品',
  divine: '神兵',
};

/** 稀有度色階：白＜綠＜藍＜紫＜橙＜紅；對應 CSS class（見 src/styles.css） */
export const RARITY_COLOR_CLASS: Record<GearRarity, string> = {
  common: 'ink-rarity-common',
  fine: 'ink-rarity-fine',
  rare: 'ink-rarity-rare',
  epic: 'ink-rarity-epic',
  mythic: 'ink-rarity-mythic',
  divine: 'ink-rarity-divine',
};

/** 紫（epic）以上先有獨特效果 */
export function hasSpecialEffect(def: GearDef): boolean {
  return (
    Boolean(def.special) &&
    (def.rarity === 'epic' || def.rarity === 'mythic' || def.rarity === 'divine')
  );
}

export function formatGearSpecialLine(def: GearDef): string {
  const s = def.special;
  if (!s || !hasSpecialEffect(def)) return '';
  const chanceBit = s.chance ? `（${Math.round(s.chance * 100)}%機率）` : '';
  return `絕技·${s.name}${chanceBit}：${s.description}`;
}

export function getGearDef(id: string): GearDef | undefined {
  const base = GEAR_CATALOG.find((g) => g.id === id);
  if (!base) return undefined;
  const patch = getGearPatch(id);
  return patch ? applyGearPatch(base, patch) : base;
}

/** 唔套用本地補丁嘅底本定義（編修器對照用） */
export function getBaseGearDef(id: string): GearDef | undefined {
  return GEAR_CATALOG.find((g) => g.id === id);
}

const pct = (n: number) => `${Math.round(n * 100)}%`;

/** 披掛基礎一行（威／禦／氣血／內息／武學） */
export function formatGearStatLine(def: GearDef): string {
  const parts: string[] = [];
  if (def.attack) parts.push(`威＋${def.attack}`);
  if (def.defense) parts.push(`禦＋${def.defense}`);
  if (def.maxHpBonus) parts.push(`氣血＋${def.maxHpBonus}`);
  if (def.maxQiBonus) parts.push(`內息＋${def.maxQiBonus}`);
  if (def.martialBonus) parts.push(`武學＋${def.martialBonus}`);
  return parts.join(' · ');
}

/** 披掛交手特效一行 */
export function formatGearCombatLine(def: GearDef): string {
  const c = def.combat;
  if (!c) return '';
  const parts: string[] = [];
  if (c.hitBonus) parts.push(`準＋${pct(c.hitBonus)}`);
  if (c.evasion) parts.push(`身法＋${pct(c.evasion)}`);
  if (c.reflect) parts.push(`反震${pct(c.reflect)}`);
  if (c.pierce) parts.push(`破甲${pct(c.pierce)}`);
  if (c.lifesteal) parts.push(`吸敵氣血${pct(c.lifesteal)}`);
  if (c.bleedChance) parts.push(`見血${pct(c.bleedChance)}`);
  return parts.length ? `特效：${parts.join('、')}` : '';
}

export function formatGearFullSummary(def: GearDef): string {
  const base = formatGearStatLine(def);
  const fx = formatGearCombatLine(def);
  const special = formatGearSpecialLine(def);
  const bits = [base, fx, special].filter(Boolean);
  if (bits.length) return bits.join(' — ');
  return def.description;
}

export function rollForgeResult(
  rng: { nextFloat: () => number; chance: (p: number) => boolean },
  opts?: { age?: number; martial?: number },
): string {
  const age = opts?.age ?? 20;
  const martial = opts?.martial ?? 10;
  // 年輕／武淺：神兵幾乎無；年長武深：絕品／神兵機率上升（整體已調低）
  const tier = Math.min(1, Math.max(0, (age - 18) / 40 + martial / 120));
  const roll = rng.nextFloat();
  const divineGate = 0.002 + tier * 0.018;
  const mythicGate = divineGate + 0.008 + tier * 0.02;
  const epicGate = mythicGate + 0.03 + tier * 0.05;
  const rareGate = epicGate + 0.08 + tier * 0.05;
  if (roll < divineGate * 0.34) return 'divine-xuan-sword';
  if (roll < divineGate * 0.67) return 'divine-silk-armor';
  if (roll < divineGate) return 'divine-moon-pendant';
  if (roll < divineGate + (mythicGate - divineGate) * 0.5) return 'phoenix-blood-blade';
  if (roll < mythicGate) return 'stormcloud-armor';
  if (roll < mythicGate + (epicGate - mythicGate) * 0.4) return 'hundredfold-blade';
  if (roll < mythicGate + (epicGate - mythicGate) * 0.7) return 'inkrain-sword';
  if (roll < epicGate) return 'twin-hooks';
  if (roll < rareGate * 0.35) return 'jade-token';
  if (roll < rareGate * 0.55) return 'meteor-whip';
  if (roll < rareGate * 0.75) return 'crescent-blade';
  if (roll < rareGate) return 'sleeve-darts';
  if (roll < rareGate + 0.1) return 'cloud-boots';
  if (roll < rareGate + 0.22) return 'iron-blade';
  if (roll < rareGate + 0.34) return 'bronze-spear';
  if (roll < rareGate + 0.44) return 'hunter-bow';
  if (roll < rareGate + 0.54) return 'pine-staff';
  if (roll < rareGate + 0.7) return 'pine-armor';
  return 'old-sword';
}

export function rollAdventureGear(rng: { nextFloat: () => number }): string | null {
  const roll = rng.nextFloat();
  if (roll < 0.02) return 'divine-xuan-sword';
  if (roll < 0.035) return 'divine-silk-armor';
  if (roll < 0.05) return 'divine-moon-pendant';
  if (roll < 0.065) return 'phoenix-blood-blade';
  if (roll < 0.075) return 'stormcloud-armor';
  if (roll < 0.125) return 'twin-hooks';
  if (roll < 0.165) return 'inkrain-sword';
  if (roll < 0.225) return 'hundredfold-blade';
  if (roll < 0.305) return 'sleeve-darts';
  if (roll < 0.375) return 'jade-token';
  if (roll < 0.445) return 'meteor-whip';
  if (roll < 0.525) return 'cloud-boots';
  if (roll < 0.645) return 'crescent-blade';
  if (roll < 0.745) return 'iron-blade';
  if (roll < 0.845) return 'bronze-spear';
  if (roll < 0.925) return 'hunter-bow';
  return null;
}
