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
  // ===== 百兵譜：五十兵器，七門各擅 =====
  // —— 劍（八） ——
  { id: 'qingfeng-sword', name: '鐵匠鋪青鋒劍', slot: 'weapon', rarity: 'common', weaponKind: 'sword', attack: 5, combat: { hitBonus: 0.02 }, description: '鎮上鐵匠鋪的常備貨，勝在結實。' },
  { id: 'wanderer-sword', name: '游俠佩劍', slot: 'weapon', rarity: 'common', weaponKind: 'sword', attack: 6, combat: { hitBonus: 0.03 }, description: '劍鞘磨得發亮，主人換過好幾個。' },
  { id: 'frostvein-sword', name: '霜紋劍', slot: 'weapon', rarity: 'fine', weaponKind: 'sword', attack: 11, martialBonus: 1, combat: { pierce: 0.04 }, description: '劍身霜紋如裂冰，出鞘帶三分寒氣。' },
  { id: 'pinewind-sword', name: '松風劍', slot: 'weapon', rarity: 'fine', weaponKind: 'sword', attack: 9, martialBonus: 2, combat: { hitBonus: 0.05 }, description: '揮動時隱有松濤之聲，劍路清正。' },
  { id: 'autumnwater-sword', name: '秋水長劍', slot: 'weapon', rarity: 'rare', weaponKind: 'sword', attack: 15, martialBonus: 4, maxQiBonus: 10, combat: { hitBonus: 0.05 }, description: '劍光如一泓秋水，靜時已教人心寒。' },
  { id: 'peakbreaker-sword', name: '斷岳重劍', slot: 'weapon', rarity: 'rare', weaponKind: 'sword', attack: 17, martialBonus: 3, combat: { pierce: 0.07 }, description: '重劍無花巧，一壓一劈皆是山勢。' },
  { id: 'snowstream-sword', name: '流光飛雪劍', slot: 'weapon', rarity: 'epic', weaponKind: 'sword', attack: 25, martialBonus: 9, maxQiBonus: 15, combat: { pierce: 0.07, hitBonus: 0.04 }, special: { kind: 'burst', name: '飛雪連星', description: '劍勢如飛雪連星，偶有追加一記寒芒', chance: 0.22, power: 0.55 }, description: '劍光過處，如見雪落無聲。' },
  { id: 'taiya-sword', name: '太阿遺鋒', slot: 'weapon', rarity: 'mythic', weaponKind: 'sword', attack: 36, martialBonus: 14, maxQiBonus: 30, combat: { pierce: 0.1, hitBonus: 0.05 }, special: { kind: 'stun_proc', name: '太阿壓頂', description: '劍勢如泰山壓頂，偶令敵方氣機一窒、錯失一回合', chance: 0.25 }, description: '古劍太阿的遺鋒，威風凜凜，非大勇之士不能用。' },
  // —— 刀（七） ——
  { id: 'firewood-blade', name: '柴口短刀', slot: 'weapon', rarity: 'common', weaponKind: 'blade', attack: 4, description: '砍柴剖魚都使得，殺敵勉强也使得。' },
  { id: 'rustring-blade', name: '鏽環刀', slot: 'weapon', rarity: 'common', weaponKind: 'blade', attack: 5, combat: { bleedChance: 0.05 }, description: '刀環鏽跡斑斑，搖起來卻還響亮。' },
  { id: 'yanling-blade', name: '雁翎刀', slot: 'weapon', rarity: 'fine', weaponKind: 'blade', attack: 10, martialBonus: 1, combat: { pierce: 0.05 }, description: '刀形修長如雁翎，官道鏢師多用此刀。' },
  { id: 'nightwalk-blade', name: '夜行薄刀', slot: 'weapon', rarity: 'fine', weaponKind: 'blade', attack: 9, combat: { evasion: 0.03, hitBonus: 0.04 }, description: '刀薄如紙，收在袖中不見痕跡。' },
  { id: 'streamcut-blade', name: '斷水快刀', slot: 'weapon', rarity: 'rare', weaponKind: 'blade', attack: 15, martialBonus: 4, combat: { bleedChance: 0.1 }, description: '快得能斷水流，敵人見血方知中刀。' },
  { id: 'redbronze-blade', name: '赤銅砍刀', slot: 'weapon', rarity: 'rare', weaponKind: 'blade', attack: 16, martialBonus: 3, combat: { pierce: 0.06 }, description: '赤銅為脊，劈砍之勢沉雄。' },
  { id: 'wavebreaker-blade', name: '斷浪狂刀', slot: 'weapon', rarity: 'epic', weaponKind: 'blade', attack: 26, martialBonus: 9, maxHpBonus: 20, combat: { lifesteal: 0.05 }, special: { kind: 'burst', name: '斷浪三疊', description: '刀勢如浪三疊，偶有追加一記狂斬', chance: 0.24, power: 0.6 }, description: '刀出如浪崩，連綿不絕。' },
  // —— 槍（七） ——
  { id: 'waxwood-spear', name: '白蠟桿槍', slot: 'weapon', rarity: 'common', weaponKind: 'spear', attack: 5, combat: { pierce: 0.03 }, description: '白蠟桿柔韌，槍尖一顫三變。' },
  { id: 'bambootip-spear', name: '竹尖槍', slot: 'weapon', rarity: 'common', weaponKind: 'spear', attack: 4, combat: { pierce: 0.04 }, description: '獵戶自削的竹槍，輕便堪用。' },
  { id: 'pearflower-spear', name: '梨花槍', slot: 'weapon', rarity: 'fine', weaponKind: 'spear', attack: 11, martialBonus: 1, combat: { hitBonus: 0.05 }, description: '槍花抖開如梨花紛落，好看亦好殺。' },
  { id: 'snakespine-spear', name: '鐵脊蛇矛', slot: 'weapon', rarity: 'fine', weaponKind: 'spear', attack: 12, martialBonus: 1, combat: { pierce: 0.06 }, description: '矛身如蛇脊，刺出詭直難測。' },
  { id: 'prairie-spear', name: '燎原火槍', slot: 'weapon', rarity: 'rare', weaponKind: 'spear', attack: 16, martialBonus: 4, combat: { bleedChance: 0.08 }, description: '槍勢燎原，一旦搶先便步步進逼。' },
  { id: 'turnback-spear', name: '回馬槍', slot: 'weapon', rarity: 'rare', weaponKind: 'spear', attack: 14, martialBonus: 5, combat: { evasion: 0.04 }, description: '敗中藏勝，回馬一槍最難防。' },
  { id: 'dragoncall-spear', name: '龍膽亮銀槍', slot: 'weapon', rarity: 'epic', weaponKind: 'spear', attack: 27, martialBonus: 10, combat: { pierce: 0.09, hitBonus: 0.05 }, special: { kind: 'burst', name: '龍膽七探', description: '槍出如龍探爪，偶有一記追加突刺', chance: 0.25, power: 0.6 }, description: '亮銀槍身，傳聞隨名將七進七出。' },
  // —— 杖（七） ——
  { id: 'firestick-staff', name: '燒火棍', slot: 'weapon', rarity: 'common', weaponKind: 'staff', attack: 3, defense: 2, description: '灶下燒火棍，黑是黑，夠硬淨。' },
  { id: 'elm-staff', name: '榆木齊眉棍', slot: 'weapon', rarity: 'common', weaponKind: 'staff', attack: 4, defense: 2, description: '齊眉長短，武館學徒的第一根棍。' },
  { id: 'madmonk-staff', name: '瘋魔杖', slot: 'weapon', rarity: 'fine', weaponKind: 'staff', attack: 9, martialBonus: 2, combat: { reflect: 0.04 }, description: '杖法瘋魔，亂中自有章法。' },
  { id: 'vajra-staff', name: '鐵包裹金剛杵', slot: 'weapon', rarity: 'fine', weaponKind: 'staff', attack: 10, defense: 4, description: '鐵皮包杵，舞起來風聲赫赫。' },
  { id: 'demonquell-staff', name: '降魔禪杖', slot: 'weapon', rarity: 'rare', weaponKind: 'staff', attack: 15, defense: 6, martialBonus: 3, description: '禪杖降魔，月下鐵影如塔。' },
  { id: 'dogbeat-staff', name: '打狗青竹杖', slot: 'weapon', rarity: 'rare', weaponKind: 'staff', attack: 13, martialBonus: 5, combat: { evasion: 0.05 }, description: '青竹一根，專打惡犬與惡人。' },
  { id: 'dragonbind-staff', name: '伏龍鐵杖', slot: 'weapon', rarity: 'epic', weaponKind: 'staff', attack: 24, defense: 8, martialBonus: 8, combat: { reflect: 0.05 }, special: { kind: 'stun_proc', name: '伏龍鎮嶽', description: '杖落如鎮嶽，偶令敵方氣血一滯、錯失一回合', chance: 0.2 }, description: '重杖伏龍，非膂力過人者不能舉。' },
  // —— 鞭（七） ——
  { id: 'oxhide-whip', name: '牛皮短鞭', slot: 'weapon', rarity: 'common', weaponKind: 'whip', attack: 4, combat: { hitBonus: 0.03 }, description: '車把式的牛皮鞭，甩得脆響。' },
  { id: 'hemp-whip', name: '麻繩軟鞭', slot: 'weapon', rarity: 'common', weaponKind: 'whip', attack: 3, combat: { bleedChance: 0.05 }, description: '麻繩浸油，抽在身上又辣又痛。' },
  { id: 'silverbell-whip', name: '銀鈴九節鞭', slot: 'weapon', rarity: 'fine', weaponKind: 'whip', attack: 9, combat: { hitBonus: 0.07 }, description: '九節相連，銀鈴一響鞭已至。' },
  { id: 'snakebone-whip', name: '蛇骨鞭', slot: 'weapon', rarity: 'fine', weaponKind: 'whip', attack: 10, combat: { bleedChance: 0.08 }, description: '鞭節如蛇骨，纏上便見血痕。' },
  { id: 'dragonswim-whip', name: '游龍長鞭', slot: 'weapon', rarity: 'rare', weaponKind: 'whip', attack: 15, martialBonus: 4, combat: { hitBonus: 0.09 }, description: '鞭走如游龍，長短遠近俱在掌握。' },
  { id: 'wolffang-whip', name: '倒鉤狼牙鞭', slot: 'weapon', rarity: 'rare', weaponKind: 'whip', attack: 14, martialBonus: 4, combat: { bleedChance: 0.12 }, description: '倒鉤如狼牙，着肉難解。' },
  { id: 'yama-whip', name: '閻羅索命鞭', slot: 'weapon', rarity: 'epic', weaponKind: 'whip', attack: 23, martialBonus: 9, maxQiBonus: 15, combat: { hitBonus: 0.07 }, special: { kind: 'stun_proc', name: '索命纏絲', description: '鞭如索命纏絲，偶令敵方手腳一僵、錯失一回合', chance: 0.2 }, description: '鞭影起處，如聞閻羅點名。' },
  // —— 弓（七） ——
  { id: 'mulberry-bow', name: '桑木弓', slot: 'weapon', rarity: 'common', weaponKind: 'bow', attack: 5, combat: { hitBonus: 0.04 }, description: '農家桑木弓，射雀有餘。' },
  { id: 'hunter-shortbow', name: '獵戶短弓', slot: 'weapon', rarity: 'common', weaponKind: 'bow', attack: 6, combat: { hitBonus: 0.06 }, description: '山林獵戶的短弓，上弦極快。' },
  { id: 'birch-bow', name: '樺皮角弓', slot: 'weapon', rarity: 'fine', weaponKind: 'bow', attack: 11, martialBonus: 2, combat: { hitBonus: 0.09 }, description: '角弓樺皮，北地好手的爱物。' },
  { id: 'repeater-bow', name: '連珠弩', slot: 'weapon', rarity: 'fine', weaponKind: 'bow', attack: 12, combat: { pierce: 0.05 }, description: '弩匣連珠，短瞬三矢。' },
  { id: 'goosedrop-bow', name: '落雁弓', slot: 'weapon', rarity: 'rare', weaponKind: 'bow', attack: 16, martialBonus: 4, combat: { hitBonus: 0.11 }, description: '弓開如滿月，雁落長空。' },
  { id: 'armorbreaker-bow', name: '破甲重弩', slot: 'weapon', rarity: 'rare', weaponKind: 'bow', attack: 17, martialBonus: 2, combat: { pierce: 0.09 }, description: '重弩破甲，鐵盾亦難擋。' },
  { id: 'sunshot-bow', name: '射日神臂弓', slot: 'weapon', rarity: 'epic', weaponKind: 'bow', attack: 26, martialBonus: 9, combat: { hitBonus: 0.08, pierce: 0.06 }, special: { kind: 'burst', name: '射日貫虹', description: '箭出如貫長虹，偶有追加一記奪命遠射', chance: 0.22, power: 0.65 }, description: '神臂開弓，傳聞可射落九日。' },
  // —— 暗器（七） ——
  { id: 'sleeve-arrow', name: '袖箭', slot: 'weapon', rarity: 'common', weaponKind: 'hidden', attack: 4, combat: { bleedChance: 0.06 }, description: '袖中藏箭，近身一抬手便見紅。' },
  { id: 'locust-stones', name: '飛蝗石', slot: 'weapon', rarity: 'common', weaponKind: 'hidden', attack: 3, combat: { hitBonus: 0.05 }, description: '河灘圓石，兜裡總有幾枚。' },
  { id: 'plum-needles', name: '梅花袖針', slot: 'weapon', rarity: 'fine', weaponKind: 'hidden', attack: 9, combat: { bleedChance: 0.1 }, description: '針出五點如梅花，着膚即麻。' },
  { id: 'iron-lotus', name: '鐵蓮子', slot: 'weapon', rarity: 'fine', weaponKind: 'hidden', attack: 10, combat: { hitBonus: 0.06 }, description: '鐵蓮子入手沉實，打穴最準。' },
  { id: 'bonepierce-nails', name: '透骨釘', slot: 'weapon', rarity: 'rare', weaponKind: 'hidden', attack: 13, martialBonus: 5, combat: { bleedChance: 0.14 }, description: '釘長三分，透骨而過。' },
  { id: 'shadowless-knives', name: '無影飛刀', slot: 'weapon', rarity: 'rare', weaponKind: 'hidden', attack: 14, martialBonus: 5, combat: { hitBonus: 0.08 }, description: '刀小無影，出手無聲。' },
  { id: 'thousandworks-box', name: '千機暴雨匣', slot: 'weapon', rarity: 'epic', weaponKind: 'hidden', attack: 24, martialBonus: 10, combat: { hitBonus: 0.06, bleedChance: 0.1 }, special: { kind: 'burst', name: '暴雨千機', description: '機括一響暗器如雨，偶有追加一輪攢射', chance: 0.26, power: 0.5 }, description: '匣藏千機，開時如暴雨傾盆。' },
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

