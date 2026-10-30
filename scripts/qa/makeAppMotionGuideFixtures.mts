/** 真試煉核心產生待比較／已收好兩種隔離存檔；沿用人物QA的家藏基底。 */
import {createNewLife} from '../../core/life/gameState';
import {initRng} from '../../core/random';
import {startNewbieTrial} from '../../core/life/goals';
import {playerCombatTurn,resolveCombatDisposition} from '../../core/life/combat';
import {resolveGearCompare} from '../../core/life/equipment';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
initRng(11);const state=createNewLife({seed:11});state.character.name='黃天一';state.pending=null;
const meta=JSON.parse(readFileSync('.local-online/character-redesign/fixtures.json','utf8')).full.meta;
const trial=structuredClone(state);startNewbieTrial(state);
for(let i=0;i<40&&state.pendingCombat?.phase==='player';i++){state.pendingCombat.foe.hp=1;playerCombatTurn(state,'basic_strike');}
resolveCombatDisposition(state,'release');state.pending=null;state.moments=[];
const handoff=structuredClone(state);resolveGearCompare(state,'keep');
const missing=structuredClone(state);missing.character.gear=missing.character.gear.filter(id=>id!=='iron-blade');
mkdirSync('.local-online/app-motion-guide',{recursive:true});
writeFileSync('.local-online/app-motion-guide/fixtures.json',JSON.stringify({trial:{state:trial,meta},equip:{state,meta},handoff:{state:handoff,meta},missing:{state:missing,meta}}));
