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
import finger from './fallback/finger.webp?inline';
import staff from './fallback/staff.webp?inline';
import whip from './fallback/whip.webp?inline';
import bow from './fallback/bow.webp?inline';
import hook from './fallback/hook.webp?inline';
import halberd from './fallback/halberd.webp?inline';
import flute from './fallback/flute.webp?inline';
import mechanism from './fallback/mechanism.webp?inline';
import dart from './fallback/dart.webp?inline';
import type { MartialFamily } from './martialPoses';
export const MARTIAL_FALLBACK: Record<MartialFamily, string> = { fist, palm, kick, needle, sword, blade, spear, internal, step, weiqi, finger, staff, whip, bow, hook, halberd, flute, mechanism, dart };
/** 嵌入後備真正來自邊套圖；比例要按實際人物，唔按未載到嘅招式。 */
export const MARTIAL_FALLBACK_ART: Record<MartialFamily, string> = {
  fist: 'art_river_fist', palm: 'art_stone_palm', kick: 'art_wind_chase', needle: 'tm_flying_needle',
  sword: 'art_rain_sword', blade: 'art_thunder_blade', spear: 'art_spear_cloud', internal: 'art_iron_body',
  step: 'qg_broken_bridge', weiqi: 'art_weiqi_trap', finger: 'qy_mist_step', staff: 'art_staff_iron',
  whip: 'art_whip_silk', bow: 'art_bow_star', hook: 'art_hook_silk', halberd: 'art_heavy_halberd',
  flute: 'th_flute_sword', mechanism: 'tm_thousand_mech', dart: 'tm_poison_dart',
};
const ready = new Map<MartialFamily, HTMLImageElement>();
/** 換武學嗰一刻先解碼最低限度姿勢，主圖下載期間都唔顯示錯誤兵器。 */
export function martialFallbackImage(family: MartialFamily): HTMLImageElement | null {
  if (typeof Image === 'undefined') return null;
  let im = ready.get(family);
  if (!im) { im = new Image(); im.src = MARTIAL_FALLBACK[family]; ready.set(family, im); }
  return im.complete && im.naturalWidth > 0 ? im : null;
}
