import type { LifeGameState } from '@interfaces/lifeEngine';
import { wuxiaAttributeKeys } from '@interfaces/lifeEngine';
import { familyGearCarry, getHeirName, listChildNames, previewInheritanceMoney } from './family';
import { sealGenealogyForLegacy, writeGenealogyChronicle } from './genealogy';
import { alignClanSurnames } from './clanNames';
import { displayGearName } from './equipment';
import { getGearDef } from '@data/equipment/catalog';

/** 前世可帶入來世的墨跡（非付費、非碾壓） */
export interface LegacyCarry {
  generation: number;
  ancestorName: string;
  ancestorAge: number;
  ancestorMartial: number;
  ancestorReputation: number;
  ancestorWealthPeak: number;
  familyLegacy: boolean;
  teacherLegacy: boolean;
  birthplace?: string;
  friendNpcId?: string;
  rivalHint?: string;
  gearHint?: string;
  titleHints?: string[];
  /** 有子女時的血脈繼承 */
  heirName?: string;
  childrenNames?: string[];
  inheritedMoney?: number;
  hadChildren?: boolean;
  /** 無子女：由族中旁支承祧（家族成果照傳） */
  collateral?: boolean;
  /** 家族裝備庫：前人所有裝備 id */
  inheritedGear?: string[];
  /** 前人穿戴配搭（後人照穿） */
  inheritedEquipment?: { weapon: string | null; armor: string | null; accessory: string | null };
  /** 跨世族譜殘頁 */
  genealogyChronicle?: string[];
  /** 前世人生題眼 */
  lifeTheme?: string;
}

export function extractLegacy(state: LifeGameState): LegacyCarry {
  const c = state.character;
  const gen = Math.max(1, Number(c.flags.legacy_generation ?? 1));
  const friendNpcId =
    typeof c.flags.legacy_friend === 'string'
      ? c.flags.legacy_friend
      : Object.values(state.npcs ?? {})
          .filter((n) => n.alive && (n.affinity ?? 0) >= 45)
          .sort((a, b) => (b.affinity ?? 0) - (a.affinity ?? 0))[0]?.id;
  const rival =
    Object.values(state.npcs ?? {})
      .filter((n) => (n.affinity ?? 0) <= -25)
      .sort((a, b) => (a.affinity ?? 0) - (b.affinity ?? 0))[0]?.name ??
    (c.flags.aftermath_blood_foe ? String(c.flags.aftermath_blood_foe) : undefined);
  const equipped =
    c.equipment?.weapon || c.equipment?.armor || c.equipment?.accessory || undefined;
  const titleIds =
    typeof c.flags.titles === 'string'
      ? c.flags.titles.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

  const childrenNames = listChildNames(state);
  const hadChildren = childrenNames.length > 0 || (c.childrenCount ?? 0) > 0;
  const heirName = hadChildren ? getHeirName(state) ?? childrenNames[0] : undefined;
  // 家族銀庫／裝備庫：全數傳後人，無嗣由旁支承接（design/agreed-design-2026-10.md §1）
  const inheritedMoney = previewInheritanceMoney(state);
  const inheritedGear = familyGearCarry(state);
  const genealogyChronicle = sealGenealogyForLegacy(state);

  return {
    generation: gen,
    ancestorName: c.name,
    ancestorAge: c.age,
    ancestorMartial: c.martial,
    ancestorReputation: c.reputation,
    ancestorWealthPeak: c.stats.wealthPeak,
    // 家族一定延續：有子女由子女接，冇就由旁支接
    familyLegacy: true,
    teacherLegacy: Boolean(c.flags.legacy_teacher),
    birthplace: c.birthplace,
    friendNpcId,
    rivalHint: rival,
    gearHint: equipped ? displayGearName(equipped) : undefined,
    titleHints: titleIds.slice(0, 3),
    heirName: heirName || undefined,
    childrenNames: childrenNames.length ? childrenNames : undefined,
    inheritedMoney,
    hadChildren,
    collateral: !hadChildren,
    inheritedGear: inheritedGear.length ? inheritedGear : undefined,
    inheritedEquipment: c.equipment ? { ...c.equipment } : undefined,
    genealogyChronicle,
    lifeTheme:
      typeof c.flags.life_theme === 'string' ? String(c.flags.life_theme) : undefined,
  };
}

