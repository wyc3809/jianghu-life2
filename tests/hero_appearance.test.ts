import { describe, expect, it, vi } from 'vitest';
import { heroAppearanceFrame, loadHeroAppearance } from '../src/spar/heroAppearance';
import { SparStage } from '../src/spar/engine';
import { WEAPON_SPRITES } from '../src/spar/rig';

const base = { moving: false, gait: 0, idle: 0, hurt: 9, down: null as number | null, reduced: false };
function actor() {
  const draws: unknown[][] = [];
  const ctx = new Proxy({ drawImage: (...a: unknown[]) => draws.push(a) }, { get: (t, p) => p in t ? t[p as keyof typeof t] : () => ({}) });
  const legacy = { width: 616, height: 788, marker: '舊黑影' } as unknown as HTMLImageElement;
  const detail = { width: 2048, height: 1056, marker: '細節全狀態' } as unknown as HTMLImageElement;
  const atlas = { width: 4096, height: 352, marker: '細節武學' } as unknown as HTMLImageElement;
  const weapon = { width: 150, height: 700, marker: '裝備劍' } as unknown as HTMLImageElement;
  const stage = new SparStage({ canvas: { getContext: () => ctx } as unknown as HTMLCanvasElement,
    images: { heroIdle: legacy, heroAttack: legacy, enemies: [legacy], splash: legacy, heroAppearance: { image: detail, guard: false, basic: { image: atlas, guard: false } } } });
  stage.resize(390, 240, 1); stage.setWeapon(WEAPON_SPRITES.sword, weapon);
  const raw = stage as unknown as { heroMoving: boolean; heroHitT: number; heroDownT: number | null; attackT: number | null; martialId: string | null; supportPose: { id: string; t: number } | null;
    drawWarrior(g: { k: number; groundY: number; heroX: number }): void };
  return { stage, raw, draws, legacy, detail, atlas, weapon, draw: () => raw.drawWarrior({ k: .1, groundY: 220, heroX: 100 }) };
}

