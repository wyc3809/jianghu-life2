import { describe, expect, it } from 'vitest';
import { createNewLife } from '../core/life/gameState';
import { emptyAncestry } from '../core/life/ancestry';
import { SKILL_DEFS, getSkillDef } from '../data/skills/catalog';
import { martialArtView, martialCandidates } from '../src/ui/martialView';
import { INTERNAL_ART_SLOT, QINGGONG_ART_SLOT } from '../core/life/martialLoadout';

describe('武學配搭唯讀資料', () => {
  it('test_martial_view_已學已得未得分開_不假裝收藏已習得', () => {
    const c = createNewLife({seed:42}).character, meta = emptyAncestry();
    c.skills = ['art_river_fist']; c.volumes = {art_river_fist:[1,3]};
    meta.manuals = {art_river_fist:{stars:0,copies:0,vols:[1,3,7]}};
    const before=structuredClone({c,meta});
    const view=martialArtView(c,meta,'art_river_fist')!;
    expect(view.volumes.map(v=>v.status)).toEqual(['已學','未得','已學','未得','未得','未得','已得']);
    expect(view.usable).toBe(2);expect(view.collected).toBe(3);
    expect({c,meta}).toEqual(before);
  });
  it('test_martial_view_七卷成本_只讀整門起手成本', () => {
    const c=createNewLife({seed:42}).character,meta=emptyAncestry();
    c.skills=['art_river_fist'];c.volumes={art_river_fist:[1]};
    const one=martialArtView(c,meta,'art_river_fist')!;
    c.volumes.art_river_fist=[1,2,3,4,5,6,7];
    const seven=martialArtView(c,meta,'art_river_fist')!;
    expect(seven.cost).toBe(one.cost);expect(seven.cost).toBe(getSkillDef('art_river_fist')!.move!.qiCost);
  });
  it('test_martial_view_舊卷紀錄_沿用核心相容規則', () => {
    const c=createNewLife({seed:42}).character,meta=emptyAncestry();
    c.skills=['art_river_fist'];delete c.volumes;
    meta.manuals={art_silk_hand:{stars:0,copies:0}};
    expect(martialArtView(c,meta,'art_river_fist')!.usable).toBe(1);
    const stored=martialArtView(c,meta,'art_silk_hand')!;
    expect(stored.learned).toBe(false);expect(stored.usable).toBe(0);expect(stored.collected).toBe(7);
  });
  it('test_martial_view_只列真持有同類_標示別格已裝備而不寫回', () => {
    const c=createNewLife({seed:42}).character,meta=emptyAncestry();
    const internal=Object.values(SKILL_DEFS).find(d=>d.kind==='internal')!.id;
    const qinggong=Object.values(SKILL_DEFS).find(d=>d.kind==='qinggong')!.id;
    c.skills=['art_river_fist',internal,qinggong];c.equippedArts=['art_river_fist',null,null,null,null];c.supportArts={internal,qinggong};
    meta.manuals={art_silk_hand:{stars:0,copies:0,vols:[7]}};
    const before=structuredClone({c,meta});
    const external=martialCandidates(c,meta,1);
    expect(external.map(v=>v.id).sort()).toEqual(['art_river_fist','art_silk_hand']);
    expect(external.find(v=>v.id==='art_river_fist')!.blocked).toBe(true);
    expect(martialCandidates(c,meta,INTERNAL_ART_SLOT).map(v=>v.id)).toEqual([internal]);
    expect(martialCandidates(c,meta,QINGGONG_ART_SLOT).map(v=>v.id)).toEqual([qinggong]);
    expect({c,meta}).toEqual(before);
  });
  it('test_martial_view_珍本身份_不由熟練或新得狀態改變', () => {
    const c=createNewLife({seed:42}).character,meta=emptyAncestry();
    const premium=Object.values(SKILL_DEFS).find(d=>d.kind==='external'&&d.premium)!.id;
    c.skills=['art_river_fist',premium];c.skillRanks.art_river_fist=3;
    expect(martialArtView(c,meta,'art_river_fist')!.premium).toBe(false);
    expect(martialCandidates(c,meta,0,'premium').map(v=>v.id)).toEqual([premium]);
  });
});
