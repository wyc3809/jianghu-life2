/** 第61項：真核心建立全功能驗收狀態，隔離玩家資料及雲端。 */
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { startCombat } from '../../core/life/combat';
import { foundSect, recruitDisciple } from '../../core/life/foundedSect';
const full = JSON.parse(readFileSync('production/qa/evidence/redesign/character-bind-rollout/fixture.json', 'utf8'));
full.state.character.money = 3000;
const poor = structuredClone(full); poor.state.character.money = 0;
const founder = structuredClone(full);
Object.assign(founder.state.character, { martial:300, reputation:100, money:1000, sectId:null });
foundSect(founder.state, '青山門'); recruitDisciple(founder.state); founder.state.moments=[];
const battle = structuredClone(full);
startCombat(battle.state,{ source:'spar', title:'武館試招', foeName:'武館陪練', foePower:'normal', rewardOnWin:{money:5},rewardOnLose:{} });
const danger=structuredClone(full);
startCombat(danger.state,{source:'event',title:'生死之約',foeName:'蒙面刀客',foePower:'strong',lifeOrDeath:true,rewardOnWin:{},rewardOnLose:{}});
mkdirSync('.local-online/unify-game',{recursive:true});
writeFileSync('.local-online/unify-game/fixtures.json',JSON.stringify({full,poor,founder,battle,danger}));
console.log('GAME_UNIFICATION_FIXTURES_READY');
