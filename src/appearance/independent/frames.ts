import raw from './index.json';
import { canonicalSkillId } from '@data/skills/catalog';
import type { AppearanceDraw } from '../model';
import type { MotionClip, MotionFrame, MotionInfo } from './types';
export const INDEPENDENT_INDEX=raw as unknown as {schema:number;canonical:number;origin:[number,number];pixelsPerHeight:number;clips:Record<string,MotionInfo>};
/** 只選姿勢；時計／傷害／保底及存檔完全由原有核心掌握。 */
export function motionGroup(family='fist'):string {
  return ['spear','staff','halberd'].includes(family)?'pole':family==='bow'?'bow':family==='flute'?'flute':family==='weiqi'?'stone':['needle','dart','mechanism'].includes(family)?'needle':['sword','blade','hook','whip','hidden'].includes(family)?'grip':'fist';
}
/** 正式動作與生命週期分開；舊名正規化，未登記身份不能冒充另一門武功。 */
export function motionRequest(o:AppearanceDraw):{id:string;time:number;loop:boolean} {
  const name=o.martialId?canonicalSkillId(o.martialId):null,art=name?INDEPENDENT_INDEX.clips[name]:undefined,group=motionGroup(o.family),pose=o.pose??'idle';
  const t=Number.isFinite(o.motionTime??o.time)?Math.max(0,o.motionTime??o.time??0):0;
  if(pose==='down')return{id:'_down',time:t,loop:false};
  if(pose==='hurt')return{id:'_hurt_'+group,time:t,loop:false};
  if(pose==='walk')return{id:'_walk_'+group,time:t,loop:true};
  if(pose==='attack')return{id:art&&name?name:'_basic_'+(group==='pole'?'pole':group==='grip'||group==='bow'||group==='flute'?'grip':'fist'),time:t,loop:false};
  if(name&&art&&art.family===o.family&&art.neutral==='blade-settle')return{id:'_idle_heavy',time:t,loop:true};
  return{id:'_idle_'+group,time:t,loop:true};
}
/** 採樣包含真接觸時刻的離線幀；掉幀／略過不重發任何事件。 */
export function independentFrame(clip:MotionClip,time:number,loop=false,reduced=false):{frame:MotionFrame;index:number} {
  const duration=clip.duration,t=reduced?(clip.state==='down'?duration:clip.contacts[0]??0):loop?Math.max(0,time)%duration:Math.min(duration,Math.max(0,Number.isFinite(time)?time:0));
  let lo=0,hi=clip.frames.length-1;
  while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(clip.frames[mid].t<=t+1e-7)lo=mid;else hi=mid-1;}
  return{frame:clip.frames[lo],index:lo};
}
/** 敵方原撲擊時計對齊該門首個真接觸點，不能更改結算時點。 */
export function opponentMotionTime(id:string|null|undefined,time:number,contact:number,duration:number):number {
  const clip=id?INDEPENDENT_INDEX.clips[canonicalSkillId(id)]:undefined,target=clip?.contacts[0]??.36,end=clip?.duration??.72;
  if(!Number.isFinite(time)||time<=0)return 0;if(time>=duration)return end;if(time===contact)return target;
  return time<=contact?target*Math.max(0,time)/Math.max(.001,contact):target+(end-target)*Math.min(1,(time-contact)/Math.max(.001,duration-contact));
}
