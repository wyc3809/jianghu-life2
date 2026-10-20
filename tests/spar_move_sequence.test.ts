import { describe, expect, it } from 'vitest';
import { createNewLife } from '../core/life/gameState';
import { sparMoveAt } from '../src/spar/artCycle';

function character() {
  const c=createNewLife({seed:42,skipCoach:true}).character;
  c.skills=['art_river_fist','art_rain_sword','art_iron_body'];
  c.equippedArts=['art_river_fist',null,null,null,null];
  c.supportArts={internal:'art_iron_body',qinggong:null};
  c.volumes={art_river_fist:[1,6],art_rain_sword:[1,3,7]};
  return c;
}

describe('演武逐招呈現',()=>{
  it('test_spar_sequence_只得卷一同卷六_逐次顯示真招名唔出未得卷',()=>{
    const c=character(),before=JSON.stringify(c);
    const moves=Array.from({length:4},(_,n)=>sparMoveAt(c,n));
    expect(moves.map(m=>m?.volume)).toEqual([1,6,1,6]);
    expect(moves.map(m=>m?.moveName)).toEqual(['長河崩拳','大河落日','長河崩拳','大河落日']);
    expect(JSON.stringify(c)).toBe(before);
  });
  it('test_spar_sequence_兩門外功_維持逐門輪替並各自輪播已得卷',()=>{
    const c=character();c.equippedArts![1]='art_rain_sword';
    const moves=Array.from({length:6},(_,n)=>sparMoveAt(c,n));
    expect(moves.map(m=>m?.artId)).toEqual(['art_river_fist','art_rain_sword','art_river_fist','art_rain_sword','art_river_fist','art_rain_sword']);
    expect(moves.map(m=>m?.volume)).toEqual([1,1,6,3,1,7]);
  });
  it('test_spar_sequence_舊存檔及卸下外功_唔虛構卷數或將內功當外功',()=>{
    const c=character();delete c.volumes;
    expect(sparMoveAt(c,4)?.volume).toBe(1);
    c.equippedArts=[null,null,null,null,null];
    expect(sparMoveAt(c,0)).toBeNull();
  });
});
