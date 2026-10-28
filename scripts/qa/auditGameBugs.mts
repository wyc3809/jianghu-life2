/** 第53項：以真事件、真戰鬥及存檔schema走多種固定人生，不連伺服器。 */
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {createNewLife} from '../../core/life/gameState';
import {startMonth,resolvePendingEvent,applyChoice} from '../../core/life/eventEngine';
import {meetsRequirements} from '../../core/life/requirements';
import {runAutoCombat} from '../../core/life/autoCombat';
import {needsLifeOrDeathConfirm,confirmLifeOrDeath,resolveCombatDisposition,startCombat} from '../../core/life/combat';
import {performPracticeAction} from '../../core/life/actions';
import {foundSect,recruitDisciple} from '../../core/life/foundedSect';
import {lifeGameStateSchema,type LifeGameState} from '../../interfaces/lifeEngine';
const out='.local-online/bug-audit-ea097';mkdirSync(out,{recursive:true});
const report:unknown[]=[];let events=0,battles=0,turns=0;
for(let seed=1;seed<=24;seed++){
 let s=createNewLife({seed,skipCoach:true});s.pending=null;
 for(let step=0;step<180&&s.character.alive&&s.phase==='playing';step++){
  if(s.pendingCombat){
   if(needsLifeOrDeathConfirm(s.pendingCombat))confirmLifeOrDeath(s);
   if(s.pendingCombat.phase==='resolve')resolveCombatDisposition(s,'release');else{const replay=runAutoCombat(s);if(replay){battles++;turns+=replay.rounds.length;}}
  }else if(s.pending){
   const event=resolvePendingEvent(s);if(!event)throw new Error(`seed ${seed}: unresolved ${s.pending.eventId}`);
   const choices=event.choices.filter(c=>meetsRequirements(s,c.requirements));
   if(choices.length){applyChoice(s,event,choices[(step+seed)%choices.length]!.id);events++;}else{s.pending=null;}
  }else{
   if(step%3===0&&s.practiceActionsLeft)performPracticeAction(s,step%2===0?'train_martial':'train_internal');
   startMonth(s);
  }
  const parsed=lifeGameStateSchema.safeParse(s);if(!parsed.success)throw new Error(`seed ${seed}, step ${step}: ${parsed.error.message}`);
  const clone=lifeGameStateSchema.parse(JSON.parse(JSON.stringify(s)));if(clone.character.name!==s.character.name)throw new Error('roundtrip name');
  for(const [key,value] of Object.entries({hp:s.character.health,maxHp:s.character.maxHealth,qi:s.character.qi,maxQi:s.character.maxQi,money:s.character.money,ap:s.character.actionPoints}))if(!Number.isFinite(value)||value<0)throw new Error(`seed ${seed}: ${key}=${value}`);
 }
 report.push({seed,months:s.character.stats.monthsLived,phase:s.phase,alive:s.character.alive});
}
const f=JSON.parse(readFileSync('.local-online/martial-ui/fixtures.json','utf8')).full;
const founder=structuredClone(f);founder.state.character.martial=300;founder.state.character.reputation=100;founder.state.character.money=1000;founder.state.character.sectId=null;founder.state.pending=null;founder.state.moments=[];
foundSect(founder.state,'青山門');recruitDisciple(founder.state);founder.state.moments=[];
const poor=structuredClone(f);poor.state.character.money=0;poor.state.practiceActionsLeft=3;poor.state.pending=null;poor.state.moments=[];
const battle=structuredClone(f);battle.state.pending=null;battle.state.moments=[];startCombat(battle.state,{source:'spar',title:'審計試招',foeName:'武館陪練',foePower:'weak',rewardOnWin:{money:5},rewardOnLose:{}});
writeFileSync(out+'/fixtures.json',JSON.stringify({full:f,poor,founder,battle}));
writeFileSync(out+'/simulation.json',JSON.stringify({seeds:24,maxStepsPerSeed:180,events,battles,rounds:turns,saveRoundtripEveryStep:true,cases:report},null,2));console.log('CORE_AUDIT_PASS',JSON.stringify({seeds:24,events,battles,rounds:turns}));
