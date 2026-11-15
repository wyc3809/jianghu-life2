/** 玩家暫停祖蔭／天賦／家傳／跨世繼承。保留舊資料，正式流程不再執行。 */
export const LEGACY_FEATURES_ENABLED = false;

/** 暫停傳承功能事件；一般家庭故事／婚姻子女不受影響。 */
export function isLegacyEventPaused(id: string): boolean {
  return !LEGACY_FEATURES_ENABLED && (id.startsWith('legacy_script_') || id === 'inheritance' || id === 'event_064');
}
