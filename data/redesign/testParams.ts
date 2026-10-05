/**
 * 改版測試參數（`design/agreed-design-2026-10.md` 未定嘅數值）。
 *
 * ⚠ 呢度每個值都係**臨時測試參數**，唔係玩家確認嘅設計：
 *   玩家睇圖試玩之後可以改，唔好抄入 GDD 當定案。
 *   每項寫明：md 原文狀態、點解揀呢個值。
 */

/**
 * 修為儲備上限＝現境界上限 × 呢個比例。
 * md §4：上限原本「未確認」；**玩家睇完第 1 步截圖後確認照用 50%**（2026-10-05）。
 */
export const TEST_CULTIVATION_RESERVE_RATIO = 0.5;

/**
 * 突破成功後儲備點釋放：全數撥入新境界（以新境界上限為頂，多出留返儲備）。
 * md §4：釋放方式「未確認」。揀「即時全撥」係最易理解、唔使額外操作。
 */
export const TEST_CULTIVATION_RESERVE_RELEASE: 'instant' = 'instant';
