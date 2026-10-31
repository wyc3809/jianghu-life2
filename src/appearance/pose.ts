import atlas from './pose-layout.json';
import type { CharacterAppearance } from '@interfaces/appearance';

export type AppearancePose='idle'|'walk'|'attack'|'hurt'|'down'|'seated';
export type BodyFrame='idle'|'walkA'|'walkB'|'windup'|'strike'|'hurt'|'down'|'seated';
export const BODY_FRAMES:readonly BodyFrame[]=['idle','walkA','walkB','windup','strike','hurt','down','seated'];
const HEADS:Record<CharacterAppearance['head'],{x:number;y:number;height:number}>={
  bamboo:{x:.54,y:.88,height:93},topknot:{x:.58,y:.91,height:88},master:{x:.52,y:.92,height:85},silver:{x:.62,y:.91,height:88},
  ponytail:{x:.64,y:.91,height:84},loose:{x:.64,y:.90,height:84},bun:{x:.55,y:.94,height:95},short:{x:.62,y:.91,height:80},
};

/** 只選完整姿勢，不旋轉或拉長任何獨立手腳；減少動態有固定姿勢。 */
export function appearanceBodyFrame(pose:AppearancePose,time:number,reduced:boolean):BodyFrame {
  const t=Number.isFinite(time)?Math.max(0,time):0;
  if(pose==='walk')return reduced?'idle':(['idle','walkA','idle','walkB']as const)[Math.floor(t*6)%4];
  if(pose==='attack')return reduced?'strike':t<.14?'windup':t<.40?'strike':t<.53?'windup':'idle';
  if(pose==='down')return reduced||t>=.12?'down':'hurt';
  return pose;
}

/** 所有錨點使用原圖像素及同一套身高倍率；後備圖尺寸不會改動頸位、握點或腳底。 */
export function appearanceComposition(a:CharacterAppearance,frame:BodyFrame,headAspect:number) {
  const set=atlas[a.outfit],m=set[frame],unit=1/set.pixelsPerUnit;
  const body={x:-m.origin[0]*unit,y:-m.origin[1]*unit,width:m.width*unit,height:m.height*unit};
  const neck={x:body.x+m.neck[0]*unit,y:body.y+m.neck[1]*unit};
  const grip={x:body.x+m.grip[0]*unit,y:body.y+m.grip[1]*unit};
  const h=HEADS[a.head],height=h.height,width=height*headAspect;
  return {body,neck,grip,head:{x:-width*h.x,y:-height*h.y,width,height,rotation:frame==='down'?-1.15:0}};
}
