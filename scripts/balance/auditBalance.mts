/** 固定種子數值快照，覆蓋資源、境界、演武、抽卡；唔修改正式數值。 */
import { GEAR_CATALOG, getGearDef } from '../../data/equipment/catalog';
import { SKILL_DEFS } from '../../data/skills/catalog';
import { writeFileSync } from 'node:fs';
import { initRng } from '../../core/random';
import { createNewLife } from '../../core/life/gameState';
import { sparHeroStats, sparStageFoes, sparStageReward } from '../../core/life/sparDuel';
import { buildPlayerFighter } from '../../core/life/combat';
import { breakthroughChance, CULTIVATION_TIERS, effectiveCultivationRate } from '../../core/life/cultivation';
import { idleSilverCap, idleSilverPerHour } from '../../core/life/idleHarvest';
import { FREE_POOL, PREMIUM_POOL } from '../../core/life/gacha';
const progression=[];
for (const tier of [0,4,8,13,14]) {
 initRng(42);const s=createNewLife({seed:42,skipCoach:true});const c=s.character;
 // 保留開局裝備／屬性，僅加入每次成功突破嘅固定成長；唔包含事件及新武學。
 for(let t=1;t<=tier;t++){c.martial+=6+t*2;c.maxHealth+=16+t*5;c.maxQi+=20+t*6;}
 c.health=c.maxHealth;c.qi=c.maxQi;c.cultivation={tier,xp:0,reserve:0};
 const spar=sparHeroStats(s), battle=buildPlayerFighter(s), rate=effectiveCultivationRate(s);
 progression.push({tier,name:CULTIVATION_TIERS[tier].name,hp:c.maxHealth,qi:c.maxQi,stamina:c.maxStamina,martial:c.martial,sparAttack:spar.atk,eventAttack:battle.attack,sparGuard:spar.guard,rate,fillHours:Number.isFinite(CULTIVATION_TIERS[tier].cap)?CULTIVATION_TIERS[tier].cap/rate/3600:null,breakthroughChance:breakthroughChance(s)});
}
initRng(42);const s=createNewLife({seed:42,skipCoach:true});
const stages=[1,10,25,40,60].map(stage=>{s.character.flags.spar_stage=stage;const boss=sparStageFoes(stage).at(-1)!;return {stage,bossHp:boss.maxHp,bossAttack:boss.atk,reward:sparStageReward(stage),silverPerHour:idleSilverPerHour(s),silver48h:idleSilverCap(s)};});
const p=.025,n=40;const expectedWish=(1-(1-p)**n)/p;
const ranges=(values:number[])=>({min:Math.min(...values),max:Math.max(...values),count:values.length});
const moves=Object.values(SKILL_DEFS).flatMap(d=>d.move?[d.move]:[]);
const equipment=GEAR_CATALOG.map(d=>getGearDef(d.id)!).filter(Boolean);
const catalog={skillMoves:moves.length,qiCost:ranges(moves.map(m=>m.qiCost)),power:ranges(moves.map(m=>m.power)),lifesteal:ranges(moves.map(m=>m.lifesteal??0)),gearCount:equipment.length,gearAttack:ranges(equipment.map(d=>d.attack??0)),gearDefense:ranges(equipment.map(d=>d.defense??0)),gearHp:ranges(equipment.map(d=>d.maxHpBonus??0))};
const result={catalog,fixture:'seed42；只計突破成長，唔係真實玩家遙測或完整勝率模擬',progression,stages,gacha:{freeCount:FREE_POOL.length,premiumCount:PREMIUM_POOL.length,premiumCatalogShare:PREMIUM_POOL.length/(FREE_POOL.length+PREMIUM_POOL.length),cost:60,pity:40,maxCost:2400,wishModelNote:'只計2.5%心願分支及40保底，未計隨機池自然抽中；唔係實測期望',upperWishPullsModel:expectedWish,upperWishCostModel:expectedWish*60,monthsPerPullFromMonthlyJade:20,monthsPerPityFromMonthlyJade:800,breakthroughJadeThroughTier14:Array.from({length:14},(_,i)=>20+(i+1)*5).reduce((a,b)=>a+b,0)},recovery:{fatigue100ToZeroMinutes:10,eventCost:5,secondsToRestoreOneEvent:30,hpMonthlyMean:8.5,qiMonthlyMean:8,staminaMonthlyMean:8}};
writeFileSync('production/balance/balance-snapshot.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
