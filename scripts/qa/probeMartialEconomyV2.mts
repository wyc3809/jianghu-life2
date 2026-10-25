/** 第44項真核心配平探測；固定種子、隔離角色，不改玩家或遠端資料。 */
import {mkdirSync,writeFileSync} from 'node:fs';
import {createNewLife} from '../../core/life/gameState';
import {normalPreset} from '../../core/life/loadoutPresets';
import {recomputeCapBonuses} from '../../core/life/equipment';
import {buildPlayerFighter,startCombat} from '../../core/life/combat';
import {runAutoCombat} from '../../core/life/autoCombat';
import {simulateOnlineBattle} from '../../core/online/combat';
import {internalQiRegen,martialTurnPlan} from '../../core/life/martialTurn';
import {turnQiRegen} from '../../core/life/combatCore';
import assert from 'node:assert/strict';
import {SKILL_DEFS} from '../../data/skills/catalog';
import {SCHOOLS,primarySchoolOfSkill} from '../../data/redesign/schools';
import {SparDuel,sparHeroStats,sparRand} from '../../core/life/sparDuel';
const out='production/qa/evidence/redesign/martial-economy-v2';mkdirSync(out,{recursive:true});
const arts=SCHOOLS.map(s=>Object.values(SKILL_DEFS).find(d=>d.kind==='external'&&d.move&&!d.premium&&primarySchoolOfSkill(d)===s.id)!.id);
function life(art:string,volumes:number,stage=0,internal='基礎吐納',rank=0,stars=0,seed=42) {
 const s=createNewLife({seed,skipCoach:true});const c=s.character;
 assert(SKILL_DEFS[art],art);assert(SKILL_DEFS[internal],internal);
 c.skills=[art,internal,'qg_broken_bridge'];c.equippedArts=[art,null,null,null,null];c.supportArts={internal,qinggong:'qg_broken_bridge'};
 c.skillRanks=Object.fromEntries(c.skills.map(id=>[id,rank]));c.manualStars=Object.fromEntries(c.skills.map(id=>[id,stars]));
 c.volumes={[art]:Array.from({length:volumes},(_,i)=>i+1)};c.cultivation.tier=stage;
 for(let i=1;i<=stage;i++){c.martial+=6+i*2;c.flags.baseMaxHp=Number(c.flags.baseMaxHp??c.maxHealth)+16+i*5;c.flags.baseMaxQi=Number(c.flags.baseMaxQi??c.maxQi)+20+i*6;}
 recomputeCapBonuses(c);c.health=c.maxHealth;c.qi=c.maxQi;c.combatLoadout=normalPreset(c);s.pending=null;return s;
}
const duels=[];
for(const tier of [0,4,8])for(const art of arts)for(const volumes of [1,3,7]) {
 let wins=0,losses=0,draws=0,rounds=0,rests=0,actions=0;
 for(let seed=0;seed<24;seed++){
  const a=life(art,volumes,tier),b=life('art_river_fist',3,tier),r=simulateOnlineBattle(a.character,b.character,seed);
  if(r.winner===0)wins++;else if(r.winner===1)losses++;else draws++;
  rounds+=r.forward.rounds.length;for(const round of r.forward.rounds){const own=round.hits.filter(h=>h.side==='player');if(own.length){actions++;if(own[0].moveName==='調息')rests++;}}
 }
 duels.push({tier,art,school:SCHOOLS.find(s=>s.id===primarySchoolOfSkill(SKILL_DEFS[art]))!.name,volumes,samples:24,wins,losses,draws,meanRounds:rounds/24,meditationActionRatio:actions?rests/actions:0});
}
const sustain=[];
for(const tier of [0,4,8])for(const internal of ['基礎吐納','art_spring_well','pr_void_breath'])for(const rank of [0,3])for(const stars of [0,3])for(const volumes of [1,3,7]){
 const s=life('art_river_fist',volumes,tier,internal,rank,stars),f=buildPlayerFighter(s);let attacks=0,rests=0;
 for(let round=1;round<=100;round++){f.qi=Math.min(f.maxQi,f.qi+turnQiRegen(f));const p=martialTurnPlan(s.character,f.qi,round,f.maxQi);f.qi-=p.cost;if(p.kind==='meditate'){rests++;f.qi=Math.min(f.maxQi,f.qi+f.maxQi*.3);}else attacks++;}
 sustain.push({tier,internal,rank,stars,volumes,maxQi:f.maxQi,regen:internalQiRegen(s.character),chainCost:41,attacks,rests});
}
const event=[];
for(const tier of [0,4,8,14])for(const art of arts)for(const volumes of [1,3,7])for(const power of ['normal','strong','boss'] as const){
 let wins=0,losses=0,rounds=0;for(let seed=0;seed<12;seed++){const s=life(art,volumes,tier,'基礎吐納',0,0,seed);startCombat(s,{source:'spar',title:'配平探測',foeName:'試煉對手',foePower:power});const r=runAutoCombat(s)!;if(r.outcome==='won'||r.outcome==='resolve')wins++;else losses++;rounds+=r.rounds.length;}
 event.push({tier,art,volumes,power,samples:12,wins,losses,meanRounds:rounds/12});
}
const spar=[];
for(const tier of [0,4,8])for(const volumes of [1,3,7]){
 let wall=1;const s=life('art_river_fist',volumes,tier);for(;wall<120;wall++){
  const d=new SparDuel(sparHeroStats(s),wall,sparRand(42,wall));let won=false;
  for(let turn=0;turn<10000;turn++){
   if(d.rounds.phase==='hero'){if(d.skipStunnedHero())continue;const m=d.rounds.beginMove(s.character)!;d.rounds.commitHeroMove();const h=d.heroStrike(m.power,m.move,m.artId);if(h.killed&&d.advance().stageCleared){won=true;break;}}
   else{const h=d.foeStrike();d.rounds.commitFoeMove();if(h.heroDown)break;if(h.foeKilled&&d.advance().stageCleared){won=true;break;}}
  }if(!won)break;
 }spar.push({tier,volumes,firstFailedStage:wall});
}
const report={version:'EA0.90.0 unpublished Story44',method:'真核心、固定種子，沒有玩家樣本；鏡像基礎角色配搭比較，不代表完整賽季勝率。',duelSamples:duels.length*24,eventSamples:event.length*12,duels,sustain,spar,event};
writeFileSync(out+'/balance.json',JSON.stringify(report,null,2));console.log(JSON.stringify({duelSamples:report.duelSamples,eventSamples:report.eventSamples,spar,sustain:sustain.filter(x=>x.tier===0&&x.rank===0&&x.stars===0&&x.volumes===7),duels:duels.filter(x=>x.tier===4)},null,2));
