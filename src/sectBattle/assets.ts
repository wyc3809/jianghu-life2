import mapping from "./assets.json";
import shadowFallback from "./shadow-fallback.json";
import {HERO_SIL,HERO_WALK_FRAMES,HERO_ATK_FRAMES} from "../spar/silhouetteDraw";
import embedded from "./fallback.json";
import {
  loadSectPreviewImages,
  type SectPreviewImages,
  sectAssetUrl,
} from "../prototypes/sectBattle/assets";
export type WarPose =
  | "idle"
  | "walkA"
  | "walkB"
  | "windup"
  | "strikeA"
  | "followA"
  | "strikeB"
  | "followB"
  | "hurt"
  | "guard"
  | "down"
  | "jump";
export interface WarAssets {
  common: SectPreviewImages;
  images: Record<string, HTMLImageElement>;
  weapons: Record<string, HTMLImageElement>;
  bodies: Record<string, Record<WarPose, HTMLImageElement>>;
  simplified: boolean;
}
let pending: Promise<WarAssets> | null = null;
/** 既有素材及正式斗笠黑影只解碼一次；缺幀用同尺寸黑影待機後備。 */
export function loadWarAssets(): Promise<WarAssets> {
  return (pending ??= (async () => {
    let simplified = false;
    const image = (path: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const im = new Image(),
          timer = setTimeout(() => {
            im.onload = null;
            im.onerror = null;
            reject(new Error("會武素材載入逾時"));
          }, 6000);
        im.onload = () => {
          clearTimeout(timer);
          resolve(im);
        };
        im.onerror = () => {
          clearTimeout(timer);
          reject(new Error("會武素材未能載入"));
        };
        im.src = path;
      });
    const load = async (path: string) => {
      try {
        return await image(sectAssetUrl(path));
      } catch {
        simplified = true;
        return image((embedded as Record<string, string>)[path]);
      }
    };
    const [common, images, bodies, weapons, silhouettes] = await Promise.all([
      loadSectPreviewImages(),
      Promise.all(
        Object.entries(mapping.images).map(async ([key, path]) => [
          key,
          await load(path),
        ]),
      ),
      Promise.all(
        Object.entries(mapping.bodies).map(async ([key, frames]) => [
          key,
          Object.fromEntries(
            await Promise.all(
              Object.entries(frames).map(async ([frame, path]) => [
                frame,
                await load(path),
              ]),
            ),
          ),
        ]),
      ),
      Promise.all(
        Object.entries(mapping.weapons).map(async ([key, path]) => [
          key,
          await load(path),
        ]),
      ),
      Promise.all(Object.entries({idle:HERO_SIL.idle,walkA:HERO_WALK_FRAMES[0],walkB:HERO_WALK_FRAMES[2],windup:HERO_ATK_FRAMES[0],strikeA:HERO_ATK_FRAMES[1],followA:HERO_ATK_FRAMES[2],strikeB:HERO_ATK_FRAMES[1],followB:HERO_ATK_FRAMES[2]}).map(async([key,spec])=>{
        let im:HTMLImageElement;try{im=await image(spec.src);}catch{simplified=true;im=await image(shadowFallback.idle);}
        return ['sil-'+key,im] as const;
      })),
    ]);
    return {
      common,
      images: Object.fromEntries([...images,...silhouettes]),
      bodies: Object.fromEntries(bodies),
      weapons: Object.fromEntries(weapons),
      simplified: simplified || common.simplified,
    };
  })().catch((error) => {
    pending = null;
    throw error;
  }));
}
