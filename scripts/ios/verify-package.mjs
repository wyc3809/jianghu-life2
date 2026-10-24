/** 驗證實際同步資源、原圖、版本及本機載入設定；不宣稱已簽署。 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
const dir = 'ios/App/App/public';
const fail = message => { throw new Error(message); };
const html = fs.readFileSync(`${dir}/index.html`, 'utf8');
const assets = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m => m[1]).filter(u => u.startsWith('/assets/'));
if (!assets.length || html.includes('/jianghu-life2/assets/')) fail('iOS必須用mobile根路徑打包');
for (const asset of assets) if (!fs.existsSync(path.join(dir, asset.slice(1)))) fail(`缺少資源：${asset}`);
const script = assets.find(a => /index-.*\.js$/.test(a));
if (!script) fail('找不到遊戲主程式');
const bundle = fs.readFileSync(path.join(dir, script.slice(1)), 'utf8');
const expected = fs.readFileSync('src/version.ts', 'utf8').match(/APP_VERSION = '([^']+)'/)[1];
if (!bundle.includes(expected)) fail('iOS遊戲版本不一致');
const config = JSON.parse(fs.readFileSync('ios/App/App/capacitor.config.json', 'utf8'));
if (config.server?.url || config.server?.cleartext || config.server?.allowNavigation?.length) fail('發布包不可載入開發server或放寬導航');
if (config.server?.hostname && config.server.hostname !== 'localhost') fail('更改儲存origin會失去舊本機存檔');
const project = fs.readFileSync('ios/App/App.xcodeproj/project.pbxproj', 'utf8');
const ids = [...project.matchAll(/PRODUCT_BUNDLE_IDENTIFIER = ([^;]+);/g)].map(m => m[1]);
if (ids.length !== 2 || ids.some(id => id !== config.appId)) fail('Xcode與Capacitor Bundle ID不一致');
if (!project.includes('PrivacyInfo.xcprivacy in Resources')) fail('缺少App私隱manifest資源');
const hash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
let count = 0;
for (const file of fs.readdirSync('public', { recursive: true, withFileTypes: true })) {
  if (!file.isFile()) continue;
  const source = path.join(file.parentPath, file.name);
  const relative = path.relative('public', source);
  const target = path.join(dir, relative);
  if (!fs.existsSync(target) || hash(source) !== hash(target)) fail(`資源遺漏或不同：${relative}`);
  count++;
}
if (!fs.existsSync('ios/App/CapApp-SPM/Package.swift')) fail('缺少Swift package工程');
console.log(JSON.stringify({ gameVersion: expected, appId: config.appId, entryAssets: assets.length,
  publicFilesVerified: count, localWebAssets: true, signingVerified: false, xcodeCompileVerified: false }));
