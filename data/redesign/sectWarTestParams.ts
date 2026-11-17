/** 門派會武封測規則；每週一香港時間04:00換屆，首屆滿十人可先成隊。 */
export const SECT_WAR_TEST = {
  teamSize: 10,
  weekMs: 7 * 86400000,
  epoch: Date.parse("1970-01-04T20:00:00Z"),
  selectionCooldownMs: 60000,
  maxMembers: 200,
  engineVersion: 2,
} as const;
/** 名額合共十席；不覆寫單機門派地位或武學解鎖。 */
export function sectWarOffice(rank: number): string {
  return rank === 1 ? "掌門" : rank <= 3 ? "長老" : rank <= 6 ? "執事" : "代表";
}
/**
 * 本屆會武職位 → 可穿職位服（content/sects/sects.json 地位：7 掌門、6 長老、4 門中執事、3 真傳弟子）。
 * 只限本屆、本門；單機門派地位已解鎖嘅照舊（2026-11-16 連動檢視 L5，玩家揀「對應職位」）。
 */
export function sectWarSeatStanding(rank: number): number {
  return rank === 1 ? 7 : rank <= 3 ? 6 : rank <= 6 ? 4 : 3;
}
/** 本屆會武職位每週免費玉石（玩家揀「較保守」；待試玩）。 */
export const SECT_WAR_WEEKLY_JADE = { master: 180, elder: 120, deacon: 90, delegate: 60 } as const;
export function sectWarSeatJade(rank: number): number {
  const j = SECT_WAR_WEEKLY_JADE;
  return rank === 1 ? j.master : rank <= 3 ? j.elder : rank <= 6 ? j.deacon : j.delegate;
}
