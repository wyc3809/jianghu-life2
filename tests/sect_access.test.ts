import { describe,it,expect } from 'vitest';
import { createNewLife,migrateLifeState,SECT_DEFS } from '../core/life/gameState';
import { performPracticeAction,practiceBlockReason } from '../core/life/actions';
import { SECT_CONTENT,artForStanding } from '../data/content/packs';
import { SECT_UNIFORM_GROUPS } from '../data/wardrobe';
import { lifeGameStateSchema } from '../interfaces/lifeEngine';
import { initRng,getRngState } from '../core/random';

function eligibleLife(){
  const state=createNewLife({seed:107,skipCoach:true});state.pending=null;state.pendingCombat=null;
  const c=state.character;c.sectId=null;c.martial=60;c.nature={xia:30,xie:30,e:30,kuang:30};
  c.flags.wugenInvited=true;c.flags.art_guqin=60;
  return state;
}
describe('十派入口與原入派條件',()=>{
  it('test_sect_access_十派名錄及舊檔_拜師入口與制服一一對應',()=>{
    const expected=SECT_CONTENT.map(s=>s.id);
    expect(SECT_DEFS.map(s=>s.id)).toEqual(expected);
    expect(SECT_UNIFORM_GROUPS.map(s=>s.id)).toEqual(expected);
    const old=eligibleLife();delete old.sects.sect_wugen;delete old.sects.sect_taohua;
    const loaded=migrateLifeState(lifeGameStateSchema.parse(JSON.parse(JSON.stringify(old))));
    expect(Object.keys(loaded.sects)).toEqual(expect.arrayContaining(expected));
  });
  it.each(SECT_CONTENT)('test_sect_access_$name_達原條件可入派並獲本派入門武學',sect=>{
    const state=eligibleLife();initRng(107);
    expect(practiceBlockReason(state,'join_sect',{sectId:sect.id})).toBeNull();
    for(let attempt=0;attempt<12&&!state.character.sectId;attempt++){
      state.practiceActionsLeft=3;performPracticeAction(state,'join_sect',{sectId:sect.id});
    }
    expect(state.character.sectId).toBe(sect.id);
    expect(state.character.sectStanding).toBe(0);
    expect(state.character.skills).toContain(artForStanding(sect.id,0));
  });
  it('test_sect_access_未達原條件_根基心性雅藝奇緣仍會阻擋且不扣次數或RNG',()=>{
    const cases=[
      {id:'sect_qingyun',setup:(s:ReturnType<typeof eligibleLife>)=>{s.character.martial=0;s.character.skillRanks={};},copy:'根基'},
      {id:'sect_shaolin',setup:(s:ReturnType<typeof eligibleLife>)=>{s.character.nature.e=90;},copy:'心性'},
      {id:'sect_taohua',setup:(s:ReturnType<typeof eligibleLife>)=>{s.character.flags.art_guqin=0;},copy:'琴棋'},
      {id:'sect_wugen',setup:(s:ReturnType<typeof eligibleLife>)=>{s.character.flags.wugenInvited=false;},copy:'奇緣'},
    ];
    for(const row of cases){
      const state=eligibleLife();row.setup(state);const before=structuredClone(state);initRng(107);const rng=getRngState();
      expect(practiceBlockReason(state,'join_sect',{sectId:row.id})).toContain(row.copy);
      performPracticeAction(state,'join_sect',{sectId:row.id});expect(state).toEqual(before);expect(getRngState()).toBe(rng);
    }
  });
});
