/** 首次內測只核對可建置設定；真機與外測待辦照實列出，不改完成狀態。 */
import fs from 'node:fs';

const readiness = JSON.parse(fs.readFileSync('production/ios/release-readiness.json', 'utf8'));
const version = fs.readFileSync('src/version.ts', 'utf8').match(/APP_VERSION = '([^']+)'/)?.[1];
const errors = [];
const appId = process.env.APP_STORE_APP_ID || '';
if (!/^[1-9]\d+$/.test(appId) || appId !== readiness.appStoreAppId) {
  errors.push('APP_STORE_APP_ID須與玩家提供的App紀錄一致。');
}
if (process.env.IOS_BUNDLE_ID !== readiness.candidateBundleId) {
  errors.push('IOS_BUNDLE_ID須與工程預定的Bundle ID一致。');
}
if (!version || version !== readiness.gameVersion) {
  errors.push(`內測內容版本與準備紀錄不同：遊戲 ${version || '缺少版本'}，準備紀錄 ${readiness.gameVersion || '缺少版本'}。請同步 production/ios/release-readiness.json 後重新建置。`);
}
if (!/^\d+\.\d+(\.\d+)?$/.test(process.env.IOS_MARKETING_VERSION || '')) {
  errors.push('IOS_MARKETING_VERSION須是Apple數字版本。');
}
if (process.env.VITE_ONLINE_PUBLIC !== '1') errors.push('此內測需保留既有江湖入口。');

let projectRef;
try {
  const url = new URL((process.env.VITE_SUPABASE_URL || '').trim());
  if (url.protocol !== 'https:' || url.username || url.password || url.port || url.search || url.hash
    || url.pathname !== '/' || !/^[a-z0-9]+\.supabase\.co$/.test(url.hostname)) throw new Error();
  projectRef = url.hostname.split('.')[0];
} catch {
  errors.push('VITE_SUPABASE_URL須是現有專案的HTTPS Project URL。');
}
const key = (process.env.VITE_SUPABASE_ANON_KEY || '').trim();
if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) {
  try {
    const parts = key.split('.');
    if (parts.length !== 3) throw new Error();
    const claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    if (claims.role !== 'anon' || claims.ref !== projectRef) throw new Error();
  } catch {
    errors.push('VITE_SUPABASE_ANON_KEY須是同一專案的anon或publishable key；不能使用後端金鑰。');
  }
}

if (errors.length) {
  for (const message of errors) console.error(message);
  process.exitCode = 1;
} else {
  console.log(`${version}內測設定格式通過；Apple授權、App識別及簽署仍由實際建置核對。`);
}
console.log('以下未驗收項目僅作待辦紀錄，不會單獨阻擋此內測流程；外測發布仍會檢查。');
for (const check of readiness.checks.filter(check => check.done !== true)) {
  console.log(`未驗收 ${check.id}：${check.detail}`);
}
console.log('本流程僅供App Store Connect內部測試，不能當作外測、真機驗收或商店發布已完成。');
