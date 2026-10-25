import { describe, expect, it } from 'vitest';
import { createNewLife } from '@core/life/gameState';
import { emptyAncestry, parseAncestry } from '@core/life/ancestry';
import { exchangePages, upgradeManual, pull, setWish, bannerState } from '@core/life/gacha';
import { collectionVolumes, ownedVolumes, addCollectionVolume } from '@core/life/volumes';
import { normalPreset, characterForPreset, setPresetMartialSlot, setDuelGear } from '@core/life/loadoutPresets';
import { martialTurnPlan, resolveMartialTurn, internalQiRegen } from '@core/life/martialTurn';
import { buildPlayerFighter } from '@core/life/combat';
import { applyControl, consumeStun, resolveStrike } from '@core/life/combatCore';
import { createRng, getRng, initRng } from '@core/random';
import { settleSparTraining } from '@core/life/sparTraining';
import { settleAccountEconomy, selectDailyTask, claimDailyTask, dailyProgress, claimGrowthGuide, receiveOnlineJade, queueAccountReward, economyDay } from '@core/life/accountEconomy';
import { createOnlineFixture } from '@core/online/fixtures';
import { settleOnlineWorld, onlineJadeProgress } from '@core/online/rules';
import { applyOnlineCommand } from '@core/online/commands';
import type { OnlineBattle } from '@interfaces/online';

const now=Date.UTC(2026,9,25,5);
const life=()=>createNewLife({seed:42,skipCoach:true});

describe('第44項書頁及卷次',()=>{
  it('test_exchange_首次自選卷七_只得一卷且重送不扣頁',()=>{
    const m=emptyAncestry();m.pages=400;
    expect(exchangePages(m,'art_river_fist',7)).toBe(true);
    expect(collectionVolumes(m,'art_river_fist')).toEqual([7]);
    expect(m.pages).toBe(200);
    const before=structuredClone(m);expect(exchangePages(m,'art_river_fist',7)).toBe(false);expect(m).toEqual(before);
    expect(exchangePages(m,'art_river_fist',3)).toBe(true);expect(collectionVolumes(m,'art_river_fist')).toEqual([3,7]);
  });
  it.each([undefined,0,8,1.5,NaN])('test_exchange_非法卷次%s_不消耗',v=>{
    const m=emptyAncestry();m.pages=200;expect(exchangePages(m,'art_river_fist',v)).toBe(false);expect(m.pages).toBe(200);
  });
  it('test_exchange_內功整門及珍本拒絕_沿用兩池限制',()=>{
    const m=emptyAncestry();m.pages=600;
    expect(exchangePages(m,'art_iron_body')).toBe(true);
    expect(exchangePages(m,'art_iron_body')).toBe(false);
    expect(exchangePages(m,'pr_blood_lotus',1)).toBe(false);expect(m.pages).toBe(400);
  });
  it('test_volumes_新明確卷次不送卷一_舊無卷紀錄仍保留卷一',()=>{
    const s=life();s.character.volumes={art_river_fist:[7]};expect(ownedVolumes(s.character,'art_river_fist')).toEqual([7]);
    delete s.character.volumes;expect(ownedVolumes(s.character,'art_river_fist')).toEqual([1]);
    const m=emptyAncestry();m.manuals={art_river_fist:{stars:2,copies:3}};expect(collectionVolumes(m,'art_river_fist')).toHaveLength(7);
    expect(parseAncestry(JSON.stringify(m)).manuals).toEqual(m.manuals);
  });
  it('test_duplicate_新重複轉20頁_舊重複本保留',()=>{
    const m=emptyAncestry();m.manuals={art_river_fist:{stars:1,copies:3,vols:[7]}};
    expect(addCollectionVolume(m,'art_river_fist',7)).toBe(false);expect(m.pages).toBe(20);expect(m.manuals.art_river_fist.copies).toBe(3);
    m.jade={free:60,paidTest:0};setWish(m,'jianghu','art_river_fist');bannerState(m,'jianghu').sinceWish=39;
    m.manuals.art_river_fist.vols=[1,2,3,4,5,6,7];
    const r=pull(m,'jianghu',1)![0];expect(r.kind).toBe('art');if(r.kind!=='pages')expect(r.duplicatePages).toBe(20);
    expect(m.pages).toBe(40);expect(m.manuals.art_river_fist.copies).toBe(3);
  });
  it('test_upgrade_三階共600頁_不足及滿階不扣款不消耗舊本',()=>{
    const m=emptyAncestry();m.pages=600;m.manuals={art_river_fist:{stars:0,copies:4,vols:[7]}};
    for(const remaining of [500,300,0]){expect(upgradeManual(m,'art_river_fist')).toBe(true);expect(m.pages).toBe(remaining);}
    expect(upgradeManual(m,'art_river_fist')).toBe(false);expect(m.manuals.art_river_fist).toEqual({stars:3,copies:4,vols:[7]});
  });
});