describe('主角全狀態細節人物', () => {
  it('test_hero_appearance_步態受擊倒地及減少動態_取正確幀唔跳黑影', () => {
    expect([0,.25,.5,.75].map(gait => heroAppearanceFrame({ ...base, moving: true, gait }))).toEqual([0,1,2,3]);
    expect(heroAppearanceFrame(base)).toBe(4);
    expect(heroAppearanceFrame({ ...base, idle: 1.5 })).toBe(5);
    expect(heroAppearanceFrame({ ...base, hurt: .02 })).toBe(6);
    expect(heroAppearanceFrame({ ...base, hurt: .15 })).toBe(7);
    expect([0,.2,.45,.7].map(down => heroAppearanceFrame({ ...base, down }))).toEqual([8,9,10,11]);
    expect(heroAppearanceFrame({ ...base, moving: true, reduced: true })).toBe(4);
    expect(heroAppearanceFrame({ ...base, down: .1, reduced: true })).toBe(11);
  });
  it('test_hero_appearance_待機行路受擊倒地基本攻擊_全部畫細節人物唔疊裝備劍', () => {
    const a = actor();
    for (const state of [ {}, { heroMoving: true }, { heroHitT: .1 }, { heroDownT: .2 }, { heroDownT: .8 }, { attackT: .36 } ]) {
      Object.assign(a.raw, { heroMoving: false, heroHitT: 9, heroDownT: null, attackT: null }, state);
      a.draws.length = 0; a.draw();
      expect(a.draws).toHaveLength(1);
      expect([a.detail,a.atlas]).toContain(a.draws[0]![0]);
      expect(a.draws.some(d => d[0] === a.legacy || d[0] === a.weapon)).toBe(false);
    }
  });
  it('test_hero_appearance_出招回待機及換裝_同門細節姿勢保持正確持武', () => {
    const a = actor();
    a.stage.setMartialAssets(new Map([['art_river_fist',{ atlas: a.atlas, guard: false }]]));
    a.raw.heroMoving = false; a.raw.heroHitT = 9; a.raw.martialId = 'art_river_fist'; a.raw.attackT = .4;
    a.draw(); expect(a.draws[0]![0]).toBe(a.atlas);
    a.draws.length=0; a.raw.attackT=null; a.draw();
    expect(a.draws[0]![0]).toBe(a.atlas); expect(a.draws[0]![1]).toBe(0);
    a.stage.setMartialAssets(new Map()); a.draws.length=0; a.draw();
    expect(a.draws[0]![0]).toBe(a.detail);
  });
  it('test_hero_appearance_倒地優先於出招與內功_唔再切返舊黑影倒地', () => {
    const a = actor(); a.stage.setMartialAssets(new Map([['art_river_fist',{ atlas:a.atlas,guard:false }]]));
    Object.assign(a.raw,{ heroDownT:.8,attackT:.4,martialId:'art_river_fist',supportPose:{id:'art_iron_body',t:.1} });
    a.draw(); expect(a.draws[0]![0]).toBe(a.detail);
    expect(a.draws[0]!.slice(1,3)).toEqual([1536,704]);
  });
  it('test_hero_appearance_換招後行路受擊倒地_保持同一細比例唔跟上一招放大', () => {
    const a = actor();
    for (const id of ['art_river_fist','art_rain_sword','art_iron_body','pr_wind_thread']) {
      a.stage.setMartialAssets(new Map([[id,{atlas:a.atlas,guard:false}]]));
      for (const state of [{heroMoving:true},{heroHitT:.1},{heroDownT:.2},{heroDownT:.8}]) {
        Object.assign(a.raw,{martialId:id,attackT:null,heroMoving:false,heroHitT:9,heroDownT:null},state);
        a.draws.length=0;a.draw();
        expect(a.draws[0]![0]).toBe(a.detail);
        expect(a.draws[0]![7]).toBeCloseTo(512 * 390 * .23 / 218 * .65,8);
        expect(a.draws[0]![8]).toBeCloseTo(352 * 390 * .23 / 218 * .65,8);
      }
    }
  });
  it('test_hero_appearance_基本攻擊同武學及待機_同圖保持固定細比例', () => {
    const a=actor();Object.assign(a.raw,{heroMoving:false,heroHitT:9,heroDownT:null,attackT:.36,martialId:null});
    a.draw();const basicSize=a.draws[0]!.slice(-2);
    expect(Number(basicSize[1])).toBeLessThan(90);
    a.stage.setMartialAssets(new Map([['art_river_fist',{atlas:a.atlas,guard:false}]]));
    a.raw.martialId='art_river_fist';a.draws.length=0;a.draw();
    expect(a.draws[0]!.slice(-2)).toEqual(basicSize);
    a.raw.attackT=null;a.draws.length=0;a.draw();
    expect(a.draws[0]!.slice(-2)).toEqual(basicSize);
  });
  it('test_hero_appearance_網絡後備用另一套人物_按真正圖集校準唔按招式身份', () => {
    const a=actor();Object.assign(a.raw,{heroMoving:false,heroHitT:9,heroDownT:null,attackT:.4,martialId:'art_rain_sword'});
    a.stage.setMartialAssets(new Map([['art_rain_sword',{atlas:a.atlas,guard:true,scaleId:'art_river_fist'}]]));
    a.draw();const fallbackSize=a.draws[0]!.slice(-2);
    a.raw.martialId='art_river_fist';a.stage.setMartialAssets(new Map([['art_river_fist',{atlas:a.atlas,guard:true}]]));
    a.draws.length=0;a.draw();expect(a.draws[0]!.slice(-2)).toEqual(fallbackSize);
  });
  it('test_hero_appearance_演武轉全屏再縮返_同闊度人物尺寸不變', () => {
    const a=actor();Object.assign(a.raw,{heroMoving:true,heroHitT:9,heroDownT:null,attackT:null});
    vi.stubGlobal('window',{innerWidth:390});
    try {
      a.draw();const size=a.draws[0]!.slice(-2);
      for(const [width,height] of [[390,844],[390,568],[360,240]]){
        a.stage.setPresentation(height===240?'stage':'battle');a.stage.resize(width!,height!,2);
        a.draws.length=0;a.draw();expect(a.draws[0]!.slice(-2)).toEqual(size);
      }
    } finally {vi.unstubAllGlobals();}
  });
  it('test_hero_appearance_全部網絡圖失敗_先解碼嵌入細節後備唔返回黑影', async () => {
    const urls:string[]=[];
    class FakeImage {
      onload:(()=>void)|null=null;onerror:(()=>void)|null=null;
      set src(url:string){ urls.push(url);queueMicrotask(()=>url.startsWith('data:')?this.onload?.():this.onerror?.()); }
    }
    vi.stubGlobal('Image',FakeImage);
    try {
      const images=await loadHeroAppearance();
      expect(images.guard).toBe(true);expect(images.basic?.guard).toBe(true);
      expect(urls.filter(u=>u.startsWith('data:'))).toHaveLength(2);
      expect(urls.some(u=>u.includes('/sil/'))).toBe(false);
    } finally {vi.unstubAllGlobals();}
  });
});
