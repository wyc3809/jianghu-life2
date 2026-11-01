import{describe,it,expect}from'vitest';
import{sectBattleFixture}from'../src/prototypes/sectBattle/fixtures';
import{simulateSectBattle}from'../core/online/sectBattle';
import{packSectReplay,unpackSectReplay}from'../core/online/sectTape';
import{sectReplayFingerprint}from'../core/online/sectWar';
const replay=simulateSectBattle(sectBattleFixture(),5707,true,true);
function postgres(value:unknown):unknown{if(Array.isArray(value))return value.map(postgres);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,postgres(v)]));return value;}
describe('伺服器時間軸',()=>{
 it('test_sect_tape_保存及解碼_保留全部氣血內力動作與事件不再重算',()=>{
  const tape=packSectReplay(replay),decoded=unpackSectReplay(tape);
  expect(decoded.winner).toBe(replay.winner);expect(decoded.remaining).toEqual(replay.remaining);expect(decoded.events).toEqual(replay.events);expect(decoded.frames).toHaveLength(replay.frames.length);
  const exact=(r:typeof replay)=>r.frames.map(f=>f.figures.map(u=>[u.hp,u.qi,u.pose,u.face,u.artId,u.target]));expect(exact(decoded)).toEqual(exact(replay));
  for(const index of [0,1,Math.floor(replay.frames.length/2),replay.frames.length-1])for(let i=0;i<20;i++){expect(Math.abs(decoded.frames[index].figures[i].x-replay.frames[index].figures[i].x)).toBeLessThanOrEqual(1/64);expect(Math.abs(decoded.frames[index].figures[i].poseAt-replay.frames[index].figures[i].poseAt)).toBeLessThan(.006);}
  expect(JSON.stringify(tape).length).toBeLessThan(JSON.stringify(replay).length/3);
 });
 it('test_sect_tape_Postgres調整JSON物件鍵次序_瀏覽器仍讀相同戰果校驗',()=>{
  const tape=postgres(JSON.parse(JSON.stringify(packSectReplay(replay))))as ReturnType<typeof packSectReplay>;const decoded=unpackSectReplay(tape);expect(sectReplayFingerprint(decoded)).toBe(sectReplayFingerprint(replay));
 });
 it('test_sect_tape_損壞資料或不符版本_拒絕畫假結果',()=>{
  const tape=packSectReplay(replay);expect(()=>unpackSectReplay({...tape,data:tape.data.slice(0,-4)})).toThrow('不完整');expect(()=>unpackSectReplay({...tape,version:2}as unknown as typeof tape)).toThrow('版本');
 });
});
