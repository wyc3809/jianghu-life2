import { createNewLife } from '@core/life/gameState';
import { createRng, withRng } from '@core/random';
import { normalPreset } from '@core/life/loadoutPresets';
import type { SectBattleEntrant, SectBattleSide } from '@interfaces/sectBattle';
import { appearanceForIndex } from '@data/appearances';

const NAMES = ['沈雲舟','陸青衫','顧長風','蘇暮雨','柳清河','秦若霜','江照月','葉知秋','程遠山','林晚棠',
  '謝清霜','宋懷瑾','蕭寒江','唐映雪','莫問舟','方照影','白聽瀾','燕歸塵','許靜川','賀疏桐'];
export const SECT_PREVIEW_ARTS = ['qy_cloud_sword','wd_sword_form','art_river_fist','art_stone_palm','art_thunder_blade','art_spear_cloud','art_staff_iron','tm_flying_needle'] as const;

/** 二十名隔離示範角色；建立人物亦暫借獨立RNG，絕不讀寫玩家存檔。 */
export function sectBattleFixture(): SectBattleEntrant[] {
  return withRng(createRng(5701), () => Array.from({ length: 20 }, (_, index) => {
    const side = (index < 10 ? 0 : 1) as SectBattleSide, rank = index % 10 + 1;
    const state = createNewLife({ seed: 5701 + index, name: NAMES[index], skipCoach: true });
    state.pending = null;
    const c = state.character, art = SECT_PREVIEW_ARTS[(rank - 1 + side) % SECT_PREVIEW_ARTS.length];
    c.appearance=appearanceForIndex(index);
    c.sectId = side === 0 ? 'sect_qingyun' : 'sect_wudang';
    c.skills = [art, 'art_iron_body', 'qg_broken_bridge'];
    c.equippedArts = [art, null, null, null, null];
    c.supportArts = { internal: 'art_iron_body', qinggong: 'qg_broken_bridge' };
    c.mainArts = { external: art, internal: 'art_iron_body', qinggong: 'qg_broken_bridge' };
    c.volumes = { [art]: [1, 3, 7] }; c.skillRanks = Object.fromEntries(c.skills.map(id => [id, 2]));
    c.martial = 105 + (11 - rank) * 3; c.health = c.maxHealth = 1800 + (11 - rank) * 20;
    c.qi = c.maxQi = 210; c.flags.caps_include_internal = true;
    c.combatLoadout = normalPreset(c);
    return { id: `sect-demo-${index + 1}`, side, rank, state };
  }));
}