describe('整門連招與對戰配搭',()=>{
  it('test_turn_一三七卷_固定起手41內且不額外普攻',()=>{
    const c=life().character;
    for(const n of [1,3,7]){c.volumes={art_river_fist:Array.from({length:n},(_,i)=>i+1)};const p=martialTurnPlan(c,200,1,200);expect(p.cost).toBe(41);expect(p.moves).toHaveLength(n);expect(p.moves.every(m=>m.move.qiCost===0)).toBe(true);}
  });
  it('test_turn_當前不足換下一門_全部不足只調息30%',()=>{
    const s=life(),c=s.character;c.skills.push('art_silk_hand');c.equippedArts=['art_river_fist','art_silk_hand',null,null,null];
    expect(martialTurnPlan(c,35,1,200).moves[0].skillId).toBe('art_silk_hand');
    const a=buildPlayerFighter(s),b=buildPlayerFighter(s);a.qi=0;a.maxQi=200;a.qiRegen=0;a.qiRegenPercent=0;
    const action=resolveMartialTurn(a,b,c,1,createRng(42));expect(action.hits.map(h=>h.moveName)).toEqual(['調息']);expect(a.qi).toBeCloseTo(62);expect(action.hits[0].damage).toBe(0);
  });
  it('test_turn_每回合自然1%_內功固定及頂級百分比各自生效',()=>{
    const s=life(),a=buildPlayerFighter(s);expect(internalQiRegen(s.character).flat).toBe(4);
    s.character.skills.push('pr_void_breath');s.character.supportArts={internal:'pr_void_breath',qinggong:null};
    expect(internalQiRegen(s.character)).toEqual({flat:0,percent:.04});expect(a.qi).toBe(a.maxQi);
  });
  it('test_presets_獨立武學裝備及共享收藏_舊檔兩套保持原配搭',()=>{
    const s=life(),before=normalPreset(s.character);s.character.skills.push('art_silk_hand');s.character.gear.push('iron-blade');
    expect(setPresetMartialSlot(s,0,'art_silk_hand','duel')).toBe(true);expect(setDuelGear(s.character,'iron-blade')).toBe(true);
    expect(normalPreset(s.character)).toEqual(before);expect(characterForPreset(s.character,'duel').equippedArts![0]).toBe('art_silk_hand');
    const snapshot=structuredClone(characterForPreset(s.character,'duel'));
    setPresetMartialSlot(s,0,null,'duel');expect(snapshot.equippedArts![0]).toBe('art_silk_hand');expect(s.character.gear).toContain('iron-blade');
  });
  it('test_control_首領抗性30%_每段獨立且最多停一回合',()=>{
    const s=life(),a=buildPlayerFighter(s),b=buildPlayerFighter(s),rng=createRng(1);const probabilities:number[]=[];
    rng.chance=p=>{probabilities.push(p);return true;};b.hp=b.maxHp=1e6;b.controlResistance=.3;
    resolveStrike(a,b,{id:'test',name:'三連',power:1,qiCost:0,multiHit:3,stunChance:.2,description:''},rng);
    expect(probabilities.filter(p=>Math.abs(p-.14)<1e-8)).toHaveLength(3);expect(b.stun).toBe(1);
    b.stun=7;expect(consumeStun(b)).toBe(true);expect(b.stun).toBe(0);expect(b.stunProtected).toBe(true);expect(applyControl(b,1,rng)).toBe(false);
    resolveMartialTurn(b,a,s.character,1,rng);expect(b.stunProtected).toBe(false);
  });
  it('test_training_每敵每門只計一次且不推進事件RNG',()=>{
    const s=life(),c=s.character;c.skills.push('qg_broken_bridge');c.supportArts={internal:'基礎吐納',qinggong:'qg_broken_bridge'};
    initRng(912);const before=getRng().getState(),progress=c.skillProgress.art_river_fist;
    settleSparTraining(s,['art_river_fist','art_river_fist']);expect(c.skillProgress.art_river_fist).toBe(progress+1);expect(c.skillProgress.qg_broken_bridge).toBe(1);expect(getRng().getState()).toBe(before);
  });
});

