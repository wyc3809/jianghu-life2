import type {
  SectBattleFigure,
  SectBattleEvent,
  SectBattleSide,
} from "./sectBattle";
/** 正式戰報的伺服器時間軸：差分二進位，不在玩家裝置重算物理或戰果。 */
export interface SectReplayTape {
  version: 1;
  frames: number;
  figures: SectBattleFigure[];
  arts: string[];
  data: string;
  checksum: string;
  events: SectBattleEvent[];
  duration: number;
  winner: SectBattleSide | null;
  remaining: [number, number];
  seed: number;
}
