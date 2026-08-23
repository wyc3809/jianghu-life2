/**
 * 戰鬥視覺系統 — 已改用 CSS-based InkCombatFxLayer
 * Canvas 粒子系統已移除（用戶反饋視覺效果不佳）
 */
export function useCombatCanvas() {
  return {
    canvasRef: { current: null as HTMLCanvasElement | null },
    spawnHit: () => {},
    spawnQi: () => {},
    spawnCombo: () => {},
    spawnGuard: () => {},
    triggerHitstop: () => {},
    clear: () => {},
  };
}
