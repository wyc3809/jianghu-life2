import atlas from './asset-map.json';
import embedded from './asset-fallback.json';
import heads from '../../appearance/asset-map.json';
import headFallback from '../../appearance/asset-fallback.json';
import { APPEARANCE_COLOURS } from '@data/appearances';
import type { CharacterAppearance } from '@interfaces/appearance';
import { neckSkinOpacity } from '../../appearance/neck';
export type RigPart=keyof typeof atlas.traveller;
export type RigOutfit=CharacterAppearance['outfit'];
export interface ActorAssets {parts:Record<RigOutfit,Record<RigPart,HTMLImageElement>>;heads:Record<CharacterAppearance['head'],HTMLImageElement>;weapons:Record<string,HTMLImageElement>;simplified:boolean}
export const RIG_ATLAS=atlas;
export const HEAD_BIND={bamboo:{x:.54,y:.88,height:93},topknot:{x:.58,y:.91,height:88},master:{x:.52,y:.92,height:85},silver:{x:.62,y:.91,height:88},ponytail:{x:.64,y:.91,height:84},loose:{x:.64,y:.90,height:84},bun:{x:.55,y:.94,height:95},short:{x:.62,y:.91,height:80}};
declare global { interface Window { __jianghuActorAssets?:Record<string,string> } }
let pending:Promise<ActorAssets>|null=null;
/** 骨架原型只載所需部件，不載完整舊身體／剪影／武學圖集。失圖用同件縮圖。 */
export function loadActorAssets():Promise<ActorAssets>{return pending??=(async()=>{
 let simplified=false;
 const image=(url:string)=>new Promise<HTMLImageElement>((resolve,reject)=>{const im=new Image(),timer=setTimeout(()=>{im.onload=null;im.onerror=null;reject(new Error('角色素材載入逾時'));},6000);im.onload=()=>{clearTimeout(timer);resolve(im);};im.onerror=()=>{clearTimeout(timer);reject(new Error('角色素材未能載入'));};im.src=url;});
 const load=async(src:string)=>{try{return await image(window.__jianghuActorAssets?.[src]??`${import.meta.env.BASE_URL}${src}`);}catch{const data=(embedded as Record<string,string>)[src]??(headFallback as Record<string,string>)[src];if(!data)throw new Error('角色素材未能載入');simplified=true;return image(data);}};
 const [parts,headImages,weapons]=await Promise.all([
  Promise.all(Object.entries(atlas).map(async([outfit,entries])=>[outfit,Object.fromEntries(await Promise.all(Object.entries(entries).map(async([part,def])=>[part,await load(def.src)])))])),
  Promise.all(Object.entries(heads.heads).map(async([id,src])=>[id,await load(src)])),
  Promise.all(['sword','blade','spear','staff'].map(async id=>[id,await load(`ink/spar/weapon-${id}.webp`)])),
 ]);
 return{parts:Object.fromEntries(parts) as ActorAssets['parts'],heads:Object.fromEntries(headImages) as ActorAssets['heads'],weapons:Object.fromEntries(weapons),simplified};
})().catch(e=>{pending=null;throw e;});}
const skinCache=new WeakMap<ActorAssets,Map<string,number[]>>();
function skinFor(assets:ActorAssets,a:CharacterAppearance):number[]{let cache=skinCache.get(assets);if(!cache){cache=new Map();skinCache.set(assets,cache);}const old=cache.get(a.head);if(old)return old;const im=assets.heads[a.head],bind=HEAD_BIND[a.head],c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const x=c.getContext('2d',{willReadFrequently:true})!;x.drawImage(im,0,0);const d=x.getImageData(0,0,c.width,c.height).data,sum=[0,0,0];let count=0;for(let yy=0;yy<c.height;yy++)for(let xx=0;xx<c.width;xx++){const i=(yy*c.width+xx)*4,y=(yy/c.height-bind.y)*bind.height;if(y> -27&&y< -8&&Math.abs(xx/c.width-bind.x)<.16&&d[i+3]>180&&d[i]>140&&d[i]-d[i+1]>10&&d[i]-d[i+2]>23){for(let k=0;k<3;k++)sum[k]+=d[i+k];count++;}}const out=count?sum.map(v=>v/count):[215,188,162];cache.set(a.head,out);return out;}
const tintCache=new WeakMap<ActorAssets,Map<string,HTMLCanvasElement>>();
/** 每件每色只調色一次，像素迴圈不在每幀執行；固定上限。 */
export function actorPart(assets:ActorAssets,a:CharacterAppearance,part:RigPart):CanvasImageSource {
 let cache=tintCache.get(assets);if(!cache){cache=new Map();tintCache.set(assets,cache);}const skinPart=['neck','handOpen','handGrip'].includes(part),key=`${a.outfit}:${a.tone}:${part}:${skinPart?a.head:''}`,old=cache.get(key);if(old)return old;
 const im=assets.parts[a.outfit][part],c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const x=c.getContext('2d',{willReadFrequently:true})!;x.drawImage(im,0,0);const pix=x.getImageData(0,0,c.width,c.height),d=pix.data,col=APPEARANCE_COLOURS[a.tone];
 const skin=skinPart?skinFor(assets,a):null;let reference=[0,0,0],count=0;if(skin)for(let i=0;i<d.length;i+=4)if(d[i+3]>128&&d[i]>140&&d[i]-d[i+1]>10&&d[i]-d[i+2]>23){for(let k=0;k<3;k++)reference[k]+=d[i+k];count++;}if(count)reference=reference.map(v=>v/count);
 for(let i=0;i<d.length;i+=4)if(skin&&count&&d[i+3]&&d[i]>140&&d[i]-d[i+1]>10&&d[i]-d[i+2]>23){for(let k=0;k<3;k++)d[i+k]=Math.min(255,d[i+k]*skin[k]/reference[k]);}
 else if(d[i+3]&&d[i+2]>d[i]+5&&d[i+2]>=d[i+1]){const s=(d[i]*.2126+d[i+1]*.7152+d[i+2]*.0722)/92;const luminance=d[i]*.2126+d[i+1]*.7152+d[i+2]*.0722,chroma=a.tone==='ink'?1:.62;for(let k=0;k<3;k++)d[i+k]=Math.min(247,luminance*(1-chroma)+col[k]*s*chroma);}
 x.putImageData(pix,0,0);cache.set(key,c);if(cache.size>120)cache.delete(cache.keys().next().value!);return c;
}
const headCache=new WeakMap<ActorAssets,Map<string,HTMLCanvasElement>>();
/** 保留原頭的臉、髮及鬍鬚，只羽化原圖底部膚色接縫。 */
export function actorHead(assets:ActorAssets,a:CharacterAppearance):CanvasImageSource {
 let cache=headCache.get(assets);if(!cache){cache=new Map();headCache.set(assets,cache);}const old=cache.get(a.head);if(old)return old;
 const im=assets.heads[a.head],b=HEAD_BIND[a.head],c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const x=c.getContext('2d',{willReadFrequently:true})!;x.drawImage(im,0,0);const p=x.getImageData(0,0,c.width,c.height),d=p.data;
 for(let y=0;y<c.height;y++)for(let xx=0;xx<c.width;xx++){const i=(y*c.width+xx)*4;d[i+3]*=neckSkinOpacity(d[i],d[i+1],d[i+2],(y/c.height-b.y)*b.height);}
 x.putImageData(p,0,0);cache.set(a.head,c);return c;
}
