import { DAILY_TRAINING_ACTIONS } from '@data/redesign/martialEconomyParams';
import type { LifeGameState } from '@interfaces/lifeEngine';
import { getRng } from '@core/random';
import { getGearDef, rollForgeResult, type GearRarity } from '@data/equipment/catalog';
import { TEST_SILVER_SINKS } from '@data/redesign/testParams';
import { artForStanding, FAMILY_RULES, MAX_SECT_STANDING, getSectContent } from '@data/content/packs';
import { addCondition } from './monthly';
import { addInjury, healInjuries } from './injuries';
import { HEAL_MONTHS } from '@data/injuries/tuning';
import { grantGear, raiseBaseMaxHp, raiseBaseMaxQi, equipGear, ensureGear } from './equipment';
import { snapshotRng, syncRngFromState, SECT_DEFS } from './gameState';
import { pushChronicle } from './chronicle';
import {
  applyLearnMartialArt,
  tryAdvanceRandomSkill,
  tryAdvanceSkill,
} from './flavor';
import { startCombat } from './combat';
import { getSkillDef } from '@data/skills/catalog';
import { teachSectArtForStanding, tryGainSectStanding } from './sectStanding';
import { defaultNature, meetsNatureGate, natureGateHint } from './nature';
import { ensureMasterBond } from './bonds';
import { rollRandomFragment } from './manualFragments';
import { designateHeir, listChildNames, seekChild } from './family';
import { ART_DEFS, applyStudyArt, meetsTaohuaCultureGate, TAOHUA_CULTURE_THRESHOLD } from './arts';

export type PracticeActionId =
  | 'train_martial'
  | 'train_internal'
  | 'temper_body'
  | 'forge'
  | 'seek_master'
  | 'drink_wine'
  | 'study_art'
  | 'heal'
  | 'heal_full'
  | 'forge_fine'
  | 'sect_donate'
  | 'equip_best'
  | 'join_sect'
  | 'sect_duty'
  | 'sect_ask_elder'
  | 'sect_spar'
  | 'sect_guard'
  | 'sect_meditate'
  | 'sect_namecard'
  | 'sect_politics'
  | 'sect_leave'
  | 'seek_child'
  | 'designate_heir';

export type WanderPracticeActionId =
  | 'train_martial'
  | 'train_internal'
  | 'temper_body'
  | 'forge'
  | 'seek_master';

export interface PracticeAction {
  id: PracticeActionId;
  label: string;
  hint: string;
}

/** 修煉頁主選單：苦練／打坐／淬體是不入門派也能主動練功嘅途徑，武學階位靠用（戰鬥）同練（呢三項）累積 */
export const PRACTICE_ACTIONS: PracticeAction[] = [
  { id: 'train_martial', label: '苦練外功', hint: '武學＋1~3，磨礪已學外功招式' },
  { id: 'train_internal', label: '打坐運功', hint: '內力上限提升，溫養內功心法' },
  { id: 'temper_body', label: '淬體強身', hint: '氣血上限提升' },
  // 「打聽傳聞」（風聲加成）已按玩家要求刪除（2026-10-09）
  { id: 'drink_wine', label: '把酒買醉', hint: '傷氣血；飲得夠多，另有奇遇' },
  { id: 'seek_child', label: '求子添丁', hint: '有眷屬可祈嗣；費銀二十兩' },
  { id: 'designate_heir', label: '立嗣傳家', hint: '有子女時指定繼承人，死後族產可繼' },
  { id: 'heal', label: '醫館調養', hint: '費銀十五兩，療傷減疲' },
  { id: 'heal_full', label: '名醫療傷', hint: '費銀為氣血上限一成，氣血回滿' },
  { id: 'forge_fine', label: '精工鑄器', hint: '費銀隨境界升，境界越高越易出好兵器' },
  { id: 'equip_best', label: '整裝披掛', hint: '按庫中器物自行披掛妥當' },
];

/** 已入門派後的門內事務 */
export const SECT_INNER_ACTIONS: PracticeAction[] = [
  { id: 'sect_duty', label: '門派差事', hint: '跑腿護院，積些人情' },
  { id: 'sect_ask_elder', label: '請教長老', hint: '點撥一二，或悟舊招' },
  { id: 'sect_spar', label: '師門比武', hint: '實戰淬鍊，進階可期' },
  { id: 'sect_guard', label: '守護山門', hint: '夜巡風雨，磨礪心膽' },
  { id: 'sect_meditate', label: '靜室修煉', hint: '門中心法，閉目調息' },
  { id: 'sect_namecard', label: '名帖往來', hint: '接待外派，交好或交惡' },
  { id: 'sect_politics', label: '山門站隊', hint: '門中風波，選邊或調解' },
  { id: 'sect_donate', label: '捐獻山門', hint: '費銀隨地位升，必得晉升；每月一次' },
];

