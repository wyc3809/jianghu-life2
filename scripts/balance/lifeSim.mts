/**
 * 固定種子人生模擬（2026-10-25 全面審計，production/balance/audit-ea091.md）。
 * 8 條人生 × 600 個月：每月加 SEC 秒掛機修為（預設 1800）、修為滿就突破、
 * 揀第一個非逃避選項、生死戰一律推辭；HEAL=1 時氣血低過一半先去醫館。
 * 輸出 SUMMARY（每條人生）、PERTIER（各境界中位數人物，即 EVENT_FOE_BASELINE 來源）、
 * WINRATE（事件敵人各難度倍率下嘅勝率）。只係固定策略，唔係真玩家數據。
 * 用法：SEC=1800 HEAL=1 npx vite-node scripts/balance/lifeSim.mts
 */
import { initRng } from '../../core/random';
import { createNewLife } from '../../core/life/gameState';
import { startMonth, applyChoice, resolvePendingEvent, lookupEvent } from '../../core/life/eventEngine';
import { runAutoCombat } from '../../core/life/autoCombat';
import { performPracticeAction } from '../../core/life/actions';
import { buildPlayerFighter } from '../../core/life/combat';
import { resolveCombatDisposition, declineLifeOrDeath } from '../../core/life/combat';
import { tickCultivation, canAttemptBreakthrough, attemptCultivationBreakthrough } from '../../core/life/cultivation';
const perTier:Record<number,{hp:number[],atk:number[],def:number[],mar:number[]}>={};
const out:any[]=[];
const samples:any[]=[];
const globalCount = new Map<string,number>();
for (const seed of [1,2,3,4,5,6,7,8]) {
  initRng(seed); const s:any = createNewLife({seed, skipCoach:true});
  const ids=new Map<string,number>(); let quiet=0, combats=0, wins=0, losses=0, lateChild:string[]=[];
  let lastEv=''; let m=0, lod=0;
  for (; m<600 && s.phase==='playing' && s.character.alive; m++) {
    if (s.pending) { s.pending=null; }
    if (m===0) { const f=buildPlayerFighter(s); perTier[0]={hp:[f.maxHp],atk:[f.attack],def:[f.defense],mar:[s.character.martial]}; }
    tickCultivation(s, Number(process.env.SEC ?? 1800)); while (canAttemptBreakthrough(s)) attemptCultivationBreakthrough(s);
    const hpBefore=s.character.health;
    if (m%25===0) samples.push(structuredClone(s));
    { const f=buildPlayerFighter(s); const t=s.character.cultivation.tier; (perTier[t]??={hp:[],atk:[],def:[],mar:[]}); perTier[t].mar.push(s.character.martial); perTier[t].hp.push(f.maxHp); perTier[t].atk.push(f.attack); perTier[t].def.push(f.defense); }
    if (process.env.HEAL && !s.pendingCombat) { for (let k=0;k<3 && s.character.health < s.character.maxHealth*0.5 && s.character.money>=15;k++) performPracticeAction(s,'heal'); }
    s.pending=null;
    startMonth(s);
    if (!s.pending && !s.pendingCombat) { quiet++; continue; }
    if (s.pending) {
      const ev = resolvePendingEvent(s) ?? lookupEvent(s.pending.eventId);
      if (!ev) { s.pending=null; continue; }
      ids.set(ev.id,(ids.get(ev.id)??0)+1); globalCount.set(ev.id,(globalCount.get(ev.id)??0)+1);
      if (m>60 && (ev.requirements?.maxAge ?? 999) <= 25) lateChild.push(ev.id+'('+ev.title+')@tier'+s.character.cultivation.tier);
      const ch = ev.choices.find((c:any)=>!/flee|逃/.test(c.id)) ?? ev.choices[0];
      try { applyChoice(s, ev, ch.id); } catch(e){ s.pending=null; }
      if (!s.character.alive) lastEv=ev.id+'/'+ch.id+' hpBefore='+hpBefore;
    }
    if (s.pendingCombat) {
      combats++;
      if (s.pendingCombat.lifeOrDeath && !s.pendingCombat.riskConfirmed) { lod++; declineLifeOrDeath(s); continue; }
      const r = runAutoCombat(s);
      const pc = s.pendingCombat;
      if (pc && pc.phase==='resolve') { wins++; resolveCombatDisposition(s,'release'); }
      else if (pc && pc.phase==='ended') { if (pc.foe.hp<=0) wins++; else losses++; s.pendingCombat=null; }
      else if (!pc) { /* resolved */ if (r?.outcome==='won' ) wins++; }
      if (s.pendingCombat) s.pendingCombat=null;
    }
  }
  out.push({top:[...ids.entries()].sort((a,b)=>b[1]-a[1]).slice(0,8), seed, months:m, lod, lastEv, tier:s.character.cultivation.tier, alive:s.character.alive, phase:s.phase, death:s.character.flags.death_cause, quiet, distinct:ids.size, combats, wins, losses, lateChildN:lateChild.length, lateChild:lateChild.slice(0,5), hp:s.character.health+'/'+s.character.maxHealth, martial:s.character.martial, money:s.character.money, rep:s.character.reputation, skills:s.character.skills.length, gear:(s.character.gear||[]).length});
}
console.log('SUMMARY '+JSON.stringify(out.map(o=>({months:o.months,alive:o.alive,death:o.death,lastEv:o.lastEv,seed:o.seed,lateChildN:o.lateChildN,money:o.money,combats:o.combats,wins:o.wins,lod:o.lod,tier:o.tier,distinct:o.distinct}))));
const med=(a:number[])=>{const b=[...a].sort((x,y)=>x-y);return b[Math.floor(b.length/2)]};
const rows=Object.entries(perTier).map(([t,v])=>({tier:+t,n:v.hp.length,hp:med(v.hp),atk:med(v.atk),def:med(v.def),mar:med(v.mar)}));
console.log('PERTIER '+JSON.stringify(rows));
const { startCombat, buildFoe, eventFoeScale } = await import('../../core/life/combat');
const res:any={};
for (const d of [1,1.3,1.6,2]) for (const power of ['normal','strong','boss'] as const) {
  const buckets:any={weak:[0,0,0],mid:[0,0,0],strong:[0,0,0]};
  for (const base of samples) { const st:any=structuredClone(base); st.pending=null; st.pendingCombat=null; st.phase='playing'; st.character.alive=true;
    const t=st.character.cultivation.tier; const ref=eventFoeScale(t,'normal',1);
    const f=buildPlayerFighter(st); const ratio=f.attack/ref.attack; const b=ratio<0.9?'weak':ratio>1.15?'strong':'mid';
    startCombat(st,{source:'event',title:'試',foeName:'山賊',foePower:power});
    const foe=buildFoe('山賊',power,eventFoeScale(t,power,d)); st.pendingCombat.foe=foe;
    const r=runAutoCombat(st); const won = r?.outcome==='won'||r?.outcome==='resolve';
    buckets[b][0]++; if (won) { buckets[b][1]++; buckets[b][2]+= st.pendingCombat? st.pendingCombat.player.hp/st.pendingCombat.player.maxHp : 0; }
  }
  res[d+'/'+power]=Object.fromEntries(Object.entries(buckets).map(([k,v]:any)=>[k, v[0]? `${Math.round(100*v[1]/v[0])}%勝 n${v[0]} 剩血${v[1]?Math.round(100*v[2]/v[1]):0}%`:'-']));
}
console.log('WINRATE '+JSON.stringify(res));
