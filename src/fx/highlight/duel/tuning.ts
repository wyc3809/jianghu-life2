/**
 * 高光級打鬥演出：時間同強度參數（全部係測試參數，記錄喺 production/redesign-scope.md 第 14 項）。
 * 秒數係 1 倍速；「加速 ×2」同長戰自動加速都係改 GSAP timeScale，唔改呢度。
 */
export const DUEL_TUNING = {
  /** 開場：墨霧入場＋鏡頭推近＋題字 */
  openSec: 1.2,
  /** 玩家每招（蓄勢 → 揮擊 → 命中 → 收勢） */
  playerBeatSec: 0.78,
  /** 蓄勢佔幾耐 */
  windupSec: 0.22,
  /** 揮擊筆觸畫出嘅時間 */
  slashSec: 0.2,
  /** 敵人還手每招 */
  foeBeatSec: 0.62,
  /** 暴擊 hit-stop */
  hitStopSec: 0.12,
  /** 暴擊全屏墨暈最深 */
  critWashMax: 0.55,
  /** 震屏（世界單位） */
  shake: 0.16,
  critShake: 0.32,
  /** 終結一擊慢鏡 */
  slowMoSec: 0.5,
  slowMoScale: 0.35,
  /** 敵人化墨散開 */
  dissolveSec: 0.9,
  /** 落印之後停幾耐先完 */
  endHoldSec: 1.6,
  /** 長戰：招數超過呢個數就自動加速 */
  longFightHits: 24,
  longFightScale: 1.6,
  /** 粒子上限 */
  particleCap: 300,
  /** 每次命中墨點數（暴擊 ×2） */
  hitSparks: 16,
  /** 敵人化墨粒子數 */
  dissolveSparks: 60,
} as const;
