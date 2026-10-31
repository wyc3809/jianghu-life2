import type { SectBattleFigure, SectBattleReplay } from '@interfaces/sectBattle';
import { drawAppearance } from '../../appearance/model';
import type { SectPreviewImages } from './assets';

export interface SectBattleHitbox { id: string; x: number; y: number; radius: number }
const COLOURS = ['#3f6868', '#a43c30'];

/** 深度只決定遮擋次序，人物不隨走位／出招忽大忽小。 */
export class SectBattleRenderer {
  private width = 390;
  private height = 460;
  private dpr = 1;
  private bars: HTMLCanvasElement[] = [];
  private rings: HTMLCanvasElement[] = [];
  hitboxes: SectBattleHitbox[] = [];
  constructor(private canvas: HTMLCanvasElement, private assets: SectPreviewImages) {
    for (const colour of COLOURS) {
      this.bars.push(this.tint(assets.images.bar, colour));
      this.rings.push(this.tint(assets.images.ring, colour));
    }
  }
  private tint(im: HTMLImageElement | undefined, colour: string): HTMLCanvasElement {
    const canvas = document.createElement('canvas'); canvas.width = im?.naturalWidth ?? 1; canvas.height = im?.naturalHeight ?? 1;
    const ctx = canvas.getContext('2d')!;
    if (im) { ctx.drawImage(im, 0, 0); ctx.globalCompositeOperation = 'source-in'; ctx.fillStyle = colour; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    return canvas;
  }
  resize(): void {
    const box = this.canvas.getBoundingClientRect(); this.width = box.width; this.height = box.height;
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.max(1, Math.round(this.width * this.dpr)); this.canvas.height = Math.max(1, Math.round(this.height * this.dpr));
  }
  point(figure: { x: number; y: number }): { x: number; y: number } {
    return { x: figure.x / 1000 * (this.width - 16) + 8, y: this.height * .62 };
  }
  /** 固定戰報取樣；拖動選人、暫停、跳結果只改播放游標。 */
  draw(replay: SectBattleReplay, seconds: number, selected: string | null, reduced = false): void {
    const ctx = this.canvas.getContext('2d'); if (!ctx) return;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); ctx.clearRect(0, 0, this.width, this.height);
    ctx.fillStyle = '#f6f0e3'; ctx.fillRect(0, 0, this.width, this.height);
    // 只留一筆地線，所有人物共用同一落腳高度。
    if (this.assets.images.rail) { ctx.globalAlpha = .6; ctx.drawImage(this.assets.images.rail, 4, this.height * .62, this.width - 8, 3); ctx.globalAlpha = 1; }
    const index = Math.min(replay.frames.length - 1, Math.max(0, Math.floor(seconds / .05)));
    const frame = replay.frames[index], next = replay.frames[Math.min(replay.frames.length - 1, index + 1)];
    const mix = reduced ? 0 : Math.max(0, Math.min(1, (seconds - frame.at) / .05));
    const figures = frame.figures.map((u, i) => ({ ...u, x: u.x + (next.figures[i].x - u.x) * mix, y: u.y + (next.figures[i].y - u.y) * mix }));
    this.hitboxes = [];
    const size = Math.max(29, Math.min(43, this.width * .095));
    for (const u of [...figures].sort((a, b) => a.y - b.y || a.id.localeCompare(b.id))) {
      const point = this.point(u), alive = u.hp > 0;
      if (this.assets.images.shadow) { ctx.globalAlpha = alive ? .36 : .14; ctx.drawImage(this.assets.images.shadow, point.x - size * .4, point.y - 4, size * .8, 9); ctx.globalAlpha = 1; }
      if (alive) {
        const ringSize = u.id === selected ? size * 1.05 : size * .66;
        ctx.globalAlpha = u.id === selected ? .95 : .54;
        ctx.drawImage(this.rings[u.side], point.x - ringSize / 2, point.y - ringSize * .15, ringSize, ringSize * .32);
        ctx.globalAlpha = 1;
      }
      this.figure(ctx, u, seconds, size, reduced);
      if (alive && u.id === selected) {
        const barW = size * .7, top = point.y - size - 8;
        if (this.assets.images.rail) ctx.drawImage(this.assets.images.rail, point.x - barW / 2, top, barW, 4);
        ctx.save(); ctx.beginPath(); ctx.rect(point.x - barW / 2, top, barW * Math.max(0, u.hp / u.maxHp), 4); ctx.clip();
        ctx.drawImage(this.bars[u.side], point.x - barW / 2, top, barW, 4); ctx.restore();
        ctx.font = `${u.id === selected ? 'bold ' : ''}10px sans-serif`; ctx.textAlign = 'center'; ctx.fillStyle = COLOURS[u.side];
        ctx.fillText(String(u.rank), point.x, top - 3);
      }
      if (alive) this.hitboxes.push({ id: u.id, x: point.x, y: point.y - size * .5, radius: Math.max(22, size * .65) });
    }
    if (!reduced) {
      const recent = replay.events.filter(e => seconds >= e.at && seconds - e.at < .55);
      for (const event of recent.slice(-8)) {
        const actor = figures.find(u => u.id === event.actor), target = figures.find(u => u.id === event.target); if (!actor || !target) continue;
        const age = seconds - event.at, hit = this.point(event), origin = this.point(actor);
        if (age < .18 && event.damage > 0) {
          const sprite = /needle|dart|bow/.test(event.skillId) ? this.assets.images.spark : this.assets.images.slash;
          if (sprite) {
            ctx.save(); ctx.globalAlpha = (1 - age / .18) * .75; ctx.translate(hit.x, hit.y - size * .48);
            ctx.rotate(Math.atan2(hit.y - origin.y, hit.x - origin.x)); ctx.drawImage(sprite, -size * .35, -size * .26, size * .7, size * .52); ctx.restore();
          }
        }
        if (event.damage > 0 && (selected === event.actor || selected === event.target || actor.rank === 1)) {
          ctx.globalAlpha = 1 - age / .55; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.strokeStyle = '#f8f1e3'; ctx.lineWidth = 3;
          ctx.strokeText(String(Math.round(event.damage)), hit.x, hit.y - size * .72 - age * 24);
          ctx.fillStyle = '#893a2d'; ctx.fillText(String(Math.round(event.damage)), hit.x, hit.y - size * .72 - age * 24); ctx.globalAlpha = 1;
        }
      }
    }
    if (selected) {
      const u = figures.find(v => v.id === selected);
      if (u && u.hp > 0) {
        const point = this.point(u); ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.strokeStyle = '#f8f1e3'; ctx.lineWidth = 3;
        const label = `${u.name}${u.rank === 1 ? ' · 掌門' : ''}`, x = Math.min(this.width - 70, Math.max(70, point.x));
        ctx.strokeText(label, x, point.y + 20); ctx.fillStyle = COLOURS[u.side]; ctx.fillText(label, x, point.y + 20);
      }
    }
  }
  private figure(ctx: CanvasRenderingContext2D, u: SectBattleFigure, seconds: number, size: number, reduced: boolean): void {
    const point = this.point(u), elapsed = Math.max(0, seconds - u.poseAt);
    const family = /sword/.test(u.artId) ? 'sword' : /blade/.test(u.artId) ? 'blade' : /spear/.test(u.artId) ? 'spear' : /staff/.test(u.artId) ? 'staff' : /needle/.test(u.artId) ? 'needle' : 'fist';
    ctx.save(); if (u.pose === 'down') ctx.globalAlpha = .35;
    drawAppearance(ctx, this.assets.wardrobe, u.appearance, { x: point.x, y: point.y, height: size, face: u.face, pose: u.pose, time: u.pose === 'walk' ? seconds : elapsed, family, reduced });
    ctx.restore();
  }
}
