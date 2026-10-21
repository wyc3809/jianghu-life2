/** 第32項本機雙帳戶原型參數；全部係驗收用值，未定為正式經濟／保護規則。 */
export const ONLINE_TEST = {
  protectionMs: 30_000,
  presenceLeaseMs: 8_000,
  heartbeatMs: 2_000,
  battleMs: 1_500,
  onlineSilverPerMinute: 10,
  offlineSilverPerMinute: 1,
  offlineCapMs: 48 * 60 * 60 * 1_000,
  maxRounds: 40,
  sessionMs: 24 * 60 * 60 * 1_000,
  maxPublicPlayers: 100,
} as const;
