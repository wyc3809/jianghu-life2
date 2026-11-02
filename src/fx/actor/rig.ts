/** 共用角色設計座標：右向、y向下；所有顯示倍率只由renderer處理。 */
export const RIG_HEIGHT = 400;
/** 位圖半透明邊的接觸皮層；不改穿地驗收容差或骨長。 */
export const CONTACT_SKIN = 1;
export const OFFHAND_GRIP = 70;
export const FIXED_STEP = 1 / 60;
export const ANKLE_Y = -27;
export const ROOT_Y = -178;
export interface Vec2 { x: number; y: number }
export interface BoneDef { id: BoneId; parent: BoneId | null; offset: Vec2; length: number; rest: number; min: number; max: number }
export type BoneId = 'pelvis'|'spine'|'chest'|'neck'|'head'|'backArm'|'backForearm'|'backHand'|'frontArm'|'frontForearm'|'frontHand'|'backThigh'|'backShin'|'backFoot'|'frontThigh'|'frontShin'|'frontFoot';
const bone=(id:BoneId,parent:BoneId|null,x:number,y:number,length:number,rest:number,min:number,max:number):BoneDef=>({id,parent,offset:{x,y},length,rest,min,max});
export const BONES:readonly BoneDef[]=[
 bone('pelvis',null,0,0,0,0,-90,25),bone('spine','pelvis',0,0,110,-90,-130,-58),
 bone('chest','spine',0,0,0,0,-5,5),bone('neck','chest',0,0,30,0,-18,18),bone('head','neck',0,0,0,0,-12,12),
 bone('backArm','chest',-35,54,58,150,-20,330),bone('backForearm','backArm',0,0,54,90,0,155),bone('backHand','backForearm',0,0,16,0,-40,40),
 bone('frontArm','chest',-32,-58,58,170,25,330),bone('frontForearm','frontArm',0,0,54,-135,-155,15),bone('frontHand','frontForearm',0,0,16,0,-40,40),
 bone('backThigh','pelvis',-18,0,82,85,-70,160),bone('backShin','backThigh',0,0,82,45,0,150),bone('backFoot','backShin',0,0,35,-110,-175,20),
 bone('frontThigh','pelvis',18,0,82,70,-70,160),bone('frontShin','frontThigh',0,0,82,45,0,150),bone('frontFoot','frontShin',0,0,35,-110,-175,20),
];
export const BONE_BY_ID=Object.fromEntries(BONES.map(b=>[b.id,b])) as Record<BoneId,BoneDef>;
export interface BoneFrame { start:Vec2; end:Vec2; angle:number; local:number }
export type RigNodes=Record<BoneId,BoneFrame>;
export interface RigPose { root:Vec2; rotations:Record<BoneId,number> }
export interface Collider { id:string; a:Vec2; b:Vec2; radius:number }
export interface RigFrame { nodes:RigNodes; pose:RigPose; colliders:Collider[]; contacts:{front:Vec2;back:Vec2}; violations:string[]; action:string; time:number; step:number; reaction:number }
export type DeepReadonly<T> = T extends readonly (infer U)[] ? readonly DeepReadonly<U>[] : T extends object ? { readonly [K in keyof T]:DeepReadonly<T[K]> } : T;
export type RigSnapshot=DeepReadonly<RigFrame>;
export const BACK_WEAPON_MOUNT={bone:'chest' as BoneId,offset:{x:-28,y:-25}};
/** socket偏移亦由父骨局部座標轉換，不能混用世界偏移。 */
export function worldSocket(nodes:DeepReadonly<RigNodes>,mount:{bone:BoneId;offset:Vec2}):Vec2{const b=nodes[mount.bone],p=rotate(mount.offset,b.angle);return{x:b.end.x+p.x,y:b.end.y+p.y};}
export const rad=(degrees:number)=>degrees*Math.PI/180;
export const deg=(radians:number)=>radians*180/Math.PI;
export const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
export const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
export const smooth=(t:number)=>{const p=clamp(t,0,1);return p*p*(3-2*p);};
export const rotate=(p:Vec2,a:number):Vec2=>({x:p.x*Math.cos(a)-p.y*Math.sin(a),y:p.x*Math.sin(a)+p.y*Math.cos(a)});
/** 一次父子遍歷，子骨起點只來自父端點，不另行追逐／插值接點。 */
export function forward(pose:RigPose):RigNodes {
 const nodes={} as RigNodes;
 for(const b of BONES){
  const parent=b.parent?nodes[b.parent]:null,offset=rotate(b.offset,parent?.angle??0);
  const start={x:(parent?.end.x??pose.root.x)+offset.x,y:(parent?.end.y??pose.root.y)+offset.y};
  const local=clamp(pose.rotations[b.id],b.min,b.max),angle=(parent?.angle??0)+rad(local);
  nodes[b.id]={start,end:{x:start.x+Math.cos(angle)*b.length,y:start.y+Math.sin(angle)*b.length},angle,local};
 }return nodes;
}
/** 雙骨IK限制可達半徑；只改角度，不改骨長。bend=1為正向屈曲。 */
export function twoBone(origin:Vec2,target:Vec2,l1:number,l2:number,bend:1|-1):[number,number] {
 const dx=target.x-origin.x,dy=target.y-origin.y,d=clamp(Math.hypot(dx,dy),Math.abs(l1-l2)+1e-5,l1+l2-1e-5);
 const base=Math.atan2(dy,dx),a=Math.acos(clamp((l1*l1+d*d-l2*l2)/(2*l1*d),-1,1));
 const elbow=Math.PI-Math.acos(clamp((l1*l1+l2*l2-d*d)/(2*l1*l2),-1,1));
 return [deg(base-bend*a),deg(bend*elbow)];
}
/** 數值驗收與渲染分開；同一份碰撞形狀供除錯及穿地檢查。 */
export function collidersFor(n:RigNodes):Collider[] {
 const headOffset=rotate({x:0,y:-40},n.head.angle+Math.PI/2),hc={x:n.head.end.x+headOffset.x,y:n.head.end.y+headOffset.y};
 const result:Collider[]=[{id:'torso',a:n.spine.start,b:n.spine.end,radius:64},{id:'pelvis',a:n.pelvis.end,b:n.pelvis.end,radius:73},{id:'head',a:hc,b:hc,radius:34}];
 for(const id of ['backArm','frontArm','backForearm','frontForearm','backThigh','frontThigh','backShin','frontShin'] as const)result.push({id,a:n[id].start,b:n[id].end,radius:id.includes('Thigh')?19:id.includes('Arm')?25:12});
 for(const side of ['front','back']as const){const p=n[`${side}Foot`].start,a=rotate({x:-10,y:27},n[`${side}Foot`].angle),b=rotate({x:35,y:27},n[`${side}Foot`].angle);result.push({id:`${side}Sole`,a:{x:p.x+a.x,y:p.y+a.y},b:{x:p.x+b.x,y:p.y+b.y},radius:0});result.push({id:`${side}Hand`,a:n[`${side}Hand`].start,b:n[`${side}Hand`].end,radius:10});}
 return result;
}
/** 檢查實際FK輸出：連接、骨長、角度、穿地及異常數值。 */
export function validateRig(pose:RigPose,n:RigNodes,colliders=collidersFor(n)):string[] {
 const bad:string[]=[];
 for(const b of BONES){const v=n[b.id];if(![v.start.x,v.start.y,v.end.x,v.end.y,v.angle,v.local].every(Number.isFinite)){bad.push(`${b.id}:nonfinite`);continue;}
  if(Math.abs(Math.hypot(v.end.x-v.start.x,v.end.y-v.start.y)-b.length)>1e-6)bad.push(`${b.id}:length`);
  if(v.local<b.min-1e-7||v.local>b.max+1e-7)bad.push(`${b.id}:angle`);
  const parent=b.parent?n[b.parent]:null,offset=rotate(b.offset,parent?.angle??0);
  if(Math.hypot(v.start.x-(parent?.end.x??pose.root.x)-offset.x,v.start.y-(parent?.end.y??pose.root.y)-offset.y)>1e-6)bad.push(`${b.id}:joint`);
 }
 for(const c of colliders)if(Math.max(c.a.y,c.b.y)+c.radius>.5)bad.push(`${c.id}:ground`);
 return bad;
}