describe('帳戶一次獎勵及每日任務',()=>{
  it('test_daily_自選最多三項_跨日刷新而連點不重派',()=>{
    const m=emptyAncestry(),s=life();settleAccountEconomy(m,s,now);
    for(const id of ['spar','practice','months'])expect(selectDailyTask(m,id)).toBe(true);
    expect(selectDailyTask(m,'harvest')).toBe(false);
    s.character.flags.spar_foes_total=20;s.character.flags.practice_actions=3;s.character.stats.monthsLived=3;settleAccountEconomy(m,s,now);
    for(const id of ['spar','practice','months']){expect(claimDailyTask(m,id)).toBe(true);expect(claimDailyTask(m,id)).toBe(false);}
    expect(m.jade!.free).toBe(180);settleAccountEconomy(m,s,now+86400_000);expect(m.economy!.daily!.claimed).toEqual([]);expect(dailyProgress(m.economy,'spar')).toBe(0);
  });
  it('test_daily_香港凌晨四時及時鐘回撥_不重開已領日常',()=>{
    expect(economyDay(Date.UTC(2026,9,25,19,59))).toBe('2026-10-25');expect(economyDay(Date.UTC(2026,9,25,20))).toBe('2026-10-26');
    const m=emptyAncestry(),s=life();settleAccountEconomy(m,s,now);const day=m.economy!.daily!.day;settleAccountEconomy(m,s,now-86400_000);expect(m.economy!.daily!.day).toBe(day);
  });
  it('test_rewards_首次突破逐境120起加60_後代不重領',()=>{
    const m=emptyAncestry(),s=life();settleAccountEconomy(m,s,now);s.character.cultivation.tier=3;
    expect(settleAccountEconomy(m,s,now)).toBe(540);expect(settleAccountEconomy(m,s,now)).toBe(0);
    const heir=life();heir.character.flags.legacy_generation=2;heir.character.cultivation.tier=3;expect(settleAccountEconomy(m,heir,now)).toBe(0);
  });
  it('test_rewards_舊境界不補發_新突破及賽事輪次一次入帳',()=>{
    const m=emptyAncestry(),s=life();s.character.cultivation.tier=7;s.character.flags.economy_baseline_tier=7;
    expect(settleAccountEconomy(m,s,now)).toBe(0);s.character.cultivation.tier=8;expect(settleAccountEconomy(m,s,now)).toBe(540);
    queueAccountReward(s,'huashan:season:1',180);queueAccountReward(s,'huashan:season:1',180);expect(settleAccountEconomy(m,s,now)).toBe(180);
    queueAccountReward(s,'huashan:season:1',180);expect(settleAccountEconomy(m,s,now)).toBe(0);
  });
  it('test_guide_一般30重要120_帳戶首次另計且後代不重派',()=>{
    const m=emptyAncestry(),s=life();settleAccountEconomy(m,s,now);s.character.flags.duel_loadout_saved=true;s.character.cultivation.tier=1;
    expect(claimGrowthGuide(m,s,'duel_set')).toBe(true);expect(claimGrowthGuide(m,s,'breakthrough')).toBe(true);expect(m.jade!.free).toBe(150);
    expect(claimGrowthGuide(m,s,'breakthrough')).toBe(false);expect(parseAncestry(JSON.stringify(m)).economy).toEqual(m.economy);
  });
  it('test_online_credit_輪詢重播及舊收據_只接收服務端累計差額',()=>{
    const m=emptyAncestry(),s=life();settleAccountEconomy(m,s,now);
    expect(receiveOnlineJade(m,'public:uuid',120)).toBe(120);expect(receiveOnlineJade(m,'public:uuid',120)).toBe(0);expect(receiveOnlineJade(m,'public:uuid',60)).toBe(0);expect(receiveOnlineJade(m,'public:uuid',180)).toBe(60);expect(m.jade!.free).toBe(180);
  });
});