export { SECT_DEFS, ART_DEFS };

/** 醫館大療傷費用（TEST_SILVER_SINKS.fullHealPerMaxHp） */
export function fullHealCost(c: LifeGameState['character']): number {
  return Math.max(15, Math.round(c.maxHealth * TEST_SILVER_SINKS.fullHealPerMaxHp));
}

/** 精工鑄器費用：基數 × (境界＋1) */
export function fineForgeCost(state: LifeGameState): number {
  return TEST_SILVER_SINKS.fineForgeBase * ((state.character.cultivation?.tier ?? 0) + 1);
}

/** 捐獻山門費用：基數 × (地位＋1) */
export function sectDonateCost(c: LifeGameState['character']): number {
  return TEST_SILVER_SINKS.sectDonateBase * ((c.sectStanding ?? 0) + 1);
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

const RARITY_RANK: Record<GearRarity, number> = {
  common: 1,
  fine: 2,
  rare: 3,
  epic: 4,
  mythic: 5,
  divine: 6,
};

/** 執行一項修煉／機緣結果（不扣本月修煉次數；不寫年譜） */
export function applyPracticeOutcome(
  state: LifeGameState,
  actionId: PracticeActionId,
  opts?: { sectId?: string; artId?: string },
): string[] {
  syncRngFromState(state);
  const rng = getRng();
  const c = state.character;
  ensureGear(c);
  if (!c.skillRanks) c.skillRanks = {};
  const logs: string[] = [];

  switch (actionId) {
    case 'train_martial': {
      const gain = rng.nextInt(1, 3);
      c.health = clamp(c.health - rng.nextInt(0, 6), 1, c.maxHealth);
      c.actionPoints = clamp(c.actionPoints - rng.nextInt(4, 10), 0, 100);
      c.martial += gain;
      logs.push('你苦練外功，拳腳往復，汗透衣背。');
      logs.push(`武學＋${gain}`);
      const externals = c.skills.filter((id) => getSkillDef(id)?.kind === 'external');
      const pool = externals.length ? externals : c.skills;
      if (pool.length) {
        const adv = tryAdvanceSkill(state, rng.pick(pool), 'practice');
        if (adv) logs.push(adv);
        else logs.push('外功招式仍有滯澀，尚未突破階位。');
      }
      if (rng.chance(0.12)) {
        logs.push('走岔半招，皮肉受苦。');
        logs.push(addInjury(state, 'light', '練功走岔', rng.chance(0.5) ? 'arm' : 'leg'));
      }
      break;
    }
    case 'train_internal': {
      const qiGain = rng.nextInt(8, 18);
      const cap = rng.nextInt(3, 8);
      raiseBaseMaxQi(c, cap);
      c.qi = clamp(c.qi + qiGain, 0, c.maxQi);
      logs.push('你打坐運功，調息入定，真氣在經脈裡緩緩周轉。');
      logs.push(`內息＋${qiGain}`);
      logs.push(`內力上限＋${cap}`);
      const internals = c.skills.filter((id) => getSkillDef(id)?.kind === 'internal');
      const breath = internals[0] ?? c.skills.find((s) => /breath|吐納/i.test(s));
      if (breath) {
        const adv = tryAdvanceSkill(state, breath, 'practice');
        if (adv) logs.push(adv);
      }
      if (rng.chance(0.08)) {
        logs.push('氣息逆行，險些走火。');
        addCondition(state, 'internal');
      }
      break;
    }
    case 'temper_body': {
      const up = rng.nextInt(8, 20);
      raiseBaseMaxHp(c, up);
      c.actionPoints = clamp(c.actionPoints - rng.nextInt(6, 14), 0, 100);
      logs.push('你以藥浴與樁功淬體，筋骨隱隱發沉，像是又厚了一層。');
      logs.push(`氣血上限＋${up}`);
      break;
    }
    case 'join_sect': {
      if (c.sectId) {
        logs.push(`你已是${state.sects[c.sectId]?.name ?? '門派'}中人。`);
        break;
      }
      const target = opts?.sectId;
      if (!target || !state.sects[target]) {
        logs.push('你尚未選定要拜的門派。');
        break;
      }
      if (c.martial < 12 && overallWeak(c)) {
        logs.push(`${state.sects[target].name}看你根基尚淺，暫未收錄。`);
        break;
      }
      const sectDef = getSectContent(target);
      if (sectDef?.natureGate && !meetsNatureGate(c, sectDef.natureGate)) {
        const hint = natureGateHint(sectDef.natureGate);
        logs.push(
          `${state.sects[target].name}看你心性不合門規，婉拒收錄。${hint ? `（${hint}）` : ''}`,
        );
        break;
      }
      if (target === 'sect_taohua' && !meetsTaohuaCultureGate(state)) {
        logs.push(
          `島主只淡淡道：「琴棋書畫尚未通透，且回去再修。」（需琴棋詩書畫熟練度總和達 ${TAOHUA_CULTURE_THRESHOLD}）`,
        );
        break;
      }
      if (target === 'sect_wugen' && !c.flags.wugenInvited) {
        logs.push('你尋不著無根門的門徑——世間傳聞雖多，未逢奇緣者終究無法叩門。');
        break;
      }
      if (rng.chance(0.22)) {
        logs.push(`${state.sects[target].name}此番未允，只道「機緣未到」。`);
        break;
      }
      c.sectId = target;
      c.sectStanding = 0;
      c.flags.joined_sect = true;
      logs.push(`你拜入${state.sects[target].name}，成為記名弟子。`);
      if (target === 'sect_wugen') {
        c.flags.wugenSevered = true;
        if (c.gender === 'male') {
          c.flags.isEunuch = true;
          logs.push('入門之日，你揮刀自宮，斷絕塵根——從此再無兒女私情，換得一身陰柔奇功。');
        } else {
          logs.push('入門之日，你對天立誓，斷情絕愛，此生不涉兒女私情——換得一身陰柔奇功。');
        }
      }
      ensureMasterBond(state, `${state.sects[target].name}執法長老`);
      logs.push(`你對執法長老執弟子禮，師徒之名已定。`);
      const artId = artForStanding(target, 0);
      if (artId) {
        const learned = applyLearnMartialArt(state, artId);
        logs.push(learned.story);
        if (learned.delta) logs.push(learned.delta);
        logs.push(...learned.achievements);
      }
      break;
    }
    case 'sect_duty': {
      if (!c.sectId) {
        logs.push('你尚未拜入門派。');
        break;
      }
      const meritPay = rng.nextInt(8, 20);
      c.money += meritPay;
      c.reputation += 1;
      c.martial += 1;
      logs.push(`你完成${state.sects[c.sectId].name}差事，得銀 ${meritPay} 兩。`);
      const stand = tryGainSectStanding(state, 0.28);
      if (stand) logs.push(stand);
      break;
    }
    case 'sect_ask_elder': {
      if (!c.sectId) {
        logs.push('你尚未拜入門派。');
        break;
      }
      c.actionPoints = clamp(c.actionPoints - 3, 0, 100);
      logs.push('長老只點了三處破綻，餘下要你自己悟。');
      const standing = c.sectStanding ?? 0;
      const teach = teachSectArtForStanding(state, standing);
      if (teach) logs.push(teach);
      const adv = tryAdvanceRandomSkill(state, 'practice');
      if (adv) logs.push(adv);
      else if (!teach) logs.push('你似懂非懂，回去還得再練。');
      const stand = tryGainSectStanding(state, 0.22);
      if (stand) logs.push(stand);
      break;
    }
    case 'sect_spar': {
      if (!c.sectId) {
        logs.push('你尚未拜入門派。');
        break;
      }
      const foeName = `${state.sects[c.sectId].name}師兄`;
      logs.push(
        ...startCombat(state, {
          source: 'spar',
          title: '師門比武',
          foeName,
          foePower: 'normal',
          rewardOnWin: { reputation: 2, martial: 2 },
          rewardOnLose: { reputation: -1 },
        }),
      );
      break;
    }
    case 'sect_guard': {
      if (!c.sectId) {
        logs.push('你尚未拜入門派。');
        break;
      }
      c.actionPoints = clamp(c.actionPoints - rng.nextInt(4, 10), 0, 100);
      c.attributes.danShi = clamp(c.attributes.danShi + (rng.chance(0.4) ? 1 : 0), 1, 100);
      logs.push('你守了一夜山門，風聲鶴唳中心膽更定。');
      if (rng.chance(0.15)) {
        logs.push('遇著探子，你與師兄合力驅離。');
        const adv = tryAdvanceRandomSkill(state, 'combat');
        if (adv) logs.push(adv);
      }
      const stand = tryGainSectStanding(state, 0.2);
      if (stand) logs.push(stand);
      break;
    }
    case 'sect_meditate': {
      if (!c.sectId) {
        logs.push('你尚未拜入門派。');
        break;
      }
      raiseBaseMaxQi(c, rng.nextInt(2, 6));
      c.qi = clamp(c.qi + rng.nextInt(10, 22), 0, c.maxQi);
      logs.push('靜室之中，你按門中心法緩緩吐納。');
      const sectArts = c.skills.filter((s) => getSkillDef(s)?.sectId === c.sectId);
      const focus =
        sectArts[0] ??
        c.skills.find(
          (s) =>
            s.startsWith('sect_art_') ||
            s.startsWith('qy_') ||
            s.startsWith('td_') ||
            s.startsWith('em_') ||
            s.startsWith('sl_') ||
            s.startsWith('wd_'),
        );
      if (focus) {
        const adv = tryAdvanceSkill(state, focus, 'practice');
        if (adv) logs.push(adv);
      } else {
        const adv = tryAdvanceRandomSkill(state, 'practice');
        if (adv) logs.push(adv);
      }
      const stand = tryGainSectStanding(state, 0.18);
      if (stand) logs.push(stand);
      break;
    }
    case 'sect_namecard': {
      if (!c.sectId) {
        logs.push('你尚未拜入門派。');
        break;
      }
      c.money = Math.max(0, c.money - 3);
      c.reputation += 1;
      logs.push('你持帖接待外派使者，茶過三巡，山門人情略增。');
      const stand = tryGainSectStanding(state, 0.24);
      if (stand) logs.push(stand);
      if (rng.chance(0.2)) {
        c.flags.master_bond = Math.min(100, (Number(c.flags.master_bond ?? 0) || 0) + 4);
        logs.push('長老見你做事得體，多看了你一眼。');
      }
      break;
    }
    case 'sect_politics': {
      if (!c.sectId) {
        logs.push('你尚未拜入門派。');
        break;
      }
      if (rng.chance(0.45)) {
        c.reputation += 2;
        c.flags.sect_politics_elder = true;
        logs.push('你站定長老一邊，門中風波暫歇，人情偏向你。');
        const stand = tryGainSectStanding(state, 0.35);
        if (stand) logs.push(stand);
      } else if (rng.chance(0.5)) {
        c.flags.sect_rival_anger = true;
        c.money += 6;
        logs.push('你暗中使了手腳。對手跌了面子，盯梢卻也多了。');
      } else {
        c.reputation += 1;
        logs.push('你兩頭勸和，風波未起，卻也無功無過。');
      }
      break;
    }
    case 'sect_leave': {
      if (!c.sectId) {
        logs.push('你本就不屬任何門派。');
        break;
      }
      const name = state.sects[c.sectId]?.name ?? '門派';
      c.sectId = null;
      c.sectStanding = 0;
      c.reputation = Math.max(0, c.reputation - 3);
      c.flags.master_severed = true;
      logs.push(`你辭別${name}，从此山門內外，兩不相干。`);
      break;
    }
    case 'forge': {
      if (c.money < 40) {
        logs.push('鐵匠看了看你的錢袋，搖頭不肯開工。');
        break;
      }
      c.money -= 40;
      // 鍛造失敗率：爐火難馴，但不宜高到令人放棄
      if (rng.chance(0.32)) {
        logs.push('爐火失控，兵器毀於一旦，還燙傷了手。');
        addCondition(state, 'bleeding');
        if (rng.chance(0.4)) {
          logs.push(...rollRandomFragment(state));
          logs.push('灰燼裡卻撿得半卷殘譜。');
        }
        break;
      }
      const gearId = rollForgeResult(rng, { martial: c.martial });
      const name = grantGear(state, gearId);
      logs.push(`爐火純青，你煉成「${name}」。`);
      if (gearId.startsWith('divine')) logs.push('天地異象一瞬——竟是神兵！');
      if (rng.chance(0.12)) logs.push(...rollRandomFragment(state));
      break;
    }
    case 'seek_master': {
      c.actionPoints = clamp(c.actionPoints - 5, 0, 100);
      if (rng.chance(0.22)) {
        const arts = [
          { id: 'art_nine_shadow', name: '九影迷踪步' },
          { id: 'art_cold_palm', name: '寒霜掌' },
          { id: 'art_iron_body', name: '鐵布衫' },
          { id: 'art_moon_sword', name: '弄月劍法' },
          { id: 'art_void_breath', name: '空冥吐納' },
          { id: 'art_wind_chase', name: '追風腿' },
          { id: 'art_tiger_breath', name: '虎嘯內勁' },
          { id: 'art_spring_well', name: '涌泉訣' },
          { id: 'qg_snow_track', name: '踏雪無痕' },
          { id: 'qg_swallow_turn', name: '燕子三轉' },
          { id: 'qg_feiyan', name: '飛燕功' },
          { id: 'qg_reed_drift', name: '蘆花身法' },
          { id: 'qg_lotus_steps', name: '踏蓮步' },
          { id: 'art_spear_cloud', name: '穿雲槍' },
          { id: 'art_staff_iron', name: '鐵杖訣' },
          { id: 'art_whip_silk', name: '柔絲鞭法' },
          { id: 'art_bow_star', name: '逐星箭意' },
          { id: 'art_sand_palm', name: '流沙掌' },
          { id: 'art_mirror_breath', name: '澄心鏡息' },
          { id: 'art_heavy_halberd', name: '開山戟意' },
        ];
        const art = rng.pick(arts);
        const masterNames = ['白眉叟', '青衫客', '赤練娘', '啞僕高人', '雲遊道人'];
        ensureMasterBond(state, rng.pick(masterNames));
        logs.push(`你拜入「${c.flags.master_name}」門下，執弟子禮。`);
        if (!c.skills.includes(art.id)) {
          const learned = applyLearnMartialArt(state, art.id, art.name);
          logs.push(learned.story);
          if (learned.delta) logs.push(learned.delta);
          logs.push(...learned.achievements);
          raiseBaseMaxQi(c, rng.nextInt(10, 25));
        } else {
          const adv = tryAdvanceSkill(state, art.id, 'practice');
          logs.push(adv ?? '高人只點破你舊招中的滯澀。');
        }
      } else if (rng.chance(0.18)) {
        logs.push('尋訪無果，山道上卻撞見剪徑之徒——只好交手。');
        logs.push(
          ...startCombat(state, {
            source: 'bandit',
            title: '山道劫匪',
            foeName: '剪徑之徒',
            foePower: 'weak',
            rewardOnWin: { money: 12, martial: 1 },
            rewardOnLose: { money: -10 },
          }),
        );
      } else {
        logs.push('雲深不知處，你空手而歸，只多了幾分眼界。');
        c.attributes.wuXing = clamp(c.attributes.wuXing + 1, 1, 100);
      }
      break;
    }
    case 'drink_wine': {
      const cost = rng.nextInt(3, 9);
      c.health = clamp(c.health - cost, 1, c.maxHealth);
      const count = Math.max(0, Number(c.flags.wineDrunkCount ?? 0)) + 1;
      c.flags.wineDrunkCount = count;
      logs.push(
        rng.pick([
          '你連盡數碗，酒氣上頭，氣血隨之一沉。',
          '一壺濁酒下肚，步履微晃，倒也快活。',
          '獨酌半宿，醉眼看江湖，別有一番滋味。',
        ]),
      );
      logs.push(`氣血－${cost}（今生共飲 ${count} 回）`);
      if (count >= 20 && !c.skills.includes('art_drunken_fist')) {
        const learned = applyLearnMartialArt(state, 'art_drunken_fist');
        logs.push('醉裡拳腳自成章法，你悟出一路「醉八仙拳」！');
        logs.push(learned.story);
        if (learned.delta) logs.push(learned.delta);
        logs.push(...learned.achievements);
      }
      break;
    }
    case 'study_art': {
      logs.push(...applyStudyArt(state, opts?.artId ?? ''));
      break;
    }
    case 'heal': {
      if (c.money < 15) {
        logs.push('藥金不足，醫者只給你一碗清茶。');
        break;
      }
      c.money -= 15;
      c.health = clamp(c.health + rng.nextInt(20, 40), 0, c.maxHealth);
      if (c.conditions.length) {
        c.conditions = c.conditions
          .map((x) => ({ ...x, monthsLeft: x.monthsLeft - 2 }))
          .filter((x) => x.monthsLeft > 0);
      }
      const treated = healInjuries(state, HEAL_MONTHS);
      logs.push('醫館調養後，氣色好了許多。');
      if (treated) logs.push('大夫正骨敷藥，身上傷勢好轉。');
      if (c.injuries?.some((x) => x.tier === 'crippled')) logs.push('大夫搖頭：殘疾之處，非尋常藥石可醫。');
      break;
    }
    case 'heal_full': {
      const cost = fullHealCost(c);
      if (c.money < cost) {
        logs.push(`大療傷要${cost}兩，你錢袋不夠。`);
        break;
      }
      c.money -= cost;
      c.health = c.maxHealth;
      const treated = healInjuries(state, HEAL_MONTHS);
      logs.push(`你付了${cost}兩，名醫施針一夜，氣血盡復。`);
      if (treated) logs.push('大夫正骨敷藥，身上傷勢好轉。');
      break;
    }
    case 'forge_fine': {
      const cost = fineForgeCost(state);
      if (c.money < cost) {
        logs.push(`名匠開價${cost}兩，你錢袋不夠。`);
        break;
      }
      c.money -= cost;
      const quality = Math.min(1, Math.max(0, (c.cultivation?.tier ?? 0) / 14));
      const gearId = rollForgeResult(rng, { martial: c.martial, quality });
      const name = grantGear(state, gearId);
      logs.push(`你付了${cost}兩，名匠依你境界開爐，煉成「${name}」。`);
      if (gearId.startsWith('divine')) logs.push('天地異象一瞬——竟是神兵！');
      break;
    }
    case 'sect_donate': {
      if (!c.sectId) {
        logs.push('你尚未拜入門派。');
        break;
      }
      const month = c.stats.monthsLived;
      if (Number(c.flags.sect_donate_month ?? -1) === month) {
        logs.push('本月已捐過，山門不收重禮。');
        break;
      }
      const cost = sectDonateCost(c);
      if (c.money < cost) {
        logs.push(`捐獻要${cost}兩，你錢袋不夠。`);
        break;
      }
      const stand = tryGainSectStanding(state, 100);
      if (!stand) {
        logs.push('你在門中已位極人臣，捐獻只換得一聲多謝。');
        break;
      }
      c.money -= cost;
      c.flags.sect_donate_month = month;
      logs.push(`你捐出${cost}兩修繕山門。`, stand);
      break;
    }
    case 'seek_child': {
      if (c.flags.wugenSevered) {
        logs.push('你早已斷絕塵根，此念作罷。');
        break;
      }
      logs.push(...seekChild(state));
      break;
    }
    case 'designate_heir': {
      const kids = listChildNames(state);
      if (!kids.length) {
        logs.push('尚無子女，無從立嗣。可先求子添丁。');
        break;
      }
      const current = String(c.flags.heir_name ?? kids[0]);
      // 輪換指定：下一個子女／或第一個
      const idx = Math.max(0, kids.indexOf(current));
      const next = kids[(idx + 1) % kids.length]!;
      logs.push(...designateHeir(state, next));
      break;
    }
    case 'equip_best': {
      for (const slot of ['weapon', 'armor', 'accessory'] as const) {
        const best = c.gear
          .map((id) => getGearDef(id))
          .filter((d) => d && d.slot === slot)
          .sort((a, b) => (RARITY_RANK[b!.rarity] ?? 0) - (RARITY_RANK[a!.rarity] ?? 0))[0];
        if (best) logs.push(equipGear(state, best.id));
      }
      if (!logs.length) logs.push('無可換之裝。');
      break;
    }
    default:
      logs.push('無事可做。');
  }

  return logs;
}

/** 確定不合資格的操作先攔截，不扣次數、不推進RNG；合法隨機嘗試照常結算。 */
export function practiceBlockReason(state: LifeGameState, actionId: PracticeActionId, opts?: {sectId?:string;artId?:string}): string | null {
  const c=state.character;
  if (!c.alive || state.phase !== 'playing') return '你已無法行動。';
  if (state.pending) return '眼前尚有未決之事，先作抉擇。';
  if (state.pendingCombat) return '交手未了，豈能分心。';
  if ((state.practiceActionsLeft ?? 0) <= 0) return '本月修煉次數已盡，且回鎮居翻過一頁再來。';
  const cost = actionId === 'heal' ? 15 : actionId === 'heal_full' ? fullHealCost(c) : actionId === 'forge_fine' ? fineForgeCost(state) : actionId === 'forge' ? 40 : actionId === 'seek_child' ? 20 : 0;
  if (cost && c.money < cost) return `此項需銀${cost}兩，尚欠${cost-c.money}兩。`;
  if (actionId.startsWith('sect_') && (!c.sectId || (actionId !== 'sect_leave' && !state.sects[c.sectId]))) return '你尚未拜入有效門派。';
  if (actionId === 'sect_donate') {
    if (Number(c.flags.sect_donate_month ?? -1) === c.stats.monthsLived) return '本月已捐過，山門不收重禮。';
    if ((c.sectStanding ?? 0) >= MAX_SECT_STANDING) return '你在門中已位極人臣，無須再捐。';
    const fee=sectDonateCost(c);if(c.money<fee)return `捐獻要${fee}兩，尚欠${fee-c.money}兩。`;
  }
  if (actionId === 'study_art' && !ART_DEFS.some(a=>a.id===opts?.artId)) return '你尚未選定要修習的雅藝。';
  if (actionId === 'designate_heir' && !(c.family.childrenNames?.length)) return '尚無子女，無從立嗣。可先求子添丁。';
  if (actionId === 'seek_child') {
    if(c.flags.wugenSevered)return '你早已斷絕塵根，此念作罷。';
    if(FAMILY_RULES.requireLover&&!c.loverId)return '尚未有眷屬，難以添丁。';
    if(c.childrenMax!==undefined&&c.childrenCount>=c.childrenMax)return '此生子女已滿，不宜再添。';
    if((c.monthsSinceLastBirth??99)<FAMILY_RULES.cooldownMonths)return `生產未歇，尚需約 ${FAMILY_RULES.cooldownMonths-(c.monthsSinceLastBirth??0)} 月再議。`;
  }
  if (actionId === 'join_sect') {
    if(c.sectId)return `你已是${state.sects[c.sectId]?.name??'門派'}中人。`;
    const id=opts?.sectId;if(!id||!state.sects[id])return '你尚未選定要拜的門派。';
    if(c.martial<12&&overallWeak(c))return `${state.sects[id].name}看你根基尚淺，暫未收錄。`;
    const gate=getSectContent(id)?.natureGate;
    if(gate&&!meetsNatureGate({...c,nature:{...defaultNature(),...c.nature}},gate))return `${state.sects[id].name}看你心性不合門規，婉拒收錄。（${natureGateHint(gate)}）`;
    if(id==='sect_taohua'&&!meetsTaohuaCultureGate(state))return `琴棋書畫尚未通透，需熟練度總和達 ${TAOHUA_CULTURE_THRESHOLD}。`;
    if(id==='sect_wugen'&&!c.flags.wugenInvited)return '你尋不著無根門的門徑，未逢奇緣者無法叩門。';
  }
  return null;
}

export function performPracticeAction(
  state: LifeGameState,
  actionId: PracticeActionId,
  opts?: { sectId?: string; artId?: string },
): string[] {
  const blocked=practiceBlockReason(state,actionId,opts);
  if(blocked)return [blocked];

  state.practiceActionsLeft = Math.max(0, (state.practiceActionsLeft ?? 3) - 1);
  const progress = () => { const c=state.character;return JSON.stringify([c.actionPoints,c.martial,c.qi,c.maxQi,c.maxHealth,c.attributes,c.skills,c.skillProgress,c.skillRanks]); };
  const before=progress();
  const logs = applyPracticeOutcome(state, actionId, opts);
  if (DAILY_TRAINING_ACTIONS.includes(actionId) && before!==progress()) state.character.flags.practice_actions = Number(state.character.flags.practice_actions ?? 0)+1;
  logs.push(`本月尚餘修煉 ${state.practiceActionsLeft} 次。`);
  pushChronicle(state, logs);
  snapshotRng(state);
  return logs;
}

function overallWeak(c: LifeGameState['character']): boolean {
  const ranks = Object.values(c.skillRanks ?? {});
  const best = ranks.length ? Math.max(...ranks) : 0;
  return best < 1 && c.martial < 12;
}
