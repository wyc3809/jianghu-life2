import { readAppearance, appearanceKey, type CharacterAppearance } from '@interfaces/appearance';
import { APPEARANCE_COLOURS } from '@data/appearances';
import type { AppearanceAssets, OutfitPart } from './assets';

export type AppearancePose = 'idle'|'walk'|'attack'|'hurt'|'down'|'seated';
export interface AppearanceDraw {
  x:number;y:number;height:number;face?:number;pose?:AppearancePose;time?:number;family?:string;reduced?:boolean;
}
const coloured = new WeakMap<AppearanceAssets,Map<string,Record<OutfitPart,HTMLCanvasElement>>>();

function partsFor(assets:AppearanceAssets,a:CharacterAppearance):Record<OutfitPart,HTMLCanvasElement> {
  let cache=coloured.get(assets);if(!cache){cache=new Map();coloured.set(assets,cache);}
  const key=`${a.outfit}:${a.tone}`,old=cache.get(key);if(old)return old;
  const tone=APPEARANCE_COLOURS[a.tone];
  const parts=Object.fromEntries(Object.entries(assets.outfits[a.outfit]).map(([part,im])=>{
    const canvas=document.createElement('canvas');canvas.width=im.naturalWidth;canvas.height=im.naturalHeight;
    const ctx=canvas.getContext('2d',{willReadFrequently:true})!;ctx.drawImage(im,0,0);
    const image=ctx.getImageData(0,0,canvas.width,canvas.height),d=image.data;
    for(let i=0;i<d.length;i+=4){
      const r=d[i],g=d[i+1],b=d[i+2];
      // 只調藍布色區，保留原膚色、髮色、皮革、布紋與墨線。
      if(d[i+3]>0&&b-r>5&&b>=g){const lum=r*.2126+g*.7152+b*.0722;const scale=lum/92;
        d[i]=Math.min(247,tone[0]*scale);d[i+1]=Math.min(247,tone[1]*scale);d[i+2]=Math.min(247,tone[2]*scale);}
    }
    ctx.putImageData(image,0,0);return [part,canvas];
  })) as Record<OutfitPart,HTMLCanvasElement>;
  cache.set(key,parts);return parts;
}
function end(x:number,y:number,angle:number,length:number){return{x:x-Math.sin(angle)*length,y:y+Math.cos(angle)*length};}
function piece(ctx:CanvasRenderingContext2D,im:CanvasImageSource,x:number,y:number,w:number,h:number,angle=0){
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.drawImage(im,-w*.5,-h*.09,w,h);ctx.restore();
}
const weaponFor=(family:string)=>({sword:'sword',blade:'blade',spear:'spear',halberd:'spear',hook:'sword',staff:'staff',flute:'staff',whip:'whip',bow:'bow',needle:'hidden',dart:'hidden',finger:'hidden'} as Record<string,string>)[family];

