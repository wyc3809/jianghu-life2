import { describe, expect, it, vi } from 'vitest';
import { SparStage } from '../src/spar/engine';
import { ENEMY_POOL } from '../src/spar/rig';
import * as strips from '../src/spar/stripRig';
import metrics from '../src/spar/foeFigureMetrics.json';

function setup() {
  const draws:unknown[][]=[];
  const ctx=new Proxy({drawImage:(...args:unknown[])=>draws.push(args)}, {get:(t,p)=>p in t?t[p as keyof typeof t]:()=>({})});
  const image={width:616,height:788} as HTMLImageElement;
  const stage=new SparStage({canvas:{getContext:()=>ctx} as unknown as HTMLCanvasElement,
    images:{heroIdle:image,heroAttack:image,enemies:[image],splash:image,heroAppearance:{image,guard:false}}});
  stage.resize(390,160,2);
  const raw=stage as unknown as { drawEnemy(g:unknown,e:unknown):void;enemyKe(e:unknown):number;geom():unknown };
  return {stage,raw,image,draws};
}
const enemy=(def=ENEMY_POOL[0]!,scaleMul=1)=>({def,scaleMul,boss:scaleMul>1,tier:'minion',state:'hold',bob:0,hitT:9,lungeT:null,x:260,accent:null,rig:{offsetAt:()=>0}});

describe('敵我同一人物身高',()=>{
  it('test_foe_scale_25款原圖留白不同_真正繪圖仍同主角身高及接地',()=>{
    const a=setup(),draw=vi.spyOn(strips,'drawWarpedSprite').mockImplementation(()=>{});
    try {
      for(const def of ENEMY_POOL){
        draw.mockClear();a.raw.drawEnemy(a.raw.geom(),enemy(def,1.3));
        const sprite=draw.mock.calls[0]![2];
        const key=def.part.src.split('/').pop()!.replace(/^enemy-|\.webp$/g,'') as keyof typeof metrics;
        const m=metrics[key];
        expect(m.bodyHeight*def.part.h/m.sourceHeight*sprite.k).toBeCloseTo(390*.23*.65*204/218,8);
        expect((sprite.dy+m.footY*def.part.h/m.sourceHeight)*sprite.k).toBeCloseTo(0,8);
      }
      expect(ENEMY_POOL).toHaveLength(25);
    }finally{draw.mockRestore();}
  });
  it('test_foe_scale_短演武台轉全屏_身高固定但原有企位倍率保留',()=>{
    const a=setup(),e=enemy(),draw=vi.spyOn(strips,'drawWarpedSprite').mockImplementation(()=>{});
    try {
      a.raw.drawEnemy(a.raw.geom(),e);const small=draw.mock.calls[0]![2].k,physical=a.raw.enemyKe(e);
      a.stage.setPresentation('battle');a.stage.resize(390,700,2);draw.mockClear();
      a.raw.drawEnemy(a.raw.geom(),e);
      expect(draw.mock.calls[0]![2].k).toBe(small);
      expect(a.raw.enemyKe(e)).not.toBe(physical);
    }finally{draw.mockRestore();}
  });
  it('test_foe_scale_倒地四格_共用固定比例唔逐格放大',()=>{
    const a=setup(),e={...enemy(),state:'dead',t:0};
    a.stage.setArt({deaths:new Map([[e.def.part.src,[a.image,a.image,a.image,a.image]]])} as never);
    for(const t of [0,.12,.28,.4]){e.t=t;a.raw.drawEnemy(a.raw.geom(),e);}
    expect(a.draws).toHaveLength(4);
    expect(new Set(a.draws.map(d=>d.at(-1))).size).toBe(1);
  });
});
