import mapping from "./assets.json";
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
/** 同一張原畫解碼一次；網絡失效用同姿勢縮圖，不換人或改用黑影。 */
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
    const [common, images, bodies, weapons, heads] = await Promise.all([
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
      Promise.all(
        Object.entries(mapping.heads).map(async ([key, path]) => [
          key,
          await load(path),
        ]),
      ),
    ]);
    return {
      common: {
        ...common,
        wardrobe: {
          ...common.wardrobe,
          heads: Object.fromEntries(heads) as typeof common.wardrobe.heads,
        },
      },
      images: Object.fromEntries(images),
      bodies: Object.fromEntries(bodies),
      weapons: Object.fromEntries(weapons),
      simplified: simplified || common.simplified,
    };
  })().catch((error) => {
    pending = null;
    throw error;
  }));
}