/** 全系統同一套詳細位圖骨架；固定身高，只轉動關節與布片，不重採樣成另一個人物。 */
export function drawAppearance(ctx:CanvasRenderingContext2D,assets:AppearanceAssets,value:unknown,opts:AppearanceDraw):void {
  const a=readAppearance(value),parts=partsFor(assets,a),pose=opts.pose??'idle',t=Math.max(0,opts.time??0),quiet=opts.reduced??false;
  const gait=quiet?0:Math.sin(t*9),seated=pose==='seated',attack=pose==='attack',hurt=pose==='hurt';
  const phase=quiet?1:Math.min(1,t/.65);
  const strike=attack?Math.sin(Math.min(1,phase*1.6)*Math.PI):0;
  const wind=attack?(1-Math.min(1,phase/.35)):0;
  const hipY=seated?-82:-153,shift=seated?66:0;
  const lean=hurt?-.13*(quiet?1:Math.max(0,1-t/.3)):attack?-.06*wind+.08*strike:pose==='walk'?.018*gait:0;
  ctx.save();ctx.translate(opts.x,opts.y);ctx.scale((opts.face??1)*(opts.height/400),opts.height/400);
  if(pose==='down'){const fall=quiet?1:Math.min(1,t/.55);ctx.translate(16*fall,0);ctx.rotate(-1.45*fall);}
  ctx.rotate(lean);
  // 髮尾在領口後面，頸部接縫由衣領遮住。
  const head=assets.heads[a.head],headH=112,headW=headH*head.naturalWidth/head.naturalHeight;
  ctx.drawImage(head,8-headW*.56,-282+shift-headH*.94,headW,headH);
  const arm=(back:boolean)=>{
    const sx=back?-29:27,sy=-265+shift;
    const upper=seated?(back?.55:-.55):attack?(back?.2:-.2)-strike*1.35+wind*.9:pose==='walk'?(back?1:-1)*gait*.22:back?.12:-.1;
    const lower=seated?(back?-1.05:1.05):attack?-.55-strike*.8:pose==='walk'?.12:-.05;
    const elbow=end(sx,sy,upper,59),hand=end(elbow.x,elbow.y,lower,55);
    ctx.save();if(back)ctx.globalAlpha*=.83;
    piece(ctx,parts.upperArm,sx,sy,a.outfit==='scholar'?49:43,73,upper);
    piece(ctx,parts.forearm,elbow.x,elbow.y,34,65,lower);ctx.restore();
    return hand;
  };
  arm(true);
  const leg=(back:boolean)=>{
    const x=back?-19:19;
    const upper=seated?(back?1.18:-1.18):pose==='walk'?(back?1:-1)*gait*.43:attack?(back?.16:-.24):back?.08:-.08;
    const lower=seated?(back?-1.36:1.36):pose==='walk'?upper-Math.max(0,(back?1:-1)*gait)*.42:0;
    const knee=end(x,hipY,upper,76);
    piece(ctx,parts.thigh,x,hipY,50,89,upper);piece(ctx,parts.shin,knee.x,knee.y,42,88,lower);
  };
  if(seated)piece(ctx,parts.seated,0,-110,230,120);
  else{leg(true);leg(false);piece(ctx,parts.hem,0,-166,a.outfit==='traveller'?111:132,a.outfit==='traveller'?86:143,quiet?0:Math.sin(t*3)*.018);}
  piece(ctx,parts.torso,0,-294+shift,a.outfit==='cloak'?114:100,162);
  const hand=arm(false),family=opts.family??'fist',kind=weaponFor(family),weapon=kind?assets.weapons[kind]:undefined;
  if(weapon&&!seated){
    const length=kind==='staff'||kind==='spear'?225:kind==='bow'?125:kind==='hidden'?42:155;
    const width=length*weapon.naturalWidth/weapon.naturalHeight;
    ctx.save();ctx.translate(hand.x,hand.y-8);ctx.rotate(attack?-.3-wind*2.1-strike*1.2:-.18);
    ctx.drawImage(weapon,-width*.5,-length*.18,width,length);ctx.restore();
  }
  ctx.restore();
}

const frameUrls=new WeakMap<AppearanceAssets,Map<string,string>>();
/** 舊Three演出亦使用同一造型的位圖，不另建角色或讀取即時外觀覆寫戰報。 */
export function appearanceFrameUrl(assets:AppearanceAssets,a:unknown,pose:AppearancePose,time=0,family='fist'):string {
  let cache=frameUrls.get(assets);if(!cache){cache=new Map();frameUrls.set(assets,cache);}
  const key=`${appearanceKey(a)}:${pose}:${time}:${family}`,old=cache.get(key);if(old)return old;
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;
  drawAppearance(canvas.getContext('2d')!,assets,a,{x:256,y:480,height:448,pose,time,family});
  const url=canvas.toDataURL('image/png');cache.set(key,url);
  // 手機長時間切換造型／武學，僅保留最近36張合成幀；已載入的Three貼圖自行持有。
  if(cache.size>36)cache.delete(cache.keys().next().value!);
  return url;
}
