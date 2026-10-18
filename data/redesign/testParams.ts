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
/** 「珍本奇功」池：每抽出珍本（非心願）嘅機率，其餘出免費池武學——玩家要求高階更難抽（2026-10-07）：17.5% → 6% */
export const GACHA_PREMIUM_RATE = 0.06;

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

/** 戰力階級門檻：首版測試參數，跟綜合實戰能力，唔跟威望。 */
export const COMBAT_RATING_TIERS = [
  { min: 0, label: '初窺門徑' }, { min: 500, label: '初出茅廬' },
  { min: 1000, label: '略有小成' }, { min: 2000, label: '嶄露鋒芒' },
  { min: 4000, label: '登堂入室' }, { min: 8000, label: '爐火純青' },
  { min: 16000, label: '一代高手' }, { min: 32000, label: '宗師之境' },
] as const;
/**
 * 演武難度曲線（玩家 2026-10-14：修正撞牆，但主角氣血唔可以亂加）。
 * 舊版敵人血同攻擊一齊每關 ×1.18，主角氣血幾乎唔升 → 第 20 幾關一擊倒地。
 * 新版分開兩條：
 * - 血量每關 ×1.18：同主角攻擊（境界 ×1.32＋武學成長）對齊，過唔過關睇攻擊。
 * - 攻擊每關 ×1.032：約等於主角氣血跟境界自然成長（境界 0→14 約 ×3.3，約 38 關），一擊唔會打走大半血。
 */
export const SPAR_FOE_HP_GROWTH = 1.18;
export const SPAR_FOE_ATK_GROWTH = 1.032;
/** 首領血量、攻擊倍率（相對小兵）；舊版 7／2.2，新角色打唔過第 1 關首領 */
export const SPAR_BOSS_HP_MUL = 4;
export const SPAR_BOSS_ATK_MUL = 2.2;
/** 有回血武學：每打低一個小兵／精英回幾多氣血（過關已經回滿，取代舊「過關回 35%」） */
export const SPAR_KILL_HEAL = 0.12;
/** 綜合戰力顯示權重；首版測試參數，唔會反過來改戰鬥結果。 */
export const COMBAT_RATING_WEIGHTS = { attack: 4, hpDivisor: 5, qiDivisor: 10, lifesteal: 2 } as const;

/** 第28項A：小冊容量（試作可調）；尾冊補同派配套，唔令任何舊武學消失。 */
export const SCHOOL_GACHA_POOL_MIN = 6;
export const SCHOOL_GACHA_POOL_MAX = 8;

/** 玩家確認：最多五門外功，流派自由配搭；內功及身法各一門獨立計算。 */
export const MARTIAL_LOADOUT_LIMIT = 5;
