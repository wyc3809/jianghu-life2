import { describe, expect, it } from 'vitest';
import { getRngState, initRng } from '../core/random';
import { simulateSectBattle, validateSectBattleRoster } from '../core/online/sectBattle';
import { sectBattleFixture } from '../src/prototypes/sectBattle/fixtures';
import { SECT_BATTLE_TEST } from '../data/redesign/sectBattleTestParams';
import { getSkillDef } from '../data/skills/catalog';

const roster = sectBattleFixture();
const replay = simulateSectBattle(roster, 5707);

describe('門派同場二十人隔離原型', () => {
  it('test_sect_battle_同種子可重現_不改輸入或玩家RNG', () => {
    initRng(245);const rngBefore=getRngState(),before=structuredClone(roster);
    expect(sectBattleFixture()).toEqual(roster);
    expect(simulateSectBattle([...roster].reverse(),5707)).toEqual(replay);
    expect(roster).toEqual(before);expect(getRngState()).toBe(rngBefore);
  });
  it('test_sect_battle_同一時間軸有二十人_多於兩人同時出招', () => {
    expect(replay.frames[0].figures).toHaveLength(20);
    expect(replay.frames.every(frame=>frame.figures.length===20)).toBe(true);
    expect(Math.max(...replay.frames.map(frame=>frame.figures.filter(u=>u.pose==='attack').length))).toBeGreaterThan(3);
    expect(replay.frames.some(frame=>frame.figures.some(u=>u.pose==='walk'))).toBe(true);
  });
  it('test_sect_battle_自主尋敵及轉火_不鎖成十對單挑_不傷隊友', () => {
    const pairs=new Set(replay.events.map(e=>`${e.actor}:${e.target}`));expect(pairs.size).toBeGreaterThan(20);
    for(const event of replay.events){
      const a=roster.find(u=>u.id===event.actor)!,b=roster.find(u=>u.id===event.target)!;
      expect(a.side).not.toBe(b.side);expect(a.id).not.toBe(b.id);
    }
    const changed=replay.frames[0].figures.filter(u=>new Set(replay.frames.map(f=>f.figures.find(v=>v.id===u.id)!.target).filter(Boolean)).size>1);
    expect(changed.length).toBeGreaterThan(0);
  });
  it('test_sect_battle_沿真已學卷序_整門扣內一次而非每卷扣', () => {
    const id=roster[0].id,unitEvents=replay.events.filter(e=>e.actor===id&&!e.splash);
    expect(unitEvents.slice(0,3).map(e=>e.vol)).toEqual([1,3,7]);
    const initial=replay.frames[0].figures.find(u=>u.id===id)!;
    const first=replay.frames.find(f=>f.figures.find(u=>u.id===id)!.pose==='attack')!.figures.find(u=>u.id===id)!;
    expect(first.qi).toBe(initial.qi-(getSkillDef(initial.artId)?.move?.qiCost??0));
    const qi=unitEvents.slice(0,3).map(e=>replay.frames.find(f=>f.at===e.at)!.figures.find(u=>u.id===id)!.qi);
    expect(new Set(qi).size).toBe(1);
  });
  it('test_sect_battle_波及只傷敵人_每卷有上限', () => {
    expect(replay.events.some(e=>e.splash)).toBe(true);
    const counts=new Map<string,number>();
    for(const e of replay.events.filter(e=>e.splash)){
      const key=`${e.actor}:${e.at}:${e.vol}`;counts.set(key,(counts.get(key)??0)+1);
    }
    expect(Math.max(...counts.values())).toBeLessThanOrEqual(SECT_BATTLE_TEST.maxSplash);
  });
  it('test_sect_battle_位置及氣血內力有限_不復活已退場人物或繼續出招', () => {
    const down=new Map<string,number>(),invalid:string[]=[];
    for(const frame of replay.frames)for(const u of frame.figures){
      if(!Number.isFinite(u.x+u.y+u.hp+u.qi)||u.x<48||u.x>952||u.y<65||u.y>580||u.hp<0||u.hp>u.maxHp||u.qi<0||u.qi>u.maxQi)invalid.push(`${frame.at}:${u.id}:bounds`);
      if(down.has(u.id)&&u.hp!==0)invalid.push(`${frame.at}:${u.id}:revived`);
      if(u.hp<=0)down.set(u.id,Math.min(down.get(u.id)??Infinity,frame.at));
    }
    for(const e of replay.events)if(down.has(e.actor)&&e.at>down.get(e.actor)!)invalid.push(`${e.at}:${e.actor}:after-down`);
    expect(invalid).toEqual([]);
  });
  it('test_sect_battle_勝負只按全隊退場_時間到未清場則平手', () => {
    const remaining=[0,1].map(side=>replay.frames.at(-1)!.figures.filter(u=>u.side===side&&u.hp>0).length);
    expect(replay.remaining).toEqual(remaining);
    if(replay.winner!==null){expect(remaining[1-replay.winner]).toBe(0);expect(remaining[replay.winner]).toBeGreaterThan(0);}
    else expect(replay.duration===SECT_BATTLE_TEST.maxSeconds||remaining.every(n=>n===0)).toBe(true);
  });
  it('test_sect_battle_重複身份席位及缺員拒絕_不捏造NPC補位', () => {
    expect(()=>validateSectBattleRoster(roster.slice(1))).toThrow();
    const duplicate=structuredClone(roster);duplicate[1].id=duplicate[0].id;expect(()=>validateSectBattleRoster(duplicate)).toThrow();
    const seats=structuredClone(roster);seats[1].rank=1;expect(()=>validateSectBattleRoster(seats)).toThrow();
  });
});
