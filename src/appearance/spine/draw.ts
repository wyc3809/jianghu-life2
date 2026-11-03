import { readAppearance } from '@interfaces/appearance';
import { WEAPON_SPRITES } from '../../spar/rig';
import { SPINE_CATALOG, spineFrame, spineSkinKey } from './frames';
import type { AppearanceAssets } from '../assets';
import type { AppearanceDraw } from '../model';

const weaponFor = (family: string) => ({ sword: 'sword', blade: 'blade', spear: 'spear', halberd: 'spear', hook: 'sword', staff: 'staff', flute: 'staff', whip: 'whip', bow: 'bow', needle: 'hidden', dart: 'hidden' } as Record<string, string>)[family];

/** 頭頸胸與手腳已由同一Spine姿勢輸出；每幀只畫整體，兵器讀同一幀握點。 */
export function drawSpineAppearance(ctx: CanvasRenderingContext2D, assets: AppearanceAssets, value: unknown, o: AppearanceDraw): void {
  const pose = o.pose ?? 'idle', a = readAppearance(value), skin = SPINE_CATALOG.skins[spineSkinKey(a)], catalog = SPINE_CATALOG;
  const kind = o.quality === 'portrait' ? pose === 'seated' ? 'seated' : 'idle' : 'atlas';
  const image = assets.spine!.get(a, kind); if (!image) return;
  const sourceW = (image as HTMLCanvasElement).width, sourceH = (image as HTMLCanvasElement).height;
  const full = kind === 'atlas' && sourceW > catalog.frameWidth;
  const time = o.motionTime ?? (pose === 'attack' ? (o.time ?? 0) / .72 * catalog.clips.attack.duration : pose === 'hurt' ? (o.time ?? 0) / .26 * catalog.clips.hurt.duration : o.time ?? 0);
  const index = full ? spineFrame(pose, time, o.reduced) : kind === 'seated' ? catalog.clips.seated.start : 0;
  const unit = o.height / catalog.pixelsPerHeight, [ox, oy] = catalog.origin;
  ctx.save(); ctx.translate(o.x, o.y); ctx.scale(o.face ?? 1, 1);
  const weaponKind = weaponFor(o.family ?? 'fist'), weapon = weaponKind ? assets.weapons[weaponKind] : undefined, def = weaponKind ? WEAPON_SPRITES[weaponKind] : undefined;
  const body = () => {
    if (full) {
      const [x, y, w, h, dx, dy] = skin.rects[index];
      ctx.drawImage(image, x, y, w, h, (dx - ox) * unit, (dy - oy) * unit, w * unit, h * unit);
    } else ctx.drawImage(image, 0, 0, sourceW, sourceH, -ox * unit, -oy * unit, catalog.frameWidth * unit, catalog.frameHeight * unit);
  };
  body();
  if (weapon && def && pose !== 'seated' && pose !== 'down') {
    const [x, y, angle] = skin.grips[index], length = weaponKind === 'staff' || weaponKind === 'spear' ? .54 * o.height : weaponKind === 'hidden' ? .095 * o.height : .375 * o.height;
    const scale = length / Math.hypot(def.tip.x - def.grip.x, def.tip.y - def.grip.y);
    ctx.save(); ctx.translate((x - ox) * unit, (y - oy) * unit); ctx.rotate(angle);
    ctx.drawImage(weapon, -def.grip.x * scale, -def.grip.y * scale, def.w * scale, def.h * scale); ctx.restore();
    // 同一整體幀的握拳局部作前景遮擋；不是另一隻手，亦沒有獨立更新。
    const r = o.height * .022;
    ctx.save(); ctx.beginPath(); ctx.rect((x - ox) * unit - r, (y - oy) * unit - r, r * 2, r * 2); ctx.clip(); body(); ctx.restore();
  }
  ctx.restore();
}
