import { describe, expect, it, vi } from 'vitest';
import { appearanceKey, appearanceOf, readAppearance, DEFAULT_APPEARANCE } from '../interfaces/appearance';
import { appearanceForIndex } from '../data/appearances';
import { createNewLife, migrateLifeState } from '../core/life/gameState';
import { lifeGameStateSchema } from '../interfaces/lifeEngine';
import { createCharacterSlice } from '../src/store/slices/characterSlice';
import type { LifeStore } from '../src/store/lifeStore';
import { getRngState, initRng } from '../core/random';
import { simulateOnlineBattle } from '../core/online/combat';
import { snapshotContestantFromLife } from '../core/life/huashan';
import { simulateSectBattle } from '../core/online/sectBattle';
import { sectBattleFixture } from '../src/prototypes/sectBattle/fixtures';

function life() { const state=createNewLife({seed:4242,skipCoach:true});state.pending=null;return state; }
const chosen={head:'silver',outfit:'scholar',tone:'jade'} as const;

describe('人物造型資料與跨系統快照',()=>{
  it('test_appearance_舊檔及失效素材代號固定承接_不引入任意網址',()=>{
    const old=life();delete old.character.appearance;const restored=migrateLifeState(lifeGameStateSchema.parse(JSON.parse(JSON.stringify(old))));
    expect(appearanceOf(restored.character)).toEqual(DEFAULT_APPEARANCE);
    expect(appearanceOf({gender:'female'}).head).toBe('ponytail');
    expect(readAppearance({head:'https://unknown/face.png',outfit:'missing',tone:'red',url:'bad'})).toEqual(DEFAULT_APPEARANCE);
    const invalid=structuredClone(old);(invalid.character as unknown as {appearance:unknown}).appearance='bad';
    expect(()=>lifeGameStateSchema.parse(invalid)).not.toThrow();
  });
  it('test_appearance_建立及存檔來回_人物能力與隨機狀態不變',()=>{
    const plain=createNewLife({seed:42,skipCoach:true}),styled=createNewLife({seed:42,skipCoach:true,appearance:chosen});
    expect(styled.character.appearance).toEqual(chosen);delete styled.character.appearance;expect(styled).toEqual(plain);
    plain.character.appearance={...chosen};const restored=migrateLifeState(lifeGameStateSchema.parse(JSON.parse(JSON.stringify(plain))));
    expect(restored.character.appearance).toEqual(chosen);
  });
  it('test_appearance_確認只保存外觀_不收費不換裝不推進或消耗RNG_重按不重寫',()=>{
    let current={state:life(),combatReplay:null} as LifeStore;const save=vi.fn();
    const actions=createCharacterSlice(patch=>{current={...current,...patch};},()=>current,save);
    const before=structuredClone(current.state!);initRng(96);const rng=getRngState();
    expect(actions.setAppearance(chosen)).toBe(true);before.character.appearance={...chosen};
    expect(current.state).toEqual(before);expect(getRngState()).toBe(rng);expect(save).toHaveBeenCalledWith(current.state,true);
    expect(actions.setAppearance({...chosen})).toBe(true);expect(save).toHaveBeenCalledTimes(1);
    expect(actions.setAppearance({...chosen,head:'unknown'} as never)).toBe(false);expect(save).toHaveBeenCalledTimes(1);
  });
  it('test_appearance_交手中死亡或非遊玩狀態_拒絕更換也不保存',()=>{
    for(const mode of ['combat','replay','dead','phase'] as const){
      const state=life();if(mode==='combat')state.pendingCombat={} as never;if(mode==='dead')state.character.alive=false;if(mode==='phase')state.phase='summary';
      let current={state,combatReplay:mode==='replay'?{}:null} as LifeStore;const save=vi.fn(),before=structuredClone(state);
      const actions=createCharacterSlice(patch=>{current={...current,...patch};},()=>current,save);
      expect(actions.setAppearance(chosen)).toBe(false);expect(current.state).toEqual(before);expect(save).not.toHaveBeenCalled();
    }
  });
  it('test_appearance_多人正反戰報及華山保存開戰造型_之後換衫不改舊報或傷害',()=>{
    const a=life(),b=life();a.character.appearance={...chosen};b.character.appearance=appearanceForIndex(5);
    const report=simulateOnlineBattle(a.character,b.character,443),contestant=snapshotContestantFromLife(a);
    expect(report.forward.playerAppearance).toEqual(chosen);expect(report.reverse.foeAppearance).toEqual(chosen);
    expect(report.reverse.playerAppearance).toEqual(b.character.appearance);expect(contestant.appearance).toEqual(chosen);
    a.character.appearance.head='bun';b.character.appearance.tone='cinnabar';
    expect(report.forward.playerAppearance).toEqual(chosen);expect(contestant.appearance).toEqual(chosen);
    const after=simulateOnlineBattle(a.character,b.character,443);expect(after.forward.rounds).toEqual(report.forward.rounds);expect(after.winner).toBe(report.winner);
  });
  it('test_appearance_同場二十人各有組合_同一地線_衣著不影響勝負事件或RNG',()=>{
    const roster=sectBattleFixture(),first=simulateSectBattle(roster,5707),before=JSON.stringify(roster);initRng(555);const rng=getRngState();
    expect(new Set(first.frames[0].figures.map(u=>appearanceKey(u.appearance))).size).toBe(20);
    for(const frame of first.frames)expect(new Set(frame.figures.map(u=>u.y)).size).toBe(1);
    const restyled=structuredClone(roster);restyled.forEach(u=>{u.state.character.appearance={...chosen};});
    const second=simulateSectBattle(restyled,5707);expect(second.events).toEqual(first.events);expect(second.winner).toBe(first.winner);expect(second.remaining).toEqual(first.remaining);
    expect(JSON.stringify(roster)).toBe(before);expect(getRngState()).toBe(rng);
  });
});
