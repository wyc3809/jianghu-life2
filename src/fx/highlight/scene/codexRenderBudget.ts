/** 連續慢幀才降低翻冊3D解像度；DOM文字不變，結果恢復完整解像度。 */
export class CodexRenderBudget {
  private slow = 0;
  private current: number;
  readonly maximum: number;
  constructor(dpr: number) { this.maximum = Math.max(.5, Math.min(2, dpr)); this.current = this.maximum; }
  /** 忽略切回前台的長停頓；連續三幀超過42ms才降一級，避免單次載圖引起來回切換。 */
  sample(elapsedMs: number): number {
    if (elapsedMs <= 0 || elapsedMs > 1000) { this.slow = 0; return this.current; }
    this.slow = elapsedMs > 42 ? this.slow + 1 : 0;
    if (this.slow >= 3) {
      this.current = Math.max(Math.min(.8, this.maximum), this.current - .25); this.slow = 0;
    }
    return this.current;
  }
  /** 靜止結果只畫一次，不以動態降低的解像度交付收藏畫面。 */
  settle(): number { this.current = this.maximum; this.slow = 0; return this.current; }
}
