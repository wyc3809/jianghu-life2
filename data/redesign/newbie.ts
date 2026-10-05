/**
 * 新手試煉（design/agreed-design-2026-10.md §2：挑戰 → 得到有用裝備 → 裝備後變強 → 下一個目標）。
 * 敵人、獎勵屬實作選擇（md 冇指定），玩家睇圖後可改。
 */
export const NEWBIE_TRIAL = {
  eventId: 'newbie_trial',
  title: '新手試煉',
  foeName: '武館陪練',
  /** 鐵刀（攻擊 10），開局舊劍攻擊 4 */
  rewardGearId: 'iron-blade',
  rewardMoney: 20,
} as const;
