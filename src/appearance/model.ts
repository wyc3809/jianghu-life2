import { readAppearance, appearanceKey, type CharacterAppearance } from '@interfaces/appearance';
import { APPEARANCE_COLOURS } from '@data/appearances';
import { WEAPON_SPRITES } from '../spar/rig';
import { appearanceBodyFrame, appearanceComposition, type AppearancePose, type BodyFrame } from './pose';
import type { AppearanceAssets } from './assets';
import { appearanceHead, drawNeck } from './neck';
export type { AppearancePose } from './pose';

export interface AppearanceDraw {x:number;y:number;height:number;face?:number;pose?:AppearancePose;time?:number;family?:string;reduced?:boolean}
const coloured=new WeakMap<AppearanceAssets,Map<string,HTMLCanvasElement>>();
function bodyFor(assets:AppearanceAssets,a:CharacterAppearance,frame:BodyFrame):HTMLCanvasElement {
  let cache=coloured.get(assets);if(!cache){cache=new Map();coloured.set(assets,cache);}
  const key=`${a.outfit}:${a.tone}:${frame}`,old=cache.get(key);if(old)return old;
  const image=assets.bodies[a.outfit][frame],canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
  const ctx=canvas.getContext('2d',{willReadFrequently:true})!;ctx.drawImage(image,0,0);const pixels=ctx.getImageData(0,0,canvas.width,canvas.height),d=pixels.data,tone=APPEARANCE_COLOURS[a.tone];
  for(let i=0;i<d.length;i+=4){const r=d[i],g=d[i+1],b=d[i+2];if(d[i+3]>0&&b-r>5&&b>=g){
    const scale=(r*.2126+g*.7152+b*.0722)/92;d[i]=Math.min(247,tone[0]*scale);d[i+1]=Math.min(247,tone[1]*scale);d[i+2]=Math.min(247,tone[2]*scale);
  }}
  ctx.putImageData(pixels,0,0);cache.set(key,canvas);if(cache.size>96)cache.delete(cache.keys().next().value!);return canvas;
}
const weaponFor=(family:string)=>({sword:'sword',blade:'blade',spear:'spear',halberd:'spear',hook:'sword',staff:'staff',flute:'staff',whip:'whip',bow:'bow',needle:'hidden',dart:'hidden',finger:'hidden'}as Record<string,string>)[family];

/** 一張完整身體加同款頭部；手腳、衣袖、盤腿均在原姿勢圖內，不再拼接獨立肢體。 */
export function drawAppearance(ctx:CanvasRenderingContext2D,assets:AppearanceAssets,value:unknown,opts:AppearanceDraw):void {
  const a=readAppearance(value),frame=appearanceBodyFrame(opts.pose??'idle',opts.time??0,opts.reduced??false);
  const head=assets.heads[a.head],body=bodyFor(assets,a,frame),p=appearanceComposition(a,frame,head.naturalWidth/head.naturalHeight);
  ctx.save();ctx.translate(opts.x,opts.y);ctx.scale((opts.face??1)*opts.height/400,opts.height/400);
  const kind=weaponFor(opts.family??'fist'),weapon=kind?assets.weapons[kind]:undefined,def=kind?WEAPON_SPRITES[kind]:undefined;
  if(weapon&&def&&frame!=='seated'&&frame!=='down'){
    const length=kind==='staff'||kind==='spear'?215:kind==='bow'?120:kind==='hidden'?38:150;
    const scale=length/Math.max(1,def.tip.y-def.grip.y);
    ctx.save();ctx.translate(p.grip.x,p.grip.y);ctx.rotate(frame==='strike'?-Math.PI/2:frame==='windup'?-2.45:-.18);
    ctx.drawImage(weapon,-def.grip.x*scale,-def.grip.y*scale,def.w*scale,def.h*scale);ctx.restore();
  }
  ctx.drawImage(body,p.body.x,p.body.y,p.body.width,p.body.height);
  drawNeck(ctx,assets,a,p);
  ctx.save();ctx.translate(p.neck.x,p.neck.y);ctx.rotate(p.head.rotation);ctx.drawImage(appearanceHead(assets,a,p),p.head.x,p.head.y,p.head.width,p.head.height);ctx.restore();
  ctx.restore();
}
const frameUrls=new WeakMap<AppearanceAssets,Map<string,string>>();
/** Three演出取同一個完整姿勢，快取上限36張，不重寫戰報。 */
export function appearanceFrameUrl(assets:AppearanceAssets,a:unknown,pose:AppearancePose,time=0,family='fist'):string {
  let cache=frameUrls.get(assets);if(!cache){cache=new Map();frameUrls.set(assets,cache);}
  const key=`${appearanceKey(a)}:${pose}:${time}:${family}`,old=cache.get(key);if(old)return old;
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;
  drawAppearance(canvas.getContext('2d')!,assets,a,{x:256,y:480,height:448,pose,time,family});
  const url=canvas.toDataURL('image/png');cache.set(key,url);if(cache.size>36)cache.delete(cache.keys().next().value!);return url;
}
