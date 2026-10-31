import mapping from './asset-map.json';
import fallback from './asset-fallback.json';
import type { BodyFrame } from './pose';
import type { CharacterAppearance } from '@interfaces/appearance';

export interface AppearanceAssets {
  heads: Record<CharacterAppearance['head'], HTMLImageElement>;
  bodies: Record<CharacterAppearance['outfit'],Record<BodyFrame,HTMLImageElement>>;
  weapons: Record<string,HTMLImageElement>;
  neck?: HTMLImageElement;
  simplified: boolean;
}
declare global { interface Window { __jianghuAppearanceAssets?: Record<string,string> } }
const WEAPONS = ['sword','blade','spear','staff','whip','bow','hidden'];
let pending: Promise<AppearanceAssets> | null = null;

/** 模組只解碼一次；個別網絡圖失效用相同造型的內嵌低解像素材，不換臉或退回黑影。 */
export function loadAppearanceAssets(): Promise<AppearanceAssets> {
  if (pending) return pending;
  pending = (async () => {
    let simplified = false;
    const image = (src:string) => new Promise<HTMLImageElement>((resolve,reject)=>{
      const im=new Image();const timer=setTimeout(()=>{im.onload=null;im.onerror=null;reject(new Error('造型素材載入逾時'));},6000);
      im.onload=()=>{clearTimeout(timer);resolve(im);};im.onerror=()=>{clearTimeout(timer);reject(new Error('造型素材未能載入'));};im.src=src;
    });
    const load = async(path:string):Promise<HTMLImageElement> => {
      try { return await image(window.__jianghuAppearanceAssets?.[path] ?? `${import.meta.env.BASE_URL}${path}`); }
      catch { const embedded=(fallback as Record<string,string>)[path];if(!embedded)throw new Error('造型素材未能載入');simplified=true;return image(embedded); }
    };
    const heads=Object.fromEntries(await Promise.all(Object.entries(mapping.heads).map(async([key,path])=>[key,await load(path)]))) as AppearanceAssets['heads'];
    const bodies=Object.fromEntries(await Promise.all(Object.entries(mapping.bodies).map(async([key,parts])=>[
      key,Object.fromEntries(await Promise.all(Object.entries(parts).map(async([part,path])=>[part,await load(path)]))),
    ]))) as AppearanceAssets['bodies'];
    const weapons=Object.fromEntries(await Promise.all(WEAPONS.map(async key=>{
      try{return [key,await load(`ink/spar/weapon-${key}.webp`)];}catch{return [key,undefined];}
    }))) as AppearanceAssets['weapons'];
    const neck=await load(mapping.neck);
    return {heads,bodies,weapons,neck,simplified};
  })().catch(error=>{pending=null;throw error;});
  return pending;
}
