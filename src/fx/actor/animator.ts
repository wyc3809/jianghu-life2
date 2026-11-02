import { ACTION_DURATION, sampleAction, solveBrace, solveFeet, solveOffhand, type ActorAction, type ActorGrip } from './poses';
import { BONES, CONTACT_SKIN, FIXED_STEP, OFFHAND_GRIP, clamp, collidersFor, forward, mix, smooth, validateRig, type RigFrame, type RigPose, type RigSnapshot } from './rig';
/** 質量3的受限軀幹反應；頭與手腳沒有獨立自由剛體。 */
const RESPONSE={mass:3,stiffness:150,damping:34,max:7};
function clone(p:RigPose):RigPose{return{root:{...p.root},rotations:{...p.rotations}};}
/** 一名角色只有此處推固定步長及輸出RigFrame；render只讀frame。 */
export class ActorAnimator {
 private grip:ActorGrip='unarmed';
 private action:ActorAction='idle';private time=0;private originX=0;private steps=0;private accumulator=0;private active=true;private reduced=false;
 private previous:RigPose|null=null;private previousFeet:{front:{x:number;y:number};back:{x:number;y:number}}|null=null;private blend=1;private spring={x:0,v:0};private invalidCount=0;
 private current:RigFrame;private failure:RigFrame|null=null;
 constructor(){this.current=this.solve();}
 get frame():RigSnapshot{return this.current;}
 get invalidFrames():number{return this.invalidCount;}
 /** 驗收保留被拒姿勢供定位；繪圖仍只收到最後有效frame。 */
 get lastFailure():RigSnapshot|null{return this.failure;}
 /** 切換只影響畫面，沒有戰鬥回調或存檔依賴。起身需先倒地。 */
 play(action:ActorAction):boolean {
  if(['down','grounded'].includes(this.action)&&action!=='getup')return false;
  if(this.action==='getup'&&this.time<1.2&&!['down','hurt','knockback'].includes(action))return false;
  if(action==='getup'&&this.action!=='grounded'&&!(this.action==='down'&&this.time>=.85))return false;
  this.previous=clone(this.current.pose);this.blend=0;this.previousFeet={front:{...this.current.nodes.frontFoot.start},back:{...this.current.nodes.backFoot.start}};this.originX=this.current.pose.root.x+(action==='getup'?18:0);this.action=action;this.time=0;
  if(action==='down'){const ratio=clamp(-this.current.pose.rotations.pelvis/90,0,1);if(ratio>0){let low=0,high=1;for(let i=0;i<18;i++){const mid=(low+high)/2;if(smooth(mid)<ratio)low=mid;else high=mid;}this.time=.85*(low+high)/2;this.originX+=18*ratio;}}
  if(action==='hurt'||action==='knockback')this.spring.v=clamp(this.spring.v+65,-95,95);
  if(this.reduced){this.time=action==='attack'?.43:action==='down'?1:action==='getup'?1.65:0;this.blend=1;}
  this.current=this.solve();return true;
 }
 /** 暫停／離場清積壓，背景時間不補算。 */
 setGrip(grip:ActorGrip):void{this.grip=grip;this.current=this.solve();}
 /** 暫停／離場不改骨架。 */
 setActive(active:boolean):void{this.active=active;this.accumulator=0;}
 /** 減少動態停止自動播放；按動作仍可看對應固定姿勢。 */
 setReduced(value:boolean):void{this.reduced=value;this.accumulator=0;if(value){this.spring={x:0,v:0};this.blend=1;}this.current=this.solve();}
 /** 手動逐步與正常播放共用完全相同的物理步。 */
 step():void{this.fixed();}
 /** 超長時間差直接棄積壓；小步最多4次，不能把巨大dt交給反應求解。 */
 advance(dt:number):void {
  if(!this.active||this.reduced||!Number.isFinite(dt)||dt<=0)return;
  if(dt>.25){this.accumulator=0;return;}
  this.accumulator+=Math.min(dt,FIXED_STEP*4);let n=0;
  while(this.accumulator+1e-10>=FIXED_STEP&&n++<4){this.accumulator-=FIXED_STEP;this.fixed();}
  if(this.accumulator>=FIXED_STEP)this.accumulator=0;
 }
 /** 動作定位供蓄勢／收招逐幀驗收；不執行遊戲事件。 */
 inspect(action:ActorAction,time:number):void{if(!Number.isFinite(time)||time<0)return;this.previous=null;this.previousFeet=null;this.blend=1;this.action=action;this.time=Math.max(0,time);this.originX=this.current.pose.root.x;this.spring={x:0,v:0};this.current=this.solve();}
 /** 重播整個畫面測試；不重建遊戲、耗內或派獎。 */
 reset():void{this.action='idle';this.time=0;this.originX=0;this.steps=0;this.accumulator=0;this.previous=null;this.previousFeet=null;this.blend=1;this.spring={x:0,v:0};this.invalidCount=0;this.failure=null;this.current=this.solve();}
 private fixed():void {
  this.time+=FIXED_STEP;this.steps++;this.blend=Math.min(1,this.blend+FIXED_STEP/.18);
  const s=this.spring;s.v+=(-RESPONSE.stiffness*s.x-RESPONSE.damping*s.v)/RESPONSE.mass*FIXED_STEP;s.x=clamp(s.x+s.v*FIXED_STEP,-RESPONSE.max,RESPONSE.max);
  if(Math.abs(s.x)>=RESPONSE.max)s.v*=.35;
  const duration=ACTION_DURATION[this.action];
  if(this.time>=duration){
   if(this.action==='down'){this.action='grounded';this.time=0;this.originX=this.current.pose.root.x+18;}
   else if(this.action!=='grounded'){const end=this.current;this.action='idle';this.time=0;this.originX=end.pose.root.x;this.previous=clone(end.pose);this.previousFeet={front:{...end.nodes.frontFoot.start},back:{...end.nodes.backFoot.start}};this.blend=0;}
  }
  this.current=this.solve();
 }
 private solve():RigFrame {
  const sampled=sampleAction(this.action,this.time,this.originX,this.grip),p=sampled.pose;
  if(this.previous&&this.blend<1){const t=smooth(this.blend);p.root.x=mix(this.previous.root.x,p.root.x,t);p.root.y=mix(this.previous.root.y,p.root.y,t);for(const b of BONES)p.rotations[b.id]=mix(this.previous.rotations[b.id],p.rotations[b.id],t);}
  if(this.previousFeet&&this.blend<1){const t=smooth(this.blend);for(const side of ['front','back']as const){const old=this.previousFeet[side],next=sampled.feet[side],distance=Math.hypot(old.x-next.x,old.y-next.y);sampled.feet[side]={x:mix(old.x,next.x,t),y:mix(old.y,next.y,t)-(distance>3?Math.sin(t*Math.PI)*8:0)};}}
  p.root.x+=this.spring.x*.22;p.rotations.spine-=this.spring.x;
  // 限制先於FK。末端約束亦只改局部角度，所有骨長仍取definition。
  for(const b of BONES)p.rotations[b.id]=clamp(p.rotations[b.id],b.min,b.max);
  solveFeet(p,sampled.feet);if(sampled.brace)solveBrace(p);if(this.grip==='two'&&!['down','grounded','getup'].includes(this.action))solveOffhand(p);
  let nodes=forward(p),colliders=collidersFor(nodes);
  const penetration=Math.max(0,...colliders.filter(c=>!c.id.endsWith('Sole')).map(c=>Math.max(c.a.y,c.b.y)+c.radius+CONTACT_SKIN));
  if(penetration>0){p.root.y-=penetration;solveFeet(p,sampled.feet);nodes=forward(p);colliders=collidersFor(nodes);}
  for(const b of BONES)p.rotations[b.id]=nodes[b.id].local;
  const violations=validateRig(p,nodes,colliders);
  for(const side of ['front','back']as const)if(Math.hypot(nodes[`${side}Foot`].start.x-sampled.feet[side].x,nodes[`${side}Foot`].start.y-sampled.feet[side].y)>.5)violations.push(`${side}:foot-target`);
  if(this.grip==='two'&&!['down','grounded','getup'].includes(this.action)){const h=nodes.frontHand.end,a=nodes.frontHand.angle-Math.PI/2;if(Math.hypot(h.x-Math.cos(a)*OFFHAND_GRIP-nodes.backHand.end.x,h.y-Math.sin(a)*OFFHAND_GRIP-nodes.backHand.end.y)>.5)violations.push('back:weapon-grip');}
  if(violations.length){this.failure={nodes,pose:p,colliders,contacts:sampled.feet,violations,action:this.action,time:this.time,step:this.steps,reaction:this.spring.x};this.invalidCount++;if(this.current){return{...this.current,violations,step:this.steps};}}
  return{nodes,pose:p,colliders,contacts:sampled.feet,violations,action:this.action,time:this.time,step:this.steps,reaction:this.spring.x};
 }
}