describe('多人隨機對手與勝場額度',()=>{
  it('test_random_不能指定對手_有未領對手則優先且離線仍可入選',()=>{
    const w=createOnlineFixture(now);w.players.third=structuredClone(w.players.cloud);w.players.third.id='third';w.players.third.rank=10001;
    w.players.river.jadeDay={day:economyDay(now),attackWins:1,defendWins:0,opponents:['cloud']};
    const legacy=structuredClone(w);applyOnlineCommand(legacy,now,'river','challenge',{requestId:'test-id-1',target:'cloud'},{seed:42,battleId:'x'});
    expect(legacy.battles[0].defender).toBe('third'); // 舊欄位不會指定到已領的cloud。
    applyOnlineCommand(w,now,'river','challenge',{requestId:'test-id-2'},{seed:42,battleId:'x'});expect(w.battles[0].defender).toBe('third');
  });
  it('test_win_rewards_主動防守分開三勝_同對手只計一次且重讀不重派',()=>{
    const w=createOnlineFixture(now);let n=0;
    const unchanged=structuredClone(w.players.cloud.character);
    const win=(opponent:string,role:'attack'|'defend')=>{
      w.players[opponent]??={...structuredClone(w.players.cloud),id:opponent,rank:500+n};
      const b:OnlineBattle={id:`b${n++}`,attacker:role==='attack'?'river':opponent,defender:role==='attack'?opponent:'river',winner:'river',startedAt:now,endsAt:now,settledAt:null,before:{river:100,[opponent]:500},after:null,replays:{},characters:{}};
      w.battles.push(b);settleOnlineWorld(w,now);return b;
    };
    for(let i=0;i<3;i++)expect(win(`a${i}`,'attack').jadeAwards?.river).toBe(120);
    expect(win('extra','attack').jadeAwards).toBeUndefined();
    expect(win('a0','defend').jadeAwards).toBeUndefined();
    for(let i=0;i<3;i++)expect(win(`d${i}`,'defend').jadeAwards?.river).toBe(60);
    expect(w.players.river.jadeEarnedTotal).toBe(540);settleOnlineWorld(w,now+100);expect(w.players.river.jadeEarnedTotal).toBe(540);
    expect(w.players.cloud.character).toEqual(unchanged);
    expect(onlineJadeProgress(w.players.river,now+86400_000)).toEqual({attackWins:0,defendWins:0});
    expect(w.players.river.jadeDay!.attackWins).toBe(3);
  });
});

describe('新卷存檔與實際戰鬥特效回歸',()=>{
  it('test_spar_多段控制解暈保護及流血_控制中仍結算狀態死亡',async()=>{
    const {SparDuel,sparHeroStats}=await import('@core/life/sparDuel');
    const {BASIC_STRIKE}=await import('@data/skills/catalog');
    const s=life(),duel=new SparDuel({...sparHeroStats(s),atk:1,critRate:0},1,()=>.01);
    const move={...BASIC_STRIKE,power:1,multiHit:3,stunChance:.2,bleedChance:1,bleedDamage:1000,bleedTurns:2};
    const strike=duel.heroStrike(1,move,'art_river_fist');expect(strike.killed).toBe(false);
    expect(duel.skipStunnedFoe()).toBe(true);expect(duel.foeHp).toBe(0);
    expect(duel.heroStrike(1,move,'art_river_fist').killed).toBe(false);
  });
  it('test_gear_control_裝備控制同受解暈及首領抗性限制',async()=>{
    const {applyGearSpecialOnHit}=await import('@core/life/gearSpecialEffects');
    const a=buildPlayerFighter(life()),b=buildPlayerFighter(life()),rng=createRng(4),rolls:number[]=[];
    a.gearSpecials=[{kind:'stun_proc',name:'測試控制',description:'',chance:.2}];
    rng.chance=p=>{rolls.push(p);return true;};b.controlResistance=.3;
    applyGearSpecialOnHit(a,b,rng);expect(rolls).toHaveLength(1);expect(rolls[0]).toBeCloseTo(.14);consumeStun(b);
    applyGearSpecialOnHit(a,b,rng);expect(b.stun).toBe(0);expect(rolls).toHaveLength(1);
  });
  it('test_blind_降低受影響者命中_不降低對手命中',async()=>{
    const {resolveOneHit}=await import('@core/life/combatCore');const {BASIC_STRIKE}=await import('@data/skills/catalog');
    const a=buildPlayerFighter(life()),b=buildPlayerFighter(life()),rng=createRng(4),rolls:number[]=[];
    rng.chance=p=>{rolls.push(p);return false;};a.blind=.3;b.blind=0;
    resolveOneHit(a,b,BASIC_STRIKE,rng,0,1);resolveOneHit(b,a,BASIC_STRIKE,rng,0,1);
    expect(rolls[1]-rolls[0]).toBeCloseTo(.3);
  });
  it('test_save_雙配搭與明確卷七往返_不上送卷一且上限不重疊',async()=>{
    const {lifeGameStateSchema}=await import('@interfaces/lifeEngine');const {migrateLifeState}=await import('@core/life/gameState');
    const s=life();s.character.skills.push('art_iron_body');setPresetMartialSlot(s,5,'art_iron_body','duel');
    s.character.volumes={art_river_fist:[7]};const caps={hp:s.character.maxHealth,qi:s.character.maxQi};
    const restored=migrateLifeState(lifeGameStateSchema.parse(JSON.parse(JSON.stringify(s))));
    const again=migrateLifeState(structuredClone(restored));expect(normalPreset(again.character)).toEqual(normalPreset(s.character));
    expect(again.character.combatLoadout).toEqual(s.character.combatLoadout);expect(ownedVolumes(again.character,'art_river_fist')).toEqual([7]);
    expect({hp:again.character.maxHealth,qi:again.character.maxQi}).toEqual(caps);
  });
  it('test_random_同段有較高權重_跨段仍有機會',async()=>{
    const {selectOnlineOpponent}=await import('@core/online/commands');const w=createOnlineFixture(now);
    w.players.river.rank=50;w.players.cloud.rank=51;w.players.third={...structuredClone(w.players.cloud),id:'third',rank:50001};
    const counts={cloud:0,third:0};for(let seed=0;seed<1000;seed++)counts[selectOnlineOpponent(w,now,'river',seed).id as keyof typeof counts]++;
    expect(counts.cloud).toBeGreaterThan(700);expect(counts.cloud).toBeLessThan(900);expect(counts.third).toBeGreaterThan(100);
  });
});

