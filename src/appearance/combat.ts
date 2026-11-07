import { readAppearance, appearanceKey, type CharacterAppearance } from '@interfaces/appearance';
import { APPEARANCE_COLOURS } from '@data/appearances';
import { WEAPON_SPRITES } from '../spar/rig';
import { appearanceBodyFrame, appearanceComposition, BODY_FRAMES, type BodyFrame } from './pose';
import type { AppearanceAssets } from './assets';
import type { AppearanceDraw } from './model';
import { appearanceHead, drawNeck } from './neck';

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
const weaponFor=(family:string)=>({sword:'sword',blade:'blade',spear:'spear',halberd:'spear',hook:'sword',staff:'staff',flute:'staff',whip:'whip',bow:'bow',needle:'hidden',dart:'hidden'}as Record<string,string>)[family];

const complete=new WeakMap<AppearanceAssets,Map<string,{image:HTMLCanvasElement;left:number;top:number;width:number;height:number}>>();

/** EA0.100完整姿勢與握點；角色和特效必須讀同一採樣。 */
export function combatAppearanceSample(assets:AppearanceAssets,value:unknown,opts:Pick<AppearanceDraw,'pose'|'time'|'reduced'>) {
  const a=readAppearance(value),frame=appearanceBodyFrame(opts.pose??'idle',opts.time??0,opts.reduced??false);
  const head=assets.heads[a.head];
  return {a,frame,p:appearanceComposition(a,frame,head.naturalWidth/head.naturalHeight)};
}

function completeFrame(assets:AppearanceAssets,a:CharacterAppearance,frame:BodyFrame,p:ReturnType<typeof appearanceComposition>) {
  let cache=complete.get(assets);if(!cache){cache=new Map();complete.set(assets,cache);}
  const key=`${appearanceKey(a)}:${frame}`,old=cache.get(key);if(old)return old;
  const b=p.body,h=p.head,c=Math.cos(h.rotation),s=Math.sin(h.rotation);
  const corners=[[h.x,h.y],[h.x+h.width,h.y],[h.x,h.y+h.height],[h.x+h.width,h.y+h.height]]
    .map(([x,y])=>({x:p.neck.x+x*c-y*s,y:p.neck.y+x*s+y*c}));
  const left=Math.floor(Math.min(b.x,...corners.map(v=>v.x)))-2,top=Math.floor(Math.min(b.y,...corners.map(v=>v.y)))-2;
  const right=Math.ceil(Math.max(b.x+b.width,...corners.map(v=>v.x)))+2,bottom=Math.ceil(Math.max(b.y+b.height,...corners.map(v=>v.y)))+2;
  // 固定原畫密度；裁透明邊保留原點，不能按每格高度重新fit。
  const density=1.5,image=document.createElement('canvas');image.width=Math.ceil((right-left)*density);image.height=Math.ceil((bottom-top)*density);
  const ctx=image.getContext('2d')!;ctx.scale(density,density);ctx.translate(-left,-top);
  ctx.drawImage(bodyFor(assets,a,frame),b.x,b.y,b.width,b.height);drawNeck(ctx,assets,a,p);
  ctx.save();ctx.translate(p.neck.x,p.neck.y);ctx.rotate(h.rotation);
  ctx.drawImage(appearanceHead(assets,a,p),h.x,h.y,h.width,h.height);ctx.restore();
  const result={image,left,top,width:image.width/density,height:image.height/density};cache.set(key,result);
  if(cache.size>32)cache.delete(cache.keys().next().value!);return result;
}

/** 戰鬥播舊版完整姿勢；頭頸只在預合成時組裝，畫面每次畫同一完整人物。 */
export function drawCombatAppearance(ctx:CanvasRenderingContext2D,assets:AppearanceAssets,value:unknown,opts:AppearanceDraw):void {
  const {a,frame,p}=combatAppearanceSample(assets,value,opts),whole=completeFrame(assets,a,frame,p);
  ctx.save();ctx.translate(opts.x,opts.y);ctx.scale((opts.face??1)*opts.height/400,opts.height/400);
  const kind=weaponFor(opts.family??'fist'),weapon=kind?assets.weapons[kind]:undefined,def=kind?WEAPON_SPRITES[kind]:undefined;
  if(weapon&&def&&frame!=='seated'&&frame!=='down'){
    const length=kind==='staff'||kind==='spear'?215:kind==='bow'?120:kind==='hidden'?38:150,scale=length/Math.max(1,def.tip.y-def.grip.y);
    ctx.save();ctx.translate(p.grip.x,p.grip.y);ctx.rotate(frame==='strike'?-Math.PI/2:frame==='windup'?-2.45:-.18);
    ctx.drawImage(weapon,-def.grip.x*scale,-def.grip.y*scale,def.w*scale,def.h*scale);ctx.restore();
  }
  ctx.drawImage(whole.image,whole.left,whole.top,whole.width,whole.height);ctx.restore();
}

/** 進場前預合成八格，同一身份有界快取，不逐幀讀取像素。 */
export function prepareCombatAppearance(assets:AppearanceAssets,value:unknown):void {
  const a=readAppearance(value),head=assets.heads[a.head];
  for(const frame of BODY_FRAMES)completeFrame(assets,a,frame,appearanceComposition(a,frame,head.naturalWidth/head.naturalHeight));
}

/** 舊版接觸姿勢對齊既有撲擊時鐘；不產生任何戰鬥事件。 */
export function combatContactTime(time:number,contact:number,duration:number):number {
  return time<=contact ? .2*Math.max(0,time)/Math.max(.001,contact)
    : .2+.5*Math.min(1,(time-contact)/Math.max(.001,duration-contact));
}
