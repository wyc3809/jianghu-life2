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

/**
 * 掛機銀兩（收成）：每小時 = 基本 + 演武台關數 × 每關加成；最多存 48 小時嘅量。
 * md §4：「銀兩與養成材料繼續累積，沿用最多48小時離線計算時限」——收益率「未確認」。
 * 玩家要求加「收成」掣（2026-10-05）。試值：新角色約 6.5 兩／小時，48 小時約 300 兩
 *（開局身上約 100 兩，演武台每過一關約 2–5 兩），唔會蓋過過月事件同演武收入。
 */
export const TEST_IDLE_SILVER_BASE_PER_HOUR = 6;
export const TEST_IDLE_SILVER_PER_STAGE_PER_HOUR = 0.5;

/* ───────── 第 8 步：玉石・抽卡・心願保底・重複秘笈（design/agreed-design-2026-10.md §3.1、§3.2） ───────── */

/** 每抽價錢（玉石）——玩家揀「每抽 60，40 抽保底」（2026-10-05） */
export const GACHA_COST_PER_PULL = 60;
/** 心願保底：連續幾多抽未出心願，下一抽必出——玩家揀 40 */
export const GACHA_WISH_PITY = 40;
/** 每抽直接出心願嘅機率（未到保底前）——測試參數 */
export const GACHA_WISH_RATE = 0.025;
/** 「珍本奇功」池：每抽出珍本（非心願）嘅機率，其餘出免費池武學——測試參數 */
export const GACHA_PREMIUM_RATE = 0.175;

/** 重複秘笈：升階上限——玩家揀最多 3 次 */
export const MANUAL_MAX_STARS = 3;
/** 每升一階：武學效果＋10%——玩家揀 */
export const MANUAL_STAR_BONUS = 0.1;
/** 一本重複秘笈轉幾多書頁——玩家揀 20 */
export const PAGES_PER_DUPLICATE = 20;
/** 幾多書頁換一門免費池武學——玩家揀 200（換唔到珍本奇功） */
export const PAGES_PER_EXCHANGE = 200;

/** 免費玉石來源（玩家揀晒四項；數量係測試參數） */
export const JADE_PER_MONTH = 3;
export const JADE_PER_SPAR_SCENE = 30; // 演武台每過 10 關
export const JADE_PER_BREAKTHROUGH_BASE = 20; // ＋境界 × 5
export const JADE_PER_BREAKTHROUGH_TIER = 5;
export const JADE_PER_ACHIEVEMENT = 15; // 帳戶首次達成
export const JADE_PER_MILESTONE = 60; // 家族里程碑（首次）

/** 測試版：撳一下領嘅「付費玉石（測試額度）」——等於一次心願保底嘅量；唔係真錢 */
export const TEST_PAID_JADE_GRANT = GACHA_COST_PER_PULL * GACHA_WISH_PITY;
