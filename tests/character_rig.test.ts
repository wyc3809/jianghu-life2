import { describe,it,expect } from 'vitest';
import { ActorAnimator } from '../src/fx/actor/animator';
import { BACK_WEAPON_MOUNT, BONES, FIXED_STEP, OFFHAND_GRIP, forward, validateRig, worldSocket, type BoneId, type RigSnapshot } from '../src/fx/actor/rig';
import { sampleAction, type ActorAction, type ActorGrip } from '../src/fx/actor/poses';
const cases:ActorAction[]=['idle','walk','run','attack','hurt','knockback','down'];
function check(f:RigSnapshot){expect(f.violations,`${f.action} ${f.time}`).toEqual([]);expect(Math.max(...BONES.map(b=>Math.abs(Math.hypot(f.nodes[b.id].end.x-f.nodes[b.id].start.x,f.nodes[b.id].end.y-f.nodes[b.id].start.y)-b.length)))).toBeLessThan(1e-9);}
describe('單角色受控骨架',()=>{
 it('test_actor_連打受擊倒地起身_沒有接點骨長角度或穿地異常',()=>{
  for(const grip of ['unarmed','one','two','back']as ActorGrip[]){const a=new ActorAnimator();a.setGrip(grip);
   for(let cycle=0;cycle<3;cycle++){for(const action of cases){a.play(action);for(let i=0;i<100;i++){a.advance(FIXED_STEP);check(a.frame);}}
    expect(a.frame.action).toBe('grounded');expect(a.play('getup')).toBe(true);for(let i=0;i<120;i++){a.advance(FIXED_STEP);check(a.frame);}
   }expect(a.invalidFrames,`${grip} invalid frames`).toBe(0);
  }
 });
 it('test_actor_快速切招及受擊中斷_維持完整父子鏈與固定骨長',()=>{const a=new ActorAnimator();a.setGrip('two');for(let cycle=0;cycle<120;cycle++){a.play((['attack','hurt','knockback','walk','run']as const)[cycle%5]);for(let i=0;i<3+cycle%19;i++){a.advance(FIXED_STEP);check(a.frame);}}expect(a.invalidFrames).toBe(0);a.play('down');expect(a.play('attack')).toBe(false);for(let i=0;i<70;i++)a.advance(FIXED_STEP);expect(a.play('walk')).toBe(false);expect(a.play('getup')).toBe(true);});
 it('test_actor_不同輸入幀率_同一固定步輸出',()=>{const a=new ActorAnimator(),b=new ActorAnimator();a.play('run');b.play('run');for(let i=0;i<60;i++)a.advance(1/60);for(let i=0;i<240;i++)b.advance(1/240);expect(a.frame.step).toBe(60);expect(b.frame).toEqual(a.frame);});
 it('test_actor_背景長時間差暫停恢復_不補算或重播',()=>{const a=new ActorAnimator();a.play('attack');a.advance(.03);const before=structuredClone(a.frame);a.advance(30);expect(a.frame).toEqual(before);a.setActive(false);a.advance(.1);expect(a.frame).toEqual(before);a.setActive(true);a.advance(1/60);expect(a.frame.step).toBe(before.step+1);});
 it('test_actor_逐幀與正常播放_使用同一骨架且讀取不更新',()=>{const a=new ActorAnimator(),b=new ActorAnimator();a.play('attack');b.play('attack');a.setActive(false);for(let i=0;i<30;i++){a.step();b.advance(FIXED_STEP);}expect(a.frame).toEqual(b.frame);const frame=structuredClone(a.frame);for(let i=0;i<20;i++)void a.frame;expect(a.frame).toEqual(frame);});
 it('test_actor_二手長兵_副手到真第二握點不伸長手臂',()=>{const a=new ActorAnimator();a.setGrip('two');for(const action of ['idle','attack','walk','run','hurt','knockback']as const){a.play(action);for(let i=0;i<60;i++){a.advance(FIXED_STEP);const n=a.frame.nodes,angle=n.frontHand.angle-Math.PI/2,target={x:n.frontHand.end.x-Math.cos(angle)*OFFHAND_GRIP,y:n.frontHand.end.y-Math.sin(angle)*OFFHAND_GRIP};expect(Math.hypot(target.x-n.backHand.end.x,target.y-n.backHand.end.y),`${action} ${a.frame.time}`).toBeLessThan(.5);}}});
 it('test_actor_步行支撐期_世界腳底不滑行',()=>{const a=new ActorAnimator();a.play('walk');for(let i=0;i<60;i++)a.advance(FIXED_STEP);// 前腳在1.0至1.1秒仍為支撐期；後腳此時正進入抬腳。
  const planted=a.frame.nodes.frontFoot.start;for(let i=0;i<4;i++)a.advance(FIXED_STEP);const after=a.frame.nodes.frontFoot.start;expect(Math.hypot(after.x-planted.x,after.y-planted.y)).toBeLessThan(.01);});
 it('test_actor_除錯檢查_真錯位及異常值必須攔截',()=>{const p=sampleAction('idle',0,0).pose,n=forward(p);n.neck.start.x+=5;expect(validateRig(p,n)).toContain('neck:joint');n.frontForearm.end.x=Infinity;expect(validateRig(p,n)).toContain('frontForearm:nonfinite');const id:BoneId='frontShin';n[id].local=999;expect(validateRig(p,n)).toContain('frontShin:angle');});
 it('test_actor_減少動態倒地起身_自動回待機時使用新落腳點',()=>{const a=new ActorAnimator();a.setReduced(true);a.play('down');check(a.frame);expect(a.play('getup')).toBe(true);a.step();check(a.frame);expect(a.frame.action).toBe('idle');expect(a.invalidFrames).toBe(0);});
 it('test_actor_背負socket_隨父骨旋轉而非固定世界偏移',()=>{const p=sampleAction('idle',0,0).pose;p.rotations.spine=-90;let n=forward(p),s=worldSocket(n,BACK_WEAPON_MOUNT);expect(s.x-n.chest.end.x).toBeCloseTo(-25,9);expect(s.y-n.chest.end.y).toBeCloseTo(28,9);p.rotations.pelvis=-90;n=forward(p);s=worldSocket(n,BACK_WEAPON_MOUNT);expect(s.x-n.chest.end.x).toBeCloseTo(28,9);expect(s.y-n.chest.end.y).toBeCloseTo(25,9);});
 it('test_actor_定位輸入非法_拒絕污染既有骨架',()=>{const a=new ActorAnimator(),before=structuredClone(a.frame);a.inspect('idle',NaN);a.inspect('attack',Infinity);expect(a.frame).toEqual(before);});
 it('test_actor_已輸出的frame_往後更新不改舊資料',()=>{const a=new ActorAnimator();a.play('attack');const old=a.frame,before=structuredClone(old);for(let i=0;i<45;i++)a.advance(FIXED_STEP);expect(old).toEqual(before);});
 it('test_actor_減少動態_固定姿勢仍可逐幀驗收',()=>{const a=new ActorAnimator();a.setReduced(true);a.play('attack');const f=structuredClone(a.frame);a.advance(.1);expect(a.frame).toEqual(f);a.step();expect(a.frame.step).toBe(f.step+1);});
});
