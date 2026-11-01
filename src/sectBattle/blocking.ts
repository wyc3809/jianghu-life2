import type { SectBattleFigure } from "@interfaces/sectBattle";

// 依選定直版稿的十個人物位置量度；一條前景地線不等於所有人物共用一個螢幕Y。
const BLOCKING = [
  [0.3, 0.5, 0.57],
  [0.02, 0.58, 0.45],
  [0.23, 0.6, 0.46],
  [0.41, 0.7, 0.47],
  [0.03, 0.78, 0.48],
  [0.24, 0.81, 0.49],
  [0.41, 0.9, 0.5],
  [0.0, 0.99, 0.52],
  [0.2, 1.0, 0.56],
  [0.4, 1.0, 0.53],
] as const;

/** 原稿的斜向交錯景深；比例對每名人物固定，不參與距離、命中或戰果計算。 */
export function warBlocking(
  u: SectBattleFigure,
  width: number,
  height: number,
  seconds: number,
  reduced: boolean,
) {
  const slot = BLOCKING[Math.max(0, Math.min(9, u.rank - 1))];
  const size = Math.min(width * slot[2], height * 0.53);
  const side = u.side === 0 ? 1 : -1;
  const travel = Math.max(-1, Math.min(1, (u.x - 500) / 400)) * width * 0.045;
  const elapsed = Math.max(0, seconds - u.poseAt);
  const lunge =
    !reduced && u.pose === "attack"
      ? Math.sin(Math.min(1, elapsed / 0.36) * Math.PI) * width * 0.032
      : 0;
  const hurt =
    !reduced && u.pose === "hurt"
      ? -Math.sin(Math.min(1, elapsed / 0.18) * Math.PI) * width * 0.018
      : 0;
  return {
    x:
      (u.side === 0 ? slot[0] : 1 - slot[0]) * width +
      travel +
      (lunge + hurt) * side,
    y: Math.min(height - 2, Math.max(slot[1] * height, size * 0.82 + 10)),
    size,
    depth: slot[1],
    face: side,
    aerial: u.rank === 1,
  };
}
