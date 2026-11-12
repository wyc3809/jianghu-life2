/** 第61項：固定種子跨事件、修煉、戰鬥、過月及存檔兼容驗收，不連伺服器。 */
import {mkdirSync,writeFileSync} from 'node:fs';
import {createNewLife} from '../../core/life/gameState';
import {startMonth,resolvePendingEvent,applyChoice} from '../../core/life/eventEngine';
import {meetsRequirements} from '../../core/life/requirements';
import {runAutoCombat} from '../../core/life/autoCombat';
import {needsLifeOrDeathConfirm,confirmLifeOrDeath,resolveCombatDisposition} from '../../core/life/combat';
import {performPracticeAction} from '../../core/life/actions';
import {lifeGameStateSchema} from '../../interfaces/lifeEngine';
const out='production/qa/evidence/redesign/game-unification';mkdirSync(out,{recursive:true});
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
writeFileSync(out+'/simulation.json',JSON.stringify({seeds:24,maxStepsPerSeed:180,events,battles,rounds:turns,saveRoundtripEveryStep:true,cases:report},null,2));console.log('CORE_UNIFICATION_PASS',JSON.stringify({seeds:24,events,battles,rounds:turns}));
