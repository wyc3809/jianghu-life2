import { ANKLE_Y, BONES, OFFHAND_GRIP, ROOT_Y, clamp, deg, forward, mix, smooth, twoBone, type RigPose, type Vec2 } from './rig';
export type ActorAction='idle'|'walk'|'run'|'attack'|'hurt'|'knockback'|'down'|'grounded'|'getup';
export const ACTION_DURATION:Record<ActorAction,number>={idle:Infinity,walk:Infinity,run:Infinity,attack:1.05,hurt:.6,knockback:.9,down:1.05,grounded:Infinity,getup:1.65};
export type ActorGrip='unarmed'|'one'|'two'|'back';
export interface PoseSample { pose:RigPose; feet:{front:Vec2;back:Vec2}; brace:boolean }
function keyed(t:number,keys:readonly (readonly [number,number])[]):number {for(let i=1;i<keys.length;i++)if(t<keys[i][0])return mix(keys[i-1][1],keys[i][1],smooth((t-keys[i-1][0])/(keys[i][0]-keys[i-1][0])));return keys.at(-1)![1];}
/** 動作作者姿勢；畫面資料，不讀任何戰鬥／經濟或隨機數。 */
export function sampleAction(action:ActorAction,t:number,startX:number,grip:ActorGrip='unarmed'):PoseSample {
 const p:RigPose={root:{x:startX,y:ROOT_Y},rotations:Object.fromEntries(BONES.map(b=>[b.id,b.rest])) as RigPose['rotations']};
 let frontUpper=80,frontLower=-55,backUpper=60,backLower=150,fall=0;
 const feet={front:{x:startX+44,y:ANKLE_Y},back:{x:startX-42,y:ANKLE_Y}};
 if(action==='idle'){p.root.y+=Math.sin(t*2)*.8;p.rotations.spine+=Math.sin(t*2)*.6;}
 if(action==='walk'||action==='run'){
  const running=action==='run',period=running?.56:.9,speed=running?112:56,stride=period*speed,stance=running?.52:.62;
  p.root.x=startX+speed*t;p.root.y+=Math.sin(t/period*Math.PI*4)*(running?3:1.2);
  for(const [i,side] of ['front','back'].entries()){
   const offset=i*.5,phase=t/period+offset,n=Math.floor(phase),q=phase-n;
   const planted=startX+(n-offset+stance/2)*stride+(i===0?10:-10),s=smooth((q-stance)/(1-stance));
   feet[side as 'front'|'back']={x:planted+(q<stance?0:s*stride),y:ANKLE_Y-(q<stance?0:Math.sin(s*Math.PI)*(running?35:20))};
  }
  const swing=Math.sin(t/period*Math.PI*2);p.rotations.spine-=running?8:2;
  frontUpper=90+swing*22;frontLower=frontUpper-(running?75:20);backUpper=90-swing*22;backLower=backUpper+(running?75:20);
 }
 if(action==='attack'){
  p.rotations.spine+=keyed(t,[[0,0],[.22,-10],[.42,13],[.62,8],[1.05,0]]);p.root.x+=keyed(t,[[0,0],[.22,-7],[.42,11],[.65,10],[1.05,0]]);
  frontUpper=keyed(t,[[0,80],[.24,125],[.43,-8],[.57,-5],[.76,45],[1.05,80]]);
  frontLower=keyed(t,[[0,-55],[.24,-10],[.43,-3],[.57,0],[.76,-50],[1.05,-55]]);
  backUpper=keyed(t,[[0,60],[.24,70],[.43,45],[1.05,60]]);backLower=backUpper+90;
 }
 if(action==='hurt'||action==='knockback'){
  const k=action==='knockback'?1.6:1;p.rotations.spine-=Math.sin(clamp(t/.55,0,1)*Math.PI)*12*k;
  if(action==='knockback'){const x=-35*smooth(t/.32);p.root.x+=x;feet.front.x+=x;feet.back.x+=x;feet.front.y-=Math.sin(Math.min(1,t/.7)*Math.PI)*18;feet.back.y=feet.front.y;}
  frontUpper=105;frontLower=-30;backUpper=80;backLower=170;
 }
 if(action==='down'||action==='grounded'||action==='getup'){
  fall=action==='grounded'?1:action==='down'?smooth(t/.85):1-smooth(t/1.65);
  p.root.y=mix(ROOT_Y,-73,fall);p.root.x+=mix(0,-18,fall);p.rotations.pelvis=-90*fall;p.rotations.spine=-90-2*fall;p.rotations.neck=-18*fall;p.rotations.head=-12*fall;
  frontUpper=mix(80,-20,fall);frontLower=mix(-55,-120,fall);backUpper=mix(60,25,fall);backLower=mix(150,120,fall);
  // 起身中段先收腳；兩腳落點由同一IK求解，不重置人物大小。
  feet.front.x=p.root.x+mix(44,140,fall);feet.back.x=p.root.x+mix(-42,102,fall);
  if(action==='down'){feet.front.y-=Math.sin(fall*Math.PI)*24;feet.back.y=feet.front.y;}
  if(action==='getup'){const back=smooth((t-.15)/.6),front=smooth((t-.8)/.55);feet.back={x:startX+mix(84,-42,back),y:ANKLE_Y-Math.sin(back*Math.PI)*8};feet.front={x:startX+mix(122,44,front),y:ANKLE_Y-Math.sin(front*Math.PI)*18};}
 }
 if(fall<.01&&(grip==='one'||grip==='two')){
  if(grip==='one'){frontUpper=action==='attack'?keyed(t,[[0,80],[.24,120],[.43,30],[.62,25],[1.05,80]]):80;frontLower=action==='attack'?keyed(t,[[0,-15],[.24,-35],[.43,10],[.62,8],[1.05,-15]]):-15;}
  else{frontUpper=action==='attack'?keyed(t,[[0,80],[.24,120],[.43,0],[.65,5],[1.05,80]]):80;frontLower=action==='attack'?keyed(t,[[0,-20],[.24,-35],[.43,-5],[.65,-8],[1.05,-20]]):-20;}
 }
 const spine=p.rotations.spine+p.rotations.pelvis+p.rotations.chest;
 // 持武的待機／移動／受擊保持相對胸部姿勢，不能軀幹退後而雙手仍追舊世界角度。
 if(fall<.01&&(grip==='one'||grip==='two')&&action!=='attack'){frontUpper+=spine+90;frontLower+=spine+90;}
 p.rotations.frontArm=frontUpper-spine;
 if(fall>0&&(grip==='one'||grip==='two'))p.rotations.frontHand=30*fall;
 if((grip==='one'||grip==='two')&&action==='attack')p.rotations.frontHand=keyed(t,[[0,0],[.24,0],[.43,40],[.62,35],[1.05,0]]);p.rotations.frontForearm=frontLower-frontUpper;
 p.rotations.backArm=backUpper-spine;p.rotations.backForearm=backLower-backUpper;
 return{pose:p,feet,brace:action==='getup'&&t<.8};
}
/** 同一世界目標解雙腿；足部持平，骨長不受衣著或PNG大小影響。 */
export function solveFeet(p:RigPose,feet:PoseSample['feet']):void {
 let n=forward(p);
 for(const side of ['front','back']as const){const id=`${side}Thigh`as const,[a,k]=twoBone(n[id].start,feet[side],82,82,1);p.rotations[id]=a-deg(n.pelvis.angle);p.rotations[`${side}Shin`]=k;n=forward(p);p.rotations[`${side}Foot`]=-deg(n[`${side}Shin`].angle);}
}
/** 起身支撐手採可達範圍，沒有拉長手臂去追地面。 */
export function solveBrace(p:RigPose):void {
 const n=forward(p),a=n.backArm.start,target={x:p.root.x-18,y:-36},[upper,elbow]=twoBone(a,target,58,54,1);
 p.rotations.backArm=upper-deg(n.chest.angle);p.rotations.backForearm=elbow;
}

/** 副手抓住同一武器的第二握點；手掌長度納入可達半徑，不改骨長。 */
export function solveOffhand(p:RigPose):void {
 const n=forward(p),h=n.frontHand.end,a=n.frontHand.angle-Math.PI/2,target={x:h.x-Math.cos(a)*OFFHAND_GRIP,y:h.y-Math.sin(a)*OFFHAND_GRIP};
 const [upper,elbow]=twoBone(n.backArm.start,target,58,70,1);p.rotations.backArm=upper-deg(n.chest.angle);p.rotations.backForearm=elbow;p.rotations.backHand=0;
}
