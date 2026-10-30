/** 每個提示只在首次到達該畫面顯示；手動重看才清除這些記錄。 */
export const COACH_HINTS = ['trial', 'equip_home', 'equip_person', 'equip_picker', 'ready', 'legacy_flip', 'legacy_choice', 'legacy_practice'] as const;
export type CoachHint = typeof COACH_HINTS[number];

/** 使用既有flags保存閱讀記錄，兼容沒有此旗標的舊存檔。 */
export function coachHintFlag(hint: CoachHint): string { return `coach_seen_${hint}`; }
