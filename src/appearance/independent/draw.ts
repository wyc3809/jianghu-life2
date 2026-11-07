import { appearanceKey, readAppearance } from '@interfaces/appearance';
import type { AppearanceAssets } from '../assets';
import type { AppearanceDraw } from '../model';
import { motionRequest, independentFrame } from './frames';
import { whipPoints,bowPoints,bitmapCord,bitmapWhip } from './held';
import type { PartRect, PreparedProp } from './types';
const frames=new WeakMap<AppearanceAssets,Map<string,{image:HTMLCanvasElement;x:number;y:number;origin:number[];height:number;grip:number[]}>>();
function point(m:number[],x:number,y:number){return{x:m[0]*x+m[2]*y+m[4],y:m[1]*x+m[3]*y+m[5]};}
function part(ctx:CanvasRenderingContext2D,im:CanvasImageSource,r:PartRect){if(r[2])ctx.drawImage(im,r[0],r[1],r[2],r[3],r[4],r[5],r[2],r[3]);}
function propGeometry(p:PreparedProp,grip:number[],height:number,family:string){const d=p.def,dx=d.tip[0]-d.grip[0],dy=d.tip[1]-d.grip[1],scale=d.ratio*height/Math.max(1,Math.hypot(dx,dy)),angle=family==='bow'?grip[2]:grip[2]-Math.atan2(dy,dx),flip=d.flipX??1;return{scale,angle,flip};}
function weapon(ctx:CanvasRenderingContext2D,p:PreparedProp,grip:number[],height:number,family:string){const d=p.def,g=propGeometry(p,grip,height,family);ctx.save();ctx.translate(grip[0],grip[1]);ctx.rotate(g.angle);ctx.scale(g.flip,1);ctx.drawImage(p.image,-d.grip[0]*g.scale,-d.grip[1]*g.scale,d.w*g.scale,d.h*g.scale);ctx.restore();}
/** 同一時間步的完整人物預合成；正常繪製只畫整體，不讓頭身各自更新。 */
export function drawIndependentAppearance(ctx:CanvasRenderingContext2D,assets:AppearanceAssets,value:unknown,o:AppearanceDraw):boolean {
  const textures=assets.independent;if(!textures||o.pose==='seated')return false;
  const a=readAppearance(value),request=motionRequest(o),body=textures.getClip(a,request.id),upper=textures.getUpper(a);if(!body||!upper)return false;
  const sampled=independentFrame(body.meta,request.time,request.loop,o.reduced),f=sampled.frame,head=f.head,r=upper.meta.parts[Math.max(0,Math.min(upper.meta.parts.length-1,head+6))],held=o.pose==='down'?undefined:textures.getProp(o.family??'fist');
  const back=o.backFamily&&['sword','blade','spear','staff'].includes(o.backFamily)&&o.pose!=='down'?textures.getProp(o.backFamily):undefined,backPoint=point(f.upper,177,145),backGrip=[backPoint.x,backPoint.y,['staff','spear'].includes(o.backFamily??'')?-1.9:1.9];
  const heldGrip=o.family==='mechanism'?(f.wrist??f.grip):f.grip;
  const whip=held&&o.family==='whip'?whipPoints(f.grip,body.meta.pixelsPerHeight,f.t,body.meta.contacts[0]??.36,body.meta.duration,o.pose==='attack'):null;
  const cord=held&&o.family==='bow'?textures.getProp('cord'):undefined,bow=held&&o.family==='bow'?bowPoints(held,f,body.meta.pixelsPerHeight,o.pose==='attack'&&f.t<(body.meta.contacts[0]??.36)):null;
  const arrow=held&&o.family==='bow'&&o.pose==='attack'?textures.getProp('arrow'):undefined,shot=Math.max(0,f.t-(body.meta.contacts[0]??.36)),arrowGrip=bow?[bow[1].x+Math.cos(f.grip[2])*shot*body.meta.pixelsPerHeight*4,bow[1].y+Math.sin(f.grip[2])*shot*body.meta.pixelsPerHeight*4,f.grip[2]]:null;
  let cache=frames.get(assets);if(!cache){cache=new Map();frames.set(assets,cache);}const key=`${appearanceKey(a)}:${request.id}:${sampled.index}:${o.family??'fist'}:${held?'armed':'bare'}:${cord?'cord':'loading'}:${arrow?'arrow':''}:${back?o.backFamily:''}`;let old=cache.get(key);
  if(!old){
    const bounds=f.parts.filter(p=>p[2]).flatMap(p=>[{x:p[4],y:p[5]},{x:p[4]+p[2],y:p[5]+p[3]}]);bounds.push(...[[r[4],r[5]],[r[4]+r[2],r[5]],[r[4],r[5]+r[3]],[r[4]+r[2],r[5]+r[3]]].map(([x,y])=>point(f.upper,x,y)));
    if(held){const d=held.def,g=propGeometry(held,heldGrip,body.meta.pixelsPerHeight,o.family??'fist'),m=[Math.cos(g.angle)*g.flip,Math.sin(g.angle)*g.flip,-Math.sin(g.angle),Math.cos(g.angle),heldGrip[0],heldGrip[1]];for(const x of [0,d.w])for(const y of [0,d.h])bounds.push(point(m,(x-d.grip[0])*g.scale,(y-d.grip[1])*g.scale));}
    if(back){const d=back.def,g=propGeometry(back,backGrip,body.meta.pixelsPerHeight,o.backFamily!),m=[Math.cos(g.angle),Math.sin(g.angle),-Math.sin(g.angle),Math.cos(g.angle),backGrip[0],backGrip[1]];for(const xx of[0,d.w])for(const yy of[0,d.h])bounds.push(point(m,(xx-d.grip[0])*g.scale,(yy-d.grip[1])*g.scale));}
    if(whip)bounds.push(...whip);if(bow)bounds.push(...bow);
    if(arrow&&arrowGrip&&shot<.16){const d=arrow.def,g=propGeometry(arrow,arrowGrip,body.meta.pixelsPerHeight,'dart'),m=[Math.cos(g.angle),Math.sin(g.angle),-Math.sin(g.angle),Math.cos(g.angle),arrowGrip[0],arrowGrip[1]];for(const xx of[0,d.w])for(const yy of[0,d.h])bounds.push(point(m,(xx-d.grip[0])*g.scale,(yy-d.grip[1])*g.scale));}
    const x=Math.floor(Math.min(...bounds.map(p=>p.x)))-2,y=Math.floor(Math.min(...bounds.map(p=>p.y)))-2,right=Math.ceil(Math.max(...bounds.map(p=>p.x)))+2,bottom=Math.ceil(Math.max(...bounds.map(p=>p.y)))+2;
    const image=document.createElement('canvas');image.width=right-x;image.height=bottom-y;const c=image.getContext('2d')!;c.translate(-x,-y);if(back)weapon(c,back,backGrip,body.meta.pixelsPerHeight,o.backFamily!);part(c,body.image,f.parts[0]);c.save();c.transform(...f.upper);part(c,upper.image,r);c.restore();part(c,body.image,f.parts[1]);if(held){if(whip)bitmapWhip(c,held,whip);else weapon(c,held,heldGrip,body.meta.pixelsPerHeight,o.family??'fist');if(bow&&cord){bitmapCord(c,cord,bow[0],bow[1]);bitmapCord(c,cord,bow[1],bow[2]);}if(arrow&&arrowGrip&&shot<.16){c.save();c.globalAlpha=1-shot/.16;weapon(c,arrow,arrowGrip,body.meta.pixelsPerHeight,'dart');c.restore();}}part(c,body.image,f.parts[2]);part(c,body.image,f.parts[3]);
    let floor=0;if(o.pose==='down'){const pixels=c.getImageData(0,0,image.width,image.height).data;outer:for(let yy=image.height-1;yy>=0;yy--)for(let xx=0;xx<image.width;xx++)if(pixels[(yy*image.width+xx)*4+3]>30){floor=body.meta.origin[1]-(y+yy+1);break outer;}}
    old={image,x,y:y+floor,origin:body.meta.origin,height:body.meta.pixelsPerHeight,grip:f.grip};cache.set(key,old);if(cache.size>96){const first=cache.keys().next().value!,expired=cache.get(first)!;expired.image.width=0;expired.image.height=0;cache.delete(first);}
  }
  const unit=o.height/old.height;ctx.save();ctx.translate(o.x,o.y);ctx.scale((o.face??1)*unit,unit);ctx.drawImage(old.image,old.x-old.origin[0],old.y-old.origin[1]);ctx.restore();return true;
}
/** 特效與兵器都讀同一幀握點，不借用別套圖集的接觸座標。 */
export function independentContact(assets:AppearanceAssets,value:unknown,o:AppearanceDraw):{x:number;y:number}|null {
  const request=motionRequest(o),body=assets.independent?.getClip(value,request.id);if(!body)return null;const {frame}=independentFrame(body.meta,request.time,request.loop,o.reduced),unit=o.height/body.meta.pixelsPerHeight;
  const grip=frame.contact==='far'?frame.farGrip:frame.grip;
  return{x:o.x+(grip[0]-body.meta.origin[0])*(o.face??1)*unit,y:o.y+(grip[1]-body.meta.origin[1])*unit};
}
