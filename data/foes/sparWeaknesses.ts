import type { WeaponKind } from '@data/equipment/catalog';

export type SparOpening =
  | { kind: 'weapon'; weapon: WeaponKind | 'unarmed' }
  | { kind: 'pierce' | 'multiHit' | 'heavy' | 'feint' | 'blind' | 'defenseBreak' | 'stun' | 'drain' };

type SparWindow = 'charging' | 'wounded';

export type SparWeakness = { clue: string; when?: SparWindow } & (
  | SparOpening
  | { kind: 'bleed'; art?: string }
  | { kind: 'art'; art: string; fallback: SparOpening }
);

/** 第十關起，每十關一處破綻。玩家只見各章的交手描寫。 */
export const SPAR_BOSS_WEAKNESSES: Readonly<Partial<Record<number, SparWeakness>>> = {
  10: { kind: 'pierce', clue: '他護住胸口，腋下的衣縫卻露了出來。' },
  20: { kind: 'heavy', when: 'charging', clue: '他雙手舉刀過頂時，兩肋全無遮掩。' },
  30: { kind: 'bleed', clue: '他揉了揉腕上舊傷，袖口又泛起一點紅。' },
  40: { kind: 'multiHit', clue: '他擋得住頭一下，收臂卻總慢半拍。' },
  50: { kind: 'heavy', clue: '石階被他踩得一沉，他竟未移開半步。' },
  60: { kind: 'feint', when: 'wounded', clue: '氣息一亂，他便盯著對手的肩膀搶攻。' },
  70: { kind: 'art', art: 'art_thunder_blade', fallback: { kind: 'weapon', weapon: 'blade' }, clue: '驛外才響一聲悶雷，他便縮了縮持刀的手。' },
  80: { kind: 'weapon', weapon: 'whip', clue: '他一把攥住直來的船索，貼水繞回那截卻纏上了腳踝。' },
  90: { kind: 'bleed', when: 'wounded', clue: '他氣力一衰，方才合攏的血口又迸開了。' },
  100: { kind: 'weapon', weapon: 'sword', clue: '兩劍交錯一挑，短甲的繫帶已鬆了半截。' },
  110: { kind: 'drain', when: 'wounded', clue: '火把燃過一半，他每次提氣都要停一息。' },
  120: { kind: 'weapon', weapon: 'unarmed', clue: '他專盯兵刃，近身那記短拳來得比他預想更快。' },
  130: { kind: 'blind', clue: '雨水一迷眼，他便把刀揮向簷鈴聲處。' },
  140: { kind: 'weapon', weapon: 'staff', clue: '他能架開棍頭，卻顧不到掉頭掃回的另一端。' },
  150: { kind: 'art', art: 'art_stone_palm', fallback: { kind: 'defenseBreak' }, clue: '架下傳出一聲石裂，藥囊從他鬆開的臂彎滑落。' },
  160: { kind: 'pierce', when: 'wounded', clue: '他半身袍袂垂下，才露出護腕那道缺口。' },
  170: { kind: 'weapon', weapon: 'bow', clue: '雪地隔得遠，一聲弓弦響，他竟來不及伏下。' },
  180: { kind: 'weapon', weapon: 'spear', clue: '他守得住旗內三步，旗外的長鋒卻探到了胸前。' },
  190: { kind: 'bleed', art: 'art_shadow_needle', clue: '港人傳他怕潮，一點細如針孔的傷也會染透袖口。' },
  200: { kind: 'weapon', weapon: 'hidden', clue: '他聽得穿林的腳步，袖裏飛出的小東西卻不響。' },
  210: { kind: 'art', art: 'art_drunken_fist', fallback: { kind: 'multiHit' }, clue: '往年有人醉步登臺，三拳竟都落在同一處。' },
  220: { kind: 'defenseBreak', clue: '鐘聲一落，他撐得住第一掌，護臂卻被慢慢壓開。' },
  230: { kind: 'stun', clue: '索橋一晃，他腳下一頓，手仍懸在半空。' },
  240: { kind: 'weapon', weapon: 'blade', clue: '他側身護旗，甲片齊齊逆著刀鋒掀起。' },
  250: { kind: 'art', art: 'art_rain_sword', fallback: { kind: 'feint' }, clue: '雨絲斜過劍尖，他追著一點寒光踏空了。' },
  260: { kind: 'multiHit', when: 'wounded', clue: '盟主一口氣提不上來，接連兩次都來不及回架。' },
};
