import { CodexRenderBudget } from './codexRenderBudget';

/** 寶箱／秘笈／令牌共用：連續慢幀先減粒子，再降低動態3D解像度。 */
export class HighlightRenderBudget {
  private resolution: CodexRenderBudget;
  private slow = 0;
  private level = 0;
  constructor(dpr: number) { this.resolution = new CodexRenderBudget(dpr); }
  /** 不因單次載入或背景停留降質；DOM文字及卡面不在此預算內。 */
  sample(elapsedMs: number): number {
    if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) { this.slow = 0; return this.resolution.sample(0); }
    if (this.level < 2) {
      this.slow = elapsedMs > 42 ? this.slow + 1 : 0;
      if (this.slow === 3) { this.level++; this.slow = 0; }
      return this.resolution.sample(0);
    }
    // 背景由活動通知重設歷史；連續超慢的可見幀仍須降質，不能永遠被當成背景。
    return this.resolution.sample(Math.min(1000, elapsedMs));
  }
  get effects(): number { return [1, .65, .4][this.level]; }
  /** 靜止結果恢復原解像度，保持材質細節。 */
  settle(): number { this.level = 0; this.slow = 0; return this.resolution.settle(); }
}
