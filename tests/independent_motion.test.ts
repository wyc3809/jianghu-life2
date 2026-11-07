import { describe,it,expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { SKILL_DEFS } from '../data/skills/catalog';
import { ART_CHOREOS } from '../src/fx/art/recipes';
import { INDEPENDENT_INDEX,independentFrame,motionRequest,opponentMotionTime } from '../src/appearance/independent/frames';
import { independentProp } from '../src/appearance/independent/assets';
import { whipPoints } from '../src/appearance/independent/held';
import type { MotionClip } from '../src/appearance/independent/types';
const json=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const clips=json('design/art/independent-animation/compiled-clips.json');
const motions=json('design/art/independent-animation/rig/animations.json');
const hash=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
describe('全部武學的所選造型獨立動作',()=>{
 it('test_independent_motion_103門真目錄_有不同肢體軌跡而非換色粒子或改速',()=>{
  const hashes=new Set<string>();
  for(const d of Object.values(SKILL_DEFS)){
   const c=clips[d.id];expect(c, d.id).toBeDefined();expect(c.kind).toBe(d.kind);
   expect(INDEPENDENT_INDEX.clips[d.id].duration).toBe(c.duration);hashes.add(hash(motions[d.id].bones));
   const old=ART_CHOREOS.find(x=>x.artId===d.id);
   expect(c.duration).toBe(old?.dur??(d.kind==='external'?.72:1.1));
   expect(c.contacts).toEqual(old?old.events.filter(x=>x.kind==='hit').map(x=>x.t):d.kind==='external'?[.36]:[]);
   for(const t of c.contacts)expect(c.sampleTimes).toContain(t);
  }
  expect(hashes.size).toBe(103);
 });
 it('test_independent_motion_真武學身份及原時計_不將他門通用拳當命中',()=>{
  for(const d of Object.values(SKILL_DEFS)){
   const c=clips[d.id];expect(motionRequest({x:0,y:0,height:80,pose:'attack',martialId:d.id,motionTime:.123,family:c.family})).toEqual({id:d.id,time:.123,loop:false});
   if(c.contacts.length){expect(opponentMotionTime(d.id,.3,.3,.72)).toBe(c.contacts[0]);expect(opponentMotionTime(d.id,99,.3,.72)).toBe(c.duration);}
  }
  expect(motionRequest({x:0,y:0,height:80,pose:'attack',martialId:'missing',family:'fist'}).id).toBe('_basic_fist');
 });
 it('test_independent_motion_有限數值與固定比例_暫停掉幀減少動態只取幀不派事件',()=>{
  const c={duration:1,contacts:[.4],state:undefined,frames:[{t:0},{t:.4},{t:1}]}as MotionClip;
  expect(independentFrame(c,NaN).index).toBe(0);expect(independentFrame(c,-9).index).toBe(0);expect(independentFrame(c,999).index).toBe(2);
  expect(independentFrame(c,.4).index).toBe(1);expect(independentFrame(c,.7,false,true).index).toBe(1);expect(independentFrame(c,1.2,true).index).toBe(0);
 });
 it('test_independent_motion_鉤戟簫機關針鏢_各用真物件而非共用劍槍',()=>{
  const paths=new Set<string>();
  for(const family of ['hook','halberd','flute','mechanism','needle','dart']){const p=independentProp(family)!;expect(p.src).toContain('/'+family+'.webp');expect(p.ratio).toBeGreaterThan(0);paths.add(p.src);}
  expect(paths.size).toBe(6);for(const family of ['fist','palm','finger','internal','step','weiqi'])expect(independentProp(family)).toBeNull();
 });
 it('test_independent_motion_柔鞭分節_固定鏈長根握點且全段連續',()=>{
  for(const time of [0,.2,.36,.5,.72]){const points=whipPoints([100,80,.1],200,time,.36,.72,true);expect(points[0]).toEqual({x:100,y:80});let total=0;for(let i=1;i<points.length;i++)total+=Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y);expect(total).toBeCloseTo(160,8);}
  expect(whipPoints([0,0,0],200,0,.36,.72,false)).not.toEqual(whipPoints([0,0,0],200,.36,.36,.72,true));
 });
});
