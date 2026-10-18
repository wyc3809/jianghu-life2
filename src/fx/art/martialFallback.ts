/** 最小低動態後備，嵌入正確持武嘅靜態姿勢；網絡完全失敗亦唔退返通用劍影。 */
import fist from './fallback/fist.webp?inline';
import palm from './fallback/palm.webp?inline';
import kick from './fallback/kick.webp?inline';
import needle from './fallback/needle.webp?inline';
import sword from './fallback/sword.webp?inline';
import blade from './fallback/blade.webp?inline';
import spear from './fallback/spear.webp?inline';
import internal from './fallback/internal.webp?inline';
import step from './fallback/step.webp?inline';
import weiqi from './fallback/weiqi.webp?inline';
import type { MartialFamily } from './martialPoses';
export const MARTIAL_FALLBACK: Record<MartialFamily, string> = { fist, palm, kick, needle, sword, blade, spear, internal, step, weiqi };
const ready = new Map<MartialFamily, HTMLImageElement>();
/** 換武學嗰一刻先解碼最低限度姿勢，主圖下載期間都唔顯示錯誤兵器。 */
export function martialFallbackImage(family: MartialFamily): HTMLImageElement | null {
  if (typeof Image === 'undefined') return null;
  let im = ready.get(family);
  if (!im) { im = new Image(); im.src = MARTIAL_FALLBACK[family]; ready.set(family, im); }
  return im.complete && im.naturalWidth > 0 ? im : null;
}
