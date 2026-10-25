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
 * 突破失敗扣走現境界上限嘅比例（要儲返滿先可以再試）。
 * 原本失敗保留修為、即刻可以再撳，成功率形同虛設（2026-10-25 審計 B1，玩家揀「失敗扣修為」；比例待試玩）。
 */
export const TEST_BREAKTHROUGH_FAIL_XP_LOSS = 0.2;
/**
 * 銀兩用途（2026-10-25 審計 B4：600 個月後幾千兩冇用處，玩家揀四項、用建議值；待試玩）。
 */
export const TEST_SILVER_SINKS = {
  /** 醫館大療傷：費用＝氣血上限 × 呢個數（最少 15 兩），一次回滿 */
  fullHealPerMaxHp: 0.1,
  /** 門派捐獻：費用＝呢個數 × (地位＋1)，必得一次晉升，每月一次 */
  sectDonateBase: 100,
  /** 銀兩換書頁：每次幾多兩、換幾多頁、每日幾次（香港時間凌晨四時換日） */
  pagesSilverCost: 200,
  pagesPerExchange: 10,
  pagesDailyLimit: 3,
  /** 精鑄：費用＝呢個數 × (境界＋1)；品質跟境界，第 14 境封頂 */
  fineForgeBase: 40,
} as const;
/** 主動歸隱傳位最低境界（第 8 境洗髓伐毛；金盆洗手事件唔限）——2026-10-25 審計 C2 */
export const RETIRE_MIN_TIER = 8;
/**
 * 舊事件 maxAge → 境界上限：取消歲數後童年／少年事件喺頂境照出（家道中落、門派收徒等），
 * 改按境界收（2026-10-25 審計 C1，玩家揀「改跟境界門檻」）。按 maxAge 由細到大揀第一格。
 */
export const LEGACY_MAX_AGE_TIER: readonly { maxAge: number; maxTier: number }[] = [
  { maxAge: 12, maxTier: 1 },
  { maxAge: 20, maxTier: 3 },
  { maxAge: 30, maxTier: 5 },
  { maxAge: 40, maxTier: 7 },
  { maxAge: 50, maxTier: 9 },
  { maxAge: 65, maxTier: 11 },
];
/**
 * 主動玩送嘅修為＝當刻掛機速率 × 秒數（境界越高自動越多）。
 * 原本固定 1–5／110 點，對比每境數萬至百萬上限等於零（2026-10-25 審計 B2，玩家揀「按掛機速率計」；秒數待試玩）。
 */
export const TEST_ACTIVE_CULTIVATION_SECONDS = {
  /** 演武台過一關（首領倒下） */
  sparStageClear: 600,
  /** 每個事件了結 */
  eventResolve: 60,
  /** 江湖交手勝出（按對手強度） */
  combatWin: { weak: 120, normal: 180, strong: 300, boss: 900 },
} as const;

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
/** 非保底抽取出武功嘅機率；其餘直接派書頁——玩家確認20%（2026-10-22） */
export const GACHA_ART_RATE = 0.2;
/** 未中武功派幾多書頁——測試參數；沿用200頁兌換江湖武學。 */
export const GACHA_PAGES_PER_PULL = 5;
/** 命中武功後直接揀心願嘅條件機率（未到保底前）——測試參數 */
export const GACHA_WISH_RATE = 0.025;
/** 「珍本奇功」池：命中武功、未直接揀心願時出珍本嘅條件機率，其餘出免費池武學。 */
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
export const JADE_PER_ACHIEVEMENT = 15; // 帳戶首次達成
export const JADE_PER_MILESTONE = 60; // 家族里程碑（首次）

/**
 * 測試版：每日領一次嘅「付費玉石（測試額度）」＝一次十連；唔係真錢。
 * 原本撳一下＝一次保底（2400）而且冇上限，令免費玉石設計失效（2026-10-25 審計 A2，玩家揀每日一次 600）。
 */
export const TEST_PAID_JADE_GRANT = GACHA_COST_PER_PULL * 10;

/** 戰力階級門檻：首版測試參數，跟綜合實戰能力，唔跟威望。 */
export const COMBAT_RATING_TIERS = [
  { min: 0, label: '初窺門徑' }, { min: 500, label: '初出茅廬' },
  { min: 1000, label: '略有小成' }, { min: 2000, label: '嶄露鋒芒' },
  { min: 4000, label: '登堂入室' }, { min: 8000, label: '爐火純青' },
  { min: 16000, label: '一代高手' }, { min: 32000, label: '宗師之境' },
] as const;
/**
 * 第38項演武完整回合候選曲線（待玩家驗收）。
 * 每門已學招式按卷序連出，敵人再還擊一次；後續關卡的HP／攻擊成長提高。
 * 前三關以攻擊緩衝保留新角色入門，之後固定按關數成長，不跟玩家配裝偷偷同步加強。
 */
export const SPAR_FOE_HP_GROWTH = 1.21;
export const SPAR_FOE_ATK_GROWTH = 1.045;
/** 首領血量、攻擊倍率（相對小兵）；第38項候選血量4.4，攻擊倍率2.2沿用。 */
export const SPAR_BOSS_HP_MUL = 4.4;
export const SPAR_BOSS_ATK_MUL = 2.2;
/** 有回血武學：每打低一個小兵／精英回幾多氣血（過關已經回滿，取代舊「過關回 35%」） */
export const SPAR_KILL_HEAL = 0.12;
/** 第38項候選值：前三關保留入門緩衝，其後使用完整敵人攻擊。 */
export const SPAR_OPENING_ATK_FACTORS = [0.5, 0.68, 0.84] as const;
/** 綜合戰力顯示權重；首版測試參數，唔會反過來改戰鬥結果。 */
export const COMBAT_RATING_WEIGHTS = { attack: 4, hpDivisor: 5, qiDivisor: 10, lifesteal: 2 } as const;

/** 第28項A：小冊容量（試作可調）；尾冊補同派配套，唔令任何舊武學消失。 */
export const SCHOOL_GACHA_POOL_MIN = 6;
export const SCHOOL_GACHA_POOL_MAX = 8;

/** 玩家確認：最多五門外功，流派自由配搭；內功及身法各一門獨立計算。 */
export const MARTIAL_LOADOUT_LIMIT = 5;
