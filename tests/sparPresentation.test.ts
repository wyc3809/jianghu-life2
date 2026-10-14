import { describe, it, expect } from 'vitest';
import { advanceGait, gaitFrame, collapseSample, crossedGroundContact, SPAR_PRESENTATION, type SparArtImages } from '../src/spar/presentation';
import { SparStage } from '../src/spar/engine';
import fs from 'node:fs';
import path from 'node:path';

describe('演武地面／步行／落地', () => {
  it('停步同負位移唔推腳步；同一距離唔受幀率影響', () => {
    expect(advanceGait(.3, 0, 218)).toBe(.3);
    expect(advanceGait(.3, -3, 218)).toBe(.3);
    const once = advanceGait(0, 26, 218);
    const split = Array.from({ length: 60 }).reduce<number>(p => advanceGait(p, 26 / 60, 218), 0);
    expect(split).toBeCloseTo(once, 10);
    expect(advanceGait(0, 52, 436)).toBeCloseTo(once);
    expect([0, .25, .5, .75].map(gaitFrame)).toEqual([0, 1, 2, 3]);
  });
  it('敵人落地之後先淡出，低幀率跨過接觸點只發一次塵', () => {
    expect(collapseSample(.29).alpha).toBe(1);
    expect(collapseSample(.4)).toMatchObject({ frame: 3, alpha: 1, contact: true });
    expect(collapseSample(.62).alpha).toBe(0);
    expect(crossedGroundContact(.27, .32)).toBe(true);
    expect(crossedGroundContact(.32, .37)).toBe(false);
  });
  it('角色、DOM血條及四季石台用同一CSS地面座標', () => {
    const ctx = {};
    const stage = new SparStage({canvas:{getContext:()=>ctx} as unknown as HTMLCanvasElement,images:{heroIdle:{} as HTMLImageElement,heroAttack:{} as HTMLImageElement,enemies:[],splash:{} as HTMLImageElement}});
    stage.setArt({ deaths:new Map() } as SparArtImages);
    for (const height of [218,436]) {
      stage.resize(360,height,2);
      const anchor=stage.getAnchors();
      expect(anchor.heroHeadY + height*.26*.98).toBeCloseTo(height*SPAR_PRESENTATION.ground);
    }
  });
  it('25款敵人全部有4個獨立倒地位圖，唔遺漏首領／精英', () => {
    const atlases=JSON.parse(fs.readFileSync(path.resolve('design/art/spar-commercial/atlas.json'),'utf8')) as {characters:string[]}[];
    const ids=atlases.flatMap(a=>a.characters);
    expect(new Set(ids).size).toBe(25);
    for(const id of ids)for(let i=0;i<4;i++)expect(fs.existsSync(path.resolve(`public/ink/spar/commercial/enemy-${id}-down-${i}.webp`))).toBe(true);
  });
  it('位圖倒地保持原0.62秒結算一次，落地塵亦只發一次', () => {
    let settles=0;
    const stage=new SparStage({canvas:{getContext:()=>({})} as unknown as HTMLCanvasElement,images:{heroIdle:{} as HTMLImageElement,heroAttack:{} as HTMLImageElement,enemies:[],splash:{} as HTMLImageElement},combat:{nextFoe:()=>({boss:false,look:0}),foeDefeated:()=>{settles++;return {coins:0};},heroStrike:()=>({dmg:0,crit:false,heal:0,killed:false}),foeStrike:()=>({dmg:0,heroDown:false}),heroRecovered:()=>{}}});
    stage.resize(360,218,2);stage.settleIntro();
    const view=stage as unknown as {enemies:{state:string;t:number;def:{part:{src:string}}}[];pendingDefeat:boolean;dust:unknown[]};
    stage.setArt({deaths:new Map([[view.enemies[0]!.def.part.src,[]]])} as unknown as SparArtImages);
    view.enemies[0]!.state='dead';view.enemies[0]!.t=.27;view.pendingDefeat=true;
    stage.update(.05);expect(view.dust).toHaveLength(1);expect(settles).toBe(0);
    stage.update(.05);expect(view.dust).toHaveLength(1);
    for(let i=0;i<8;i++)stage.update(.05);
    expect(settles).toBe(1);
    for(let i=0;i<8;i++)stage.update(.05);
    expect(settles).toBe(1);
  });
});