it('test_caps_論劍與多人對戰快照_內功及裝備上限只加一次',async()=>{
 const {snapshotContestantFromLife}=await import('@core/life/huashan');const {buildContestantFighter}=await import('@core/life/duelSim');
 const {GEAR_CATALOG}=await import('@data/equipment/catalog');
 const s=life(),c=s.character,gear=Object.values(GEAR_CATALOG).find(d=>(d.maxHpBonus??0)>0)!;
 c.skills.push('art_iron_body');c.gear.push(gear.id);setPresetMartialSlot(s,5,'art_iron_body','duel');setDuelGear(c,gear.id);
 const expected=buildPlayerFighter({...s,character:characterForPreset(c,'duel')}),contest=buildContestantFighter(snapshotContestantFromLife(s));
 expect(contest.maxHp).toBe(expected.maxHp);expect(contest.maxQi).toBe(expected.maxQi);
});

it('test_old_account_前代已達先天成就_本代低境不重派舊獎',()=>{
 const m=emptyAncestry(),s=life();m.jadeAchv=['ach_tier_xiantian'];m.milestones=['fm_tier6'];
 expect(settleAccountEconomy(m,s,now)).toBe(0);expect(m.economy!.highestTier).toBe(9);
 s.character.cultivation.tier=9;expect(settleAccountEconomy(m,s,now)).toBe(0);
 s.character.cultivation.tier=10;expect(settleAccountEconomy(m,s,now)).toBe(660);
});

it('test_npc_首領按境界連段_一次起手扣內而不足只調息',async()=>{
 const {buildFoe}=await import('@core/life/combat');const {chooseFoeMove}=await import('@core/life/foeAi');
 const foe=buildFoe('試招首領','boss',{martial:100,maxHp:500,attack:40,tier:8}),target=buildPlayerFighter(life()),rng=createRng(42);
 expect(foe.actionHits).toBe(4);foe.qi=foe.maxQi=100;target.hp=target.maxHp=1e6;
 const choice=chooseFoeMove(foe,{nextFloat:()=>.5,chance:()=>false,pick:<T,>(list:T[])=>list[0]!},'boss');
 expect(choice.multiHit).toBe(4);resolveStrike(foe,target,choice,rng);expect(foe.qi).toBe(100-choice.qiCost);
 foe.qi=0;const recovery=chooseFoeMove(foe,rng,'boss');expect(recovery.name).toBe('調息');
 const hp=target.hp;resolveStrike(foe,target,recovery,rng);expect(foe.qi).toBe(30);expect(target.hp).toBe(hp);
});

it('test_daily_有效修煉計實際進展_整裝與無門派失敗不計',async()=>{
 const {performPracticeAction}=await import('@core/life/actions');const s=life();s.pending=null;s.practiceActionsLeft=10;
 for(const action of ['train_martial','train_internal','temper_body'] as const)performPracticeAction(s,action);
 expect(s.character.flags.practice_actions).toBe(3);
 performPracticeAction(s,'equip_best');performPracticeAction(s,'sect_meditate');expect(s.character.flags.practice_actions).toBe(3);
});
