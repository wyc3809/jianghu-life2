/** 第26項原型：全屏攝影機只改美術座標，唔改戰鬥數值。 */
export const BATTLE_CAMERA = { actorScaleHeight: 260, widthRatio: .75, ground: .81 } as const;
/** 生成直向場景檢視後嘅石板接地位置（測試美術參數）。 */
export const BATTLE_PORTRAIT_GROUND = .865;

/** 長畫布唔放大角色至佔半屏，按手機闊度保持約62–68px身高。 */
export function battleMotionHeight(width: number): number {
  return Math.min(BATTLE_CAMERA.actorScaleHeight, Math.max(160, width * BATTLE_CAMERA.widthRatio));
}

/** 保留四季位圖比例，同時將同一石台腳底映射到新畫布地面。 */
export function fitBattleBackdrop(width: number, height: number, sourceWidth: number, sourceHeight: number, sourceGround: number) {
  const scale = Math.max(width / sourceWidth,
    height * BATTLE_CAMERA.ground / (sourceHeight * sourceGround),
    height * (1 - BATTLE_CAMERA.ground) / (sourceHeight * (1 - sourceGround)));
  const dw = sourceWidth * scale;
  const dh = sourceHeight * scale;
  return { x: (width - dw) / 2, y: height * BATTLE_CAMERA.ground - dh * sourceGround, width: dw, height: dh };
}
