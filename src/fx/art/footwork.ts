/** 畫面步線以身高計，唔參與射程、閃避或核心位置。珍本觀潮保持貼地，唔套踏雲騰空。 */
const STEPS: Record<string, readonly [number, number, number]> = {
  art_bridge_step: [.18, 0, .5], art_nine_shadow: [.3, 0, 2],
  qg_broken_bridge: [.13, 0, 1], qg_snow_track: [.13, .015, 1], qg_swallow_turn: [.2, .1, 1.5],
  qg_feiyan: [.28, .38, .5], qg_canopy_void: [.16, .24, 1], qg_reed_drift: [.2, .035, 1],
  qg_wall_cat: [.08, .23, 1], qg_lotus_steps: [.12, .025, 1], tm_shadow_step: [.26, 0, 1.5],
  wg_silent_step: [.1, 0, 1], art_ink_illusion: [.3, .06, 2], pr_cloud_step: [.22, .65, 1],
  pr_shadow_flash: [.4, 0, 2], pr_tide_step: [.24, .015, 1],
};
/** 只回傳呈現偏移；減少動態固定原地，所有武學開始／結束都回到原點。 */
export function martialFootwork(id: string, progress: number, quiet = false): { dx: number; dy: number } {
  const s = STEPS[id]; const p = Math.max(0, Math.min(1, progress));
  if (!s || quiet || p === 0 || p === 1) return { dx: 0, dy: 0 };
  return { dx: s[0] * Math.sin(p * Math.PI * 2 * s[2]) * Math.sin(p * Math.PI), dy: s[1] * Math.sin(p * Math.PI) ** 2 };
}
