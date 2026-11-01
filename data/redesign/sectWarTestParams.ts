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
