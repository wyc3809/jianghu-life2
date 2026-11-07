import { appearanceKey } from '@interfaces/appearance';
import type { AppearancePose } from './pose';
import type { AppearanceAssets } from './assets';
import { drawSpineAppearance } from './spine/draw';
import { drawCombatAppearance } from './combat';
export type { AppearancePose } from './pose';

export interface AppearanceDraw {x:number;y:number;height:number;face?:number;pose?:AppearancePose;time?:number;motionTime?:number;family?:string;reduced?:boolean;quality?:'portrait'}
/** 人物頁保留連續立繪；戰鬥恢復完整姿勢，不改外觀ID或戰果。 */
export function drawAppearance(ctx:CanvasRenderingContext2D,assets:AppearanceAssets,value:unknown,opts:AppearanceDraw):void {
  if(assets.spine&&opts.quality==='portrait'){drawSpineAppearance(ctx,assets,value,opts);return;}
  drawCombatAppearance(ctx,assets,value,opts);
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
