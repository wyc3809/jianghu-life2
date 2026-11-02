import type { CharacterAppearance } from '@interfaces/appearance';
import { WEAPON_SPRITES } from '../../spar/rig';
import { actorHead, actorPart, HEAD_BIND, RIG_ATLAS, type ActorAssets, type RigPart } from './assets';
import { BACK_WEAPON_MOUNT, BONES, RIG_HEIGHT, worldSocket, type BoneId, type RigSnapshot, type Vec2 } from './rig';
import type { ActorGrip } from './poses';
export interface ActorDraw {x:number;y:number;height:number;face:1|-1;appearance:CharacterAppearance;weapon:string;grip:ActorGrip;debug:boolean}
/** 位圖適配器只讀RigFrame，無update／戰鬥／存檔。所有部件使用同一root倍率與朝向。 */
export function drawActor(ctx:CanvasRenderingContext2D,assets:ActorAssets,frame:RigSnapshot,o:ActorDraw):void {
 const {nodes:n}=frame,a=o.appearance;
 ctx.save();ctx.translate(o.x,o.y);ctx.scale(o.face*o.height/RIG_HEIGHT,o.height/RIG_HEIGHT);ctx.translate(-frame.pose.root.x,0);
 function part(name:RigPart,start:Vec2,end:Vec2,scaleOverride?:number){const def=RIG_ATLAS[a.outfit][name],dx=def.tip[0]-def.pivot[0],dy=def.tip[1]-def.pivot[1];const angle=Math.atan2(end.y-start.y,end.x-start.x),scale=scaleOverride??Math.hypot(end.x-start.x,end.y-start.y)/Math.hypot(dx,dy);ctx.save();ctx.translate(start.x,start.y);ctx.rotate(angle);ctx.scale(scale,scale*(name==='upperArm'?1.4:1));ctx.rotate(-Math.atan2(dy,dx));ctx.drawImage(actorPart(assets,a,name),-def.pivot[0],-def.pivot[1],def.width,def.height);ctx.restore();}
 function limb(id:BoneId,name:RigPart){part(name,n[id].start,n[id].end);}
 const down=['down','grounded','getup'].includes(frame.action),held=o.grip!=='unarmed'&&o.grip!=='back';
 function weapon(back=false){const im=assets.weapons[o.weapon],d=WEAPON_SPRITES[o.weapon];if(!im||!d)return;const p=back?worldSocket(n,BACK_WEAPON_MOUNT):n.frontHand.end,angle=back?Math.max(-Math.PI,n[BACK_WEAPON_MOUNT.bone].angle-.35):n.frontHand.angle-Math.PI/2;const dx=d.tip.x-d.grip.x,dy=d.tip.y-d.grip.y,scale=(['staff','spear'].includes(o.weapon)?215:145)/Math.hypot(dx,dy);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(angle-Math.atan2(dy,dx));ctx.drawImage(im,-d.grip.x*scale,-d.grip.y*scale,d.w*scale,d.h*scale);ctx.restore();}
 if(o.grip==='back')weapon(true);
 for(const side of ['back','front']as const){limb(`${side}Thigh`,'thigh');limb(`${side}Shin`,'shin');limb(`${side}Foot`,'foot');}
 limb('backArm','upperArm');limb('backForearm','forearm');
 limb('neck','neck');limb('spine','torso');
 const pelvis=RIG_ATLAS[a.outfit].pelvis,pelvisScale=145/pelvis.width,hip=n.pelvis.end;
 part('pelvis',hip,{x:hip.x-Math.sin(n.pelvis.angle)*20,y:hip.y+Math.cos(n.pelvis.angle)*20},pelvisScale);
 // 頭部以頸端為唯一父節點；髮、臉不另起時間線。
 const h=HEAD_BIND[a.head],im=assets.heads[a.head],width=h.height*im.naturalWidth/im.naturalHeight;
 ctx.save();ctx.translate(n.head.end.x,n.head.end.y);ctx.rotate(n.head.angle+Math.PI/2);ctx.drawImage(actorHead(assets,a),-width*h.x,-h.height*h.y,width,h.height);ctx.restore();
 limb('frontArm','upperArm');limb('frontForearm','forearm');
 if(held)weapon();
 limb('backHand',held&&o.grip==='two'&&!down?'handGrip':'handOpen');limb('frontHand',held||frame.action==='attack'?'handGrip':'handOpen');
 if(o.debug){
  ctx.strokeStyle='rgba(54,110,110,.65)';ctx.lineWidth=1;
  for(const c of frame.colliders){ctx.beginPath();ctx.moveTo(c.a.x,c.a.y);ctx.lineTo(c.b.x,c.b.y);ctx.stroke();for(const p of [c.a,c.b]){ctx.beginPath();ctx.arc(p.x,p.y,c.radius,0,Math.PI*2);ctx.stroke();}}
  for(const b of BONES){const v=n[b.id];ctx.strokeStyle='#a3362d';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(v.start.x,v.start.y);ctx.lineTo(v.end.x,v.end.y);ctx.stroke();ctx.fillStyle='#a3362d';ctx.beginPath();ctx.arc(v.start.x,v.start.y,2.5,0,Math.PI*2);ctx.fill();}
  ctx.fillStyle='#3d7473';for(const p of Object.values(frame.contacts)){ctx.fillRect(p.x-3,p.y-3,6,6);}
 }
 ctx.restore();
}
