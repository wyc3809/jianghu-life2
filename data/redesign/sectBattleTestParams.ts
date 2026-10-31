/** 第57項同場混戰原型測試值；未定為正式門派戰平衡、週期或經濟。 */
export const SECT_BATTLE_TEST = {
  teamSize: 10, tick: .05, maxSeconds: 90, width: 1000, depth: 620,
  speed: 142, reach: 104, rangedReach: 235, separation: 78,
  windup: .28, segmentGap: .24, recovery: .58,
  splashRadius: 110, splashPower: .35, maxSplash: 2,
  flankAngle: .68, hurtSeconds: .14, knockbackMax: 48, knockbackBase: 10, knockbackDamageDivisor: 12,
} as const;
