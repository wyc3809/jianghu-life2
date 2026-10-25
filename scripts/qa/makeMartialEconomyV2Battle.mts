/** 正式構建逐招播放測試，真核心建立待戰狀態，不替換演出或獎勵。 */
import {readFileSync,writeFileSync} from 'node:fs';
import {createNewLife} from '../../core/life/gameState';
import {normalPreset} from '../../core/life/loadoutPresets';
import {startCombat} from '../../core/life/combat';
const f=JSON.parse(readFileSync('.local-online/martial-economy-v2/fixtures.json','utf8'));
const s=createNewLife({seed:42,name:'逐招驗收',skipCoach:true});s.pending=null;
const c=s.character;c.skills=['art_river_fist'];c.equippedArts=['art_river_fist',null,null,null,null];c.supportArts={internal:null,qinggong:null};c.volumes={art_river_fist:[1,2,3,4,5,6,7]};c.skillRanks.art_river_fist=0;
c.martial=0;c.maxHealth=c.health=5000;c.flags.baseMaxHp=5000;c.maxQi=c.qi=200;c.flags.baseMaxQi=200;c.gear=[];c.equipment={weapon:null,armor:null,accessory:null};c.combatLoadout=normalPreset(c);c.flags.newbie_done=true;c.flags.coach_done=true;
startCombat(s,{source:'spar',title:'逐招驗收',foeName:'試招首領',foePower:'boss',rewardOnWin:{},rewardOnLose:{}});
f.state=s;f.meta.manuals={art_river_fist:{stars:0,copies:0,vols:[1,2,3,4,5,6,7]}};writeFileSync('.local-online/martial-economy-v2/battle.json',JSON.stringify(f));
