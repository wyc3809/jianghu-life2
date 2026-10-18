/** 逐門生成式位圖特效：只讀真實結果，粒子保留自己張圖，換招唔會串圖。 */
export interface IdentityTextures { signature?: HTMLImageElement; detail?: HTMLImageElement; finish?: HTMLImageElement }
export interface IdentityFxPoint { x: number; y: number }
interface InkLayer { image: HTMLImageElement; x: number; y: number; size: number; aspect: number; age: number; delay: number; life: number; rotation: number; drift: number; alpha: number }
export interface IdentityImpact {
  textures: IdentityTextures; hero: IdentityFxPoint; target: IdentityFxPoint; height: number;
  premium: boolean; support: boolean; crit: boolean; killed: boolean; damage: number; quiet: boolean;
}
/** 固定預算嘅畫面層，無 RNG／計時器／戰鬥回呼；唔會產生傷害或控制。 */
export class MartialIdentityFx {
  private layers: InkLayer[] = [];
  get count(): number { return this.layers.length; }
  clear(): void { this.layers = []; }
  /** 外功落空唔出命中；內功及身法只喺自身運氣／移步。 */
  impact(s: IdentityImpact): void {
    if (s.quiet || (!s.support && s.damage <= 0)) return;
    const at = s.support ? s.hero : s.target;
    const add = (image: HTMLImageElement | undefined, p: IdentityFxPoint, size: number, life: number, delay = 0, rotation = 0, alpha = .72, drift = 0) => {
      if (!image) return;
      this.layers.push({ image, x: p.x, y: p.y, size: size * s.height, aspect: 1, age: 0, delay, life, rotation, drift: drift * s.height, alpha });
    };
    add(s.textures.signature, at, s.premium ? 1.6 : .76, s.premium ? .58 : .3, 0, 0, s.premium ? .95 : .72);
    if (s.premium) {
      add(s.textures.detail, s.hero, 1.05, .62, .025, -.16, .68, .12);
      add(s.textures.detail, at, .8, .45, .09, .22, .7, -.1);
      if (s.crit && !s.support) {
        add(s.textures.signature, at, 2, .5, .065, -.12, .56);
        add(s.textures.finish, at, 1.3, .55, .13, .15, .85, .1);
      }
      if (s.killed && !s.support) {
        add(s.textures.finish, at, 2.2, .78, .1, 0, .95, .2);
        add(s.textures.detail, at, 1.4, .8, .2, -.3, .65, -.15);
      }
    }
    // 頂多同時40張小位圖；舊圖自然釋放，唔保留已切走嘅整套圖集。
    if (this.layers.length > 40) this.layers.splice(0, this.layers.length - 40);
  }
  /** 暫停由舞台統一控制，恢復唔補發事件。 */
  step(dt: number): void {
    const step = Math.max(0, Math.min(.1, dt));
    for (const layer of this.layers) layer.age += step;
    this.layers = this.layers.filter(p => p.age < p.delay + p.life);
  }
  /** 手繪位圖合成，唔畫程序人物、符號或假命中。 */
  draw(ctx: CanvasRenderingContext2D): void {
    for (const p of this.layers) {
      const age = p.age - p.delay;
      if (age < 0) continue;
      const t = Math.min(1, age / p.life); const ease = 1 - (1 - t) ** 3;
      const size = p.size * (.68 + ease * .38);
      ctx.save(); ctx.translate(p.x + p.drift * t, p.y - p.size * .08 * t); ctx.rotate(p.rotation * ease);
      ctx.globalAlpha *= p.alpha * Math.min(1, t * 12) * (1 - t) ** .7;
      ctx.drawImage(p.image, -size / 2, -size / 2, size, size); ctx.restore();
    }
  }
}
