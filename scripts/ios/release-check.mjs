/** 已知未完成項目不應誤報為可上傳；此檢查不讀取或印出簽署金鑰。 */
import fs from 'node:fs';
const readiness = JSON.parse(fs.readFileSync('production/ios/release-readiness.json', 'utf8'));
const open = readiness.checks.filter(check => check.done !== true);
if (open.length) {
  for (const check of open) console.error(`${check.id}：${check.detail}`);
  console.error('工程可編譯；TestFlight上傳條件尚未齊備。');
  process.exitCode = 1;
}
if (!/^\d+$/.test(process.env.APP_STORE_APP_ID || '')) {
  console.error('需設定已確認的APP_STORE_APP_ID，避免使用另一App或重複build號。');
  process.exitCode = 1;
}
