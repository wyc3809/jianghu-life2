import { readAppearance, type CharacterAppearance } from '@interfaces/appearance';
import { APPEARANCE_COLOURS } from '@data/appearances';
import { WEAPON_SPRITES } from '../../spar/rig';
import extras from './props.json';
import { INDEPENDENT_INDEX, motionGroup } from './frames';
import type { MotionClip, PreparedClip, PreparedUpper, PropDef, PreparedProp, UpperSheet } from './types';
const extra=extras as unknown as Record<string,PropDef>;
const RATIOS:Record<string,number>={sword:.5,blade:.52,spear:.68,staff:.65,whip:.8,bow:.42,hidden:.11};
const familyProp:Record<string,string>={sword:'sword',blade:'blade',spear:'spear',staff:'staff',whip:'whip',bow:'bow',hook:'hook',halberd:'halberd',flute:'flute',mechanism:'mechanism',needle:'needle',dart:'dart',hidden:'dart'};
/** 兵器使用真正類別；鉤、戟、簫及機關不再借用劍槍棍。 */
export function independentProp(family:string):PropDef|null {
  const key=familyProp[family];if(!key)return null;
  if(extra[key])return extra[key];const d=WEAPON_SPRITES[key];return d?{src:d.src,w:d.w,h:d.h,grip:[d.grip.x,d.grip.y],tip:[d.tip.x,d.tip.y],ratio:RATIOS[key]??.5,flipX:key==='bow'?-1:1}:null;
}
function trim<K,V>(map:Map<K,V>,max:number,dispose?:(v:V)=>void){while(map.size>max){const key=map.keys().next().value!;dispose?.(map.get(key)!);map.delete(key);}}
function releaseCanvas(v:{image:HTMLCanvasElement}){v.image.width=0;v.image.height=0;}
function image(path:string,revision?:string):Promise<HTMLImageElement>{
  return new Promise((resolve,reject)=>{const im=new Image(),timer=setTimeout(()=>{im.onload=null;im.onerror=null;reject(Error('動作素材載入逾時'));},6000);im.onload=()=>{clearTimeout(timer);resolve(im)};im.onerror=()=>{clearTimeout(timer);reject(Error('動作素材載入失敗'))};const resolved=window.__jianghuAppearanceAssets?.[path]??(path.startsWith(import.meta.env.BASE_URL)&&import.meta.env.BASE_URL!=='/'?path:path.startsWith('/')?path:import.meta.env.BASE_URL+path);im.src=revision&&!resolved.startsWith('data:')&&!resolved.startsWith('blob:')?resolved+(resolved.includes('?')?'&':'?')+'v='+encodeURIComponent(revision):resolved;});
}
async function json<T>(path:string):Promise<T>{const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),6000);try{const r=await fetch(import.meta.env.BASE_URL+path,{signal:abort.signal,cache:'no-cache'});if(!r.ok)throw Error('動作資料未能載入');return await r.json()as T;}finally{clearTimeout(timer);}}
function colour(im:HTMLImageElement,tone:CharacterAppearance['tone']):HTMLCanvasElement {
  const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const x=c.getContext('2d',{willReadFrequently:true})!;x.drawImage(im,0,0);const p=x.getImageData(0,0,c.width,c.height),d=p.data,rgb=APPEARANCE_COLOURS[tone];
  for(let i=0;i<d.length;i+=4)if(d[i+3]&&d[i+2]-d[i]>5&&d[i+2]>=d[i+1]){const v=(d[i]*.2126+d[i+1]*.7152+d[i+2]*.0722)/92;for(let k=0;k<3;k++)d[i+k]=Math.min(247,rgb[k]*v);}
  x.putImageData(p,0,0);return c;
}
/** 共用有界素材快取，沒有角色RAF或戰鬥回呼；失圖由同一身份舊姿勢承接。 */
export class IndependentTextures {
  private clips=new Map<string,PreparedClip>();private uppers=new Map<string,PreparedUpper>();private props=new Map<string,PreparedProp>();private pending=new Map<string,Promise<void>>();private failed=new Map<string,number>();
  private trimClips(){let pixels=[...this.clips.values()].reduce((n,p)=>n+p.image.width*p.image.height,0);while(this.clips.size>32||pixels>24_000_000){const key=this.clips.keys().next().value!,p=this.clips.get(key)!;pixels-=p.image.width*p.image.height;releaseCanvas(p);this.clips.delete(key);}}
  /** 只讀估算解碼像素；不是iPhone實際記憶體或GPU量度。 */
  stats(){return{clips:this.clips.size,pixels:[...this.clips.values()].reduce((n,p)=>n+p.image.width*p.image.height,0),uppers:this.uppers.size,pending:this.pending.size,failures:this.failed.size};}
  get degraded(){return this.failed.size>0;}
  private run(key:string,load:()=>Promise<void>):Promise<void>{
    const old=this.pending.get(key);if(old)return old;if((this.failed.get(key)??0)>Date.now())return Promise.resolve();
    const p=load().catch(()=>{this.failed.set(key,Date.now()+30000);trim(this.failed,40)}).finally(()=>{this.pending.delete(key)});this.pending.set(key,p);return p;
  }
  /** 按武學身份預載一段，來源失敗由同身份後備承接。 */
  async prepareClip(value:unknown,id:string):Promise<void>{
    const a=readAppearance(value),key=`${a.outfit}:${a.tone}:${id}`;if(this.clips.has(key))return;
    return this.run('clip:'+key,async()=>{const meta=await json<MotionClip>(`ink/art/independent/${a.outfit}/${encodeURIComponent(id)}.json`);if(meta.id!==id||meta.outfit!==a.outfit||!meta.frames.length)throw Error('動作身份不符');const im=await image(meta.atlas,meta.sha256),tinted=colour(im,a.tone);this.clips.set(key,{meta,image:tinted});this.trimClips();this.failed.delete('clip:'+key);});
  }
  /** 載入連續頭頸胸材質與所選配色，不分件換頭。 */
  async prepareUpper(value:unknown):Promise<void>{
    const a=readAppearance(value),key=`${a.head}:${a.outfit}:${a.tone}`;if(this.uppers.has(key))return;
    return this.run('upper:'+key,async()=>{const meta=await json<UpperSheet>(`ink/art/independent/${a.outfit}/_upper-${a.head}.json`);if(meta.head!==a.head||meta.outfit!==a.outfit)throw Error('人物身份不符');const im=await image(meta.atlas,meta.sha256);this.uppers.set(key,{meta,image:colour(im,a.tone)});trim(this.uppers,4,releaseCanvas);this.failed.delete('upper:'+key);});
  }
  /** 載入真正持武類別及弦／箭部件。 */
  async prepareProp(family:string):Promise<void>{
    const def=extra[family]??independentProp(family);if(!def||this.props.has(family))return;return this.run('prop:'+family,async()=>{this.props.set(family,{def,image:await image(def.src)});trim(this.props,16);this.failed.delete('prop:'+family);});
  }
  /** 讀取並更新動作LRU；失圖只排程一次重試。 */
  getClip(value:unknown,id:string):PreparedClip|undefined{const a=readAppearance(value),key=`${a.outfit}:${a.tone}:${id}`,old=this.clips.get(key);if(old){this.clips.delete(key);this.clips.set(key,old);}else void this.prepareClip(a,id);return old;}
  /** 取得同身份上身，避免播放時更換預設人物。 */
  getUpper(value:unknown):PreparedUpper|undefined{const a=readAppearance(value),key=`${a.head}:${a.outfit}:${a.tone}`,old=this.uppers.get(key);if(old){this.uppers.delete(key);this.uppers.set(key,old);}else void this.prepareUpper(a);return old;}
  /** 道具缺圖暫停持武層，不能換上別種類型。 */
  getProp(family:string):PreparedProp|undefined{const old=this.props.get(family);if(!old)void this.prepareProp(family);return old;}
  /** 一場只預載已裝備及戰報真正出現的武學，絕不預載全103門。 */
  async prepare(value:unknown,ids:readonly string[]=[],family='fist'):Promise<void>{
    const group=motionGroup(family),wanted=[...new Set([...ids.filter(id=>INDEPENDENT_INDEX.clips[id]),...ids.filter(id=>INDEPENDENT_INDEX.clips[id]).map(id=>'_hurt_'+motionGroup(INDEPENDENT_INDEX.clips[id].family)),...(ids.some(id=>INDEPENDENT_INDEX.clips[id]?.neutral==='blade-settle')?['_idle_heavy']:[]),'_idle_'+group,'_walk_'+group,'_hurt_'+group,'_basic_'+(group==='pole'?'pole':group==='grip'||group==='bow'||group==='flute'?'grip':'fist'),'_down'])];
    await Promise.allSettled([this.prepareUpper(value),...wanted.map(id=>this.prepareClip(value,id)),this.prepareProp(family),...(['bow'].includes(family)||ids.some(id=>INDEPENDENT_INDEX.clips[id]?.family==='bow')?['cord','arrow'].map(key=>this.prepareProp(key)):[]),...ids.map(id=>this.prepareProp(INDEPENDENT_INDEX.clips[id]?.family??'fist'))]);
  }
}
