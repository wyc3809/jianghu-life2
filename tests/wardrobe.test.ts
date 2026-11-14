import { describe,it,expect,vi } from 'vitest';
import { COSTUME_IDS,FASHION_COSTUME_IDS,UNIFORM_COSTUME_IDS,canWearCostume } from '../interfaces/costumes';
import { appearanceOf,appearanceKey,readAppearance } from '../interfaces/appearance';
import { SECT_RANKS,SECT_CONTENT } from '../data/content/packs';
import { createNewLife,migrateLifeState } from '../core/life/gameState';
import { lifeGameStateSchema } from '../interfaces/lifeEngine';
import { createCharacterSlice } from '../src/store/slices/characterSlice';
import type { LifeStore } from '../src/store/lifeStore';
import { initRng,getRngState } from '../core/random';

const look={head:'silver',outfit:'traveller',tone:'jade'} as const;
function life(){const s=createNewLife({seed:9642,skipCoach:true});s.pending=null;s.character.sectId='sect_qingyun';s.character.sectStanding=2;return s;}
describe('門派服及免費時裝',()=>{
  it('test_wardrobe_真身份及已達職位_不可跨派或越級但可穿較低階制服',()=>{
    expect(UNIFORM_COSTUME_IDS).toHaveLength(SECT_RANKS.length);
    for(const sect of SECT_CONTENT)for(let standing=0;standing<SECT_RANKS.length;standing++)for(const [rank,id] of UNIFORM_COSTUME_IDS.entries()){
      expect(canWearCostume({sectId:sect.id,sectStanding:standing},id)).toBe(sect.id==='sect_qingyun'&&rank<=standing);
    }
    for(const invalid of [NaN,Infinity,-1,1.5,8,99])expect(canWearCostume({sectId:'sect_qingyun',sectStanding:invalid},UNIFORM_COSTUME_IDS[0])).toBe(false);
    expect(canWearCostume({sectId:null,sectStanding:7},UNIFORM_COSTUME_IDS[7])).toBe(false);
  });
  it('test_wardrobe_免費時裝_無門派也能穿且未知網址不獲資格',()=>{
    for(const id of FASHION_COSTUME_IDS)expect(canWearCostume({sectId:null},id)).toBe(true);
    expect(canWearCostume({sectId:'sect_qingyun',sectStanding:7},'https://unknown/robe.png')).toBe(false);
  });
  it('test_wardrobe_離派轉派或降職_顯示回退已選時裝且不改真身份',()=>{
    const character={...life().character,appearance:{...look,costume:'uniform-qingyun-2',fashion:'fashion-night'} as const};
    expect(appearanceOf(character).costume).toBe('uniform-qingyun-2');
    for(const identity of [{sectId:null,sectStanding:2},{sectId:'sect_tiandao',sectStanding:7},{sectId:'sect_qingyun',sectStanding:1}]){
      const c={...character,...identity},snapshot=structuredClone(c);
      expect(appearanceOf(c).costume).toBe('fashion-night');expect(c).toEqual(snapshot);
    }
    expect(appearanceOf({...character,sectId:null,appearance:{...look,costume:'uniform-qingyun-2'}}).costume).toBeUndefined();
  });
  it('test_wardrobe_確認與偽造指令_只保存外觀不花資源不改裝備或推進RNG',()=>{
    let current={state:life(),combatReplay:null} as LifeStore;const save=vi.fn();
    const actions=createCharacterSlice(p=>{current={...current,...p};},()=>current,save);
    const before=structuredClone(current.state!),chosen={...look,costume:'uniform-qingyun-2',fashion:'fashion-feast'} as const;
    initRng(24);const rng=getRngState();
    expect(actions.setAppearance({...chosen,costume:'uniform-qingyun-7'})).toBe(false);
    expect(actions.setAppearance({...chosen,costume:'missing'} as never)).toBe(false);
    expect(actions.setAppearance({...chosen,fashion:'missing'} as never)).toBe(false);
    expect(current.state).toEqual(before);expect(save).not.toHaveBeenCalled();
    expect(actions.setAppearance(chosen)).toBe(true);before.character.appearance=chosen;
    expect(current.state).toEqual(before);expect(getRngState()).toBe(rng);expect(save).toHaveBeenCalledTimes(1);
    expect(actions.setAppearance(chosen)).toBe(true);expect(save).toHaveBeenCalledTimes(1);
    current={...current,state:{...current.state!,character:{...current.state!.character,sectId:'sect_tiandao'}}};expect(actions.setAppearance(chosen)).toBe(false);
  });
  it('test_wardrobe_舊檔及新服飾存檔來回_保留原常服與最近時裝',()=>{
    const old=life();old.character.appearance=look;
    expect(migrateLifeState(lifeGameStateSchema.parse(JSON.parse(JSON.stringify(old)))).character.appearance).toEqual(look);
    for(const costume of COSTUME_IDS){
      const state=life();state.character.appearance={...look,costume,fashion:'fashion-snow'};
      const restored=migrateLifeState(lifeGameStateSchema.parse(JSON.parse(JSON.stringify(state))));
      expect(restored.character.appearance).toEqual(state.character.appearance);
    }
    expect(appearanceKey(look)).toBe('silver:traveller:jade');
    expect(appearanceKey({...look,costume:'fashion-snow'})).not.toBe(appearanceKey(look));
    expect(readAppearance({...look,costume:'https://bad',fashion:'https://bad'}).costume).toBeUndefined();
  });
  it('test_wardrobe_先穿時裝再穿制服_自動保留最近時裝以便離派回退',()=>{
    let current={state:life(),combatReplay:null} as LifeStore;
    const actions=createCharacterSlice(p=>{current={...current,...p};},()=>current,vi.fn());
    expect(actions.setAppearance({...look,costume:'fashion-night'})).toBe(true);
    expect(current.state!.character.appearance?.fashion).toBe('fashion-night');
    expect(actions.setAppearance({...look,costume:'uniform-qingyun-1'})).toBe(true);
    expect(current.state!.character.appearance?.fashion).toBe('fashion-night');
    expect(appearanceOf({...current.state!.character,sectId:null}).costume).toBe('fashion-night');
  });
});
