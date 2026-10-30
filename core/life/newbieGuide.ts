import type { LifeGameState } from '@interfaces/lifeEngine';
import { getGearDef } from '@data/equipment/catalog';
import { NEWBIE_TRIAL } from '@data/redesign/newbie';
import { newbieActive } from './goals';

/** 引導只讀真實進度；略過不完成任務、不派獎，舊檔與後代不強制重看。 */
export function newbieGuide(state: LifeGameState): { step: 'trial' | 'equip' | 'ready'; title: string; body: string } | null {
  const c = state.character;
  if (!c.alive || state.phase !== 'playing' || !newbieActive(state) || c.flags.coach_done) return null;
  if (!c.flags.newbie_trial_won) return { step: 'trial', title: '初試身手', body: '點「應戰」挑戰武館陪練，獲勝後取得第一件兵器。' };
  const def = getGearDef(NEWBIE_TRIAL.rewardGearId);
  if (!def || !c.gear?.includes(def.id)) return null;
  if (c.equipment.weapon !== def.id) return { step: 'equip', title: '比較後換裝', body: `已取得「${def.name}」。前往人物，點武器欄選擇兵器，比較後再確認換上。` };
  const before = c.flags.newbie_weapon_attack_before;
  const change = typeof before === 'number' ? `兵器攻擊 ${before} → ${def.attack ?? 0}。` : `兵器攻擊 ${def.attack ?? 0}。`;
  return { step: 'ready', title: '整裝完成', body: `${change}返回鎮居觀看交手；修為儲滿後可嘗試突破。` };
}
