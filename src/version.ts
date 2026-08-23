/**
 * 遊戲顯示版本（Early Access）。
 *
 * 格式：EA{主}.{次}[.{修}]
 * - 修（EA0.1.1）：文案、樣式、小 bug、設定類微調
 * - 次（EA0.2）：可感功能／內容進度（族譜、題眼、系統面板等）
 * - 主（EA1.0）：大階段里程碑；離開 Early Access 時再議正式號
 *
 * 每次合併可遊玩改動時，按改變幅度升一檔，並同步改本檔與 package.json。
 */
export const APP_VERSION = 'EA0.17.0';

export const APP_VERSION_LABEL = `版本 ${APP_VERSION}`;
