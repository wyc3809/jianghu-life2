/** 用真實核心入帳裝備並建立隔離測試存檔；演出不得重派獎勵。 */
import fs from 'node:fs';
import { createNewLife } from '../../core/life/gameState';
import { grantGear } from '../../core/life/equipment';
import { emptyAncestry } from '../../core/life/ancestry';
import { GEAR_CATALOG } from '../../data/equipment/catalog';
import { lifeGameStateSchema } from '../../interfaces/lifeEngine';
import { FAMILY_MILESTONES } from '../../data/ancestry/milestones';
import { ACHIEVEMENT_RULES } from '../../core/life/achievements';
const fixtures = ['common','fine','rare','epic','mythic','divine'].map((rarity,grade) => {
  const state = createNewLife({seed:42,name:'驗箱少俠',skipCoach:true});
  state.pending=null;state.tab='home';state.moments=[];
  state.character.flags.newbie_done=true;state.character.flags.coach_done=true;
  state.character.skills=[];state.character.equippedArts=[null,null,null,null,null];state.character.martial=0;
  const gear = GEAR_CATALOG.find(g=>g.rarity===rarity && g.slot==='weapon' && !state.character.gear.includes(g.id))!;
  grantGear(state,gear.id);
  lifeGameStateSchema.parse(state);
  const meta=emptyAncestry();meta.jade={free:600,paidTest:0};
  meta.milestones=FAMILY_MILESTONES.map(m=>m.id);meta.jadeAchv=ACHIEVEMENT_RULES.map(a=>a.id);
  return {grade,gear,state,meta};
});
fs.mkdirSync('.local-online/chest-quality',{recursive:true});
fs.writeFileSync('.local-online/chest-quality/fixtures.json',JSON.stringify(fixtures));
console.log('CHEST_FIXTURES_READY',fixtures.map(f=>[f.grade,f.gear.name]));