export function applyLegacyToCharacter(state: LifeGameState, legacy: LegacyCarry): string[] {
  const c = state.character;
  const lines: string[] = [];
  const gen = legacy.generation + 1;
  c.flags.legacy_generation = gen;
  c.flags.legacy_ancestor = legacy.ancestorName;
  if (legacy.genealogyChronicle?.length) {
    writeGenealogyChronicle(c, legacy.genealogyChronicle);
  }
  lines.push(
    `前世「${legacy.ancestorName}」享年 ${legacy.ancestorAge}，此為第 ${gen} 世入江湖。`,
  );

  // 軟繼承：取前世武學／名望的一小截，避免碾壓
  const martialBonus = Math.min(12, Math.floor(legacy.ancestorMartial * 0.08));
  if (martialBonus > 0) {
    c.martial += martialBonus;
    lines.push(`祖輩拳腳殘影：武學＋${martialBonus}`);
  }

  // 家族接班：子女（血脈）或旁支（承祧）；銀庫、裝備庫全數承接
  c.flags.born_with_family_legacy = true;
  c.flags.family_legacy = true;
  c.attributes.fuYuan = Math.min(100, c.attributes.fuYuan + 5);
  if (legacy.heirName && !legacy.collateral) {
    c.flags.legacy_heir_of = legacy.heirName;
    // 族譜：你這一世被看作繼承人血脈；父母與本人同承先祖姓
    if (c.gender === 'male') c.family.fatherName = legacy.ancestorName;
    else c.family.motherName = legacy.ancestorName;
    alignClanSurnames(state);
    if (state.npcs.parent_father && c.family.fatherName) {
      state.npcs.parent_father.name = c.family.fatherName;
    }
    if (state.npcs.parent_mother && c.family.motherName) {
      state.npcs.parent_mother.name = c.family.motherName;
    }
    lines.push(`血脈未斷：前世立「${legacy.heirName}」為嗣，你承其家門。`);
  } else {
    // 無嗣：族中旁支承祧，同姓、家族成果照傳
    alignClanSurnames(state);
    c.flags.legacy_collateral = true;
    lines.push(`前世「${legacy.ancestorName}」無嗣，族中旁支由你「${c.name}」承祧，家族成果一樣傳落嚟。`);
  }
  if (legacy.childrenNames?.length) {
    c.flags.legacy_siblings_echo = legacy.childrenNames.join('、');
    lines.push(`族譜殘頁上還有前世子女之名：${legacy.childrenNames.join('、')}。`);
  }

  const coin = Math.max(0, Math.floor(legacy.inheritedMoney ?? 0));
  if (coin > 0) {
    c.money += coin;
    c.stats.wealthPeak = Math.max(c.stats.wealthPeak, c.money);
    lines.push(`家族銀庫：前人積蓄 ${coin.toLocaleString('zh-Hant')} 兩全數承接。`);
  }

  const gear = (legacy.inheritedGear ?? []).filter((id) => getGearDef(id));
  if (gear.length) {
    c.gear = [...new Set([...(c.gear ?? []), ...gear])];
    const eq = legacy.inheritedEquipment;
    if (eq) {
      for (const slot of ['weapon', 'armor', 'accessory'] as const) {
        const id = eq[slot];
        if (id && getGearDef(id)) c.equipment[slot] = id;
      }
    }
    lines.push(`家族裝備庫：承接 ${gear.length} 件裝備，照前人配搭穿戴。`);
  }

  if (legacy.teacherLegacy) {
    c.flags.born_with_teacher_legacy = true;
    for (const k of wuxiaAttributeKeys) {
      if (k === 'wuXing' || k === 'genGu') {
        c.attributes[k] = Math.min(100, c.attributes[k] + 3);
      }
    }
    for (const id of c.skills) {
      c.skillProgress[id] = (c.skillProgress[id] ?? 0) + 3;
    }
    lines.push('前世傳功餘韻：根骨悟性略增，武學進度有苗頭。');
  }

  if (legacy.birthplace) {
    c.flags.legacy_birthplace = legacy.birthplace;
    c.birthplace = c.birthplace || legacy.birthplace;
    lines.push(`族譜上仍寫着故鄉「${legacy.birthplace}」。`);
  }

  if (legacy.friendNpcId) {
    c.flags.born_with_friend_hint = legacy.friendNpcId;
    lines.push('夢裡有人拱手：「來世若還撞見，記得喊一聲。」');
  }

  if (legacy.rivalHint) {
    c.flags.born_with_rival_hint = legacy.rivalHint;
    lines.push(`枕邊似有舊怨低語——「${legacy.rivalHint}」三字未散。`);
  }

  if (legacy.gearHint && !(legacy.inheritedGear ?? []).length) {
    c.flags.born_with_gear_dream = displayGearName(String(legacy.gearHint));
    lines.push('你夢見一把舊兵刃靠牆，醒來掌心還有涼意。');
  }

  if (legacy.titleHints?.length) {
    c.flags.legacy_title_echo = legacy.titleHints[0];
    lines.push('鎮上老人念叨着前世某個綽號，笑你聽不懂。');
  }

  if (legacy.lifeTheme) {
    c.flags.legacy_theme_echo = legacy.lifeTheme;
    lines.push('族譜夾頁還壓着前世題眼，墨痕未乾。');
  }

  if (
    !legacy.familyLegacy &&
    !legacy.teacherLegacy &&
    !legacy.hadChildren &&
    martialBonus <= 0 &&
    !legacy.friendNpcId &&
    !legacy.rivalHint
  ) {
    lines.push('前世平凡，來世仍是白紙——但年譜裡留著那個名字。');
  }

  return lines;
}