/** 按稀有度分池（百兵譜入咗目錄就自動入池） */
const POOL_BY_RARITY: Record<GearRarity, string[]> = GEAR_CATALOG.reduce(
  (acc, g) => {
    acc[g.rarity].push(g.id);
    return acc;
  },
  { common: [], fine: [], rare: [], epic: [], mythic: [], divine: [] } as Record<GearRarity, string[]>,
);

function pickFromPool(rng: { nextFloat: () => number }, rarity: GearRarity): string {
  const pool = POOL_BY_RARITY[rarity];
  if (!pool.length) return 'old-sword';
  return pool[Math.min(pool.length - 1, Math.floor(rng.nextFloat() * pool.length))];
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
  if (roll < divineGate) return pickFromPool(rng, 'divine');
  if (roll < mythicGate) return pickFromPool(rng, 'mythic');
  if (roll < epicGate) return pickFromPool(rng, 'epic');
  if (roll < rareGate) return pickFromPool(rng, 'rare');
  if (roll < rareGate + 0.34) return pickFromPool(rng, 'fine');
  return pickFromPool(rng, 'common');
}

export function rollAdventureGear(rng: { nextFloat: () => number }): string | null {
  const roll = rng.nextFloat();
  if (roll < 0.05) return pickFromPool(rng, 'divine');
  if (roll < 0.075) return pickFromPool(rng, 'mythic');
  if (roll < 0.225) return pickFromPool(rng, 'epic');
  if (roll < 0.525) return pickFromPool(rng, 'rare');
  if (roll < 0.845) return pickFromPool(rng, 'fine');
  if (roll < 0.925) return pickFromPool(rng, 'common');
  return null;
}
