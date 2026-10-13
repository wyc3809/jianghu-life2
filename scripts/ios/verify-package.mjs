/** 檢查打包內容，唔將Linux檢查冒稱為Xcode／簽名驗證。 */
import fs from 'node:fs';
import path from 'node:path';
const dir='ios/App/App/public';const html=fs.readFileSync(`${dir}/index.html`,'utf8');
const assets=[...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m=>m[1]).filter(u=>u.startsWith('/assets/'));
if(!assets.length || html.includes('/jianghu-life2/assets/'))throw new Error('iOS必須用mobile根路徑打包');
for(const a of assets)if(!fs.existsSync(path.join(dir,a.slice(1))))throw new Error(`缺少資源：${a}`);
const script=assets.find(a=>/index-.*\.js$/.test(a));const bundle=fs.readFileSync(path.join(dir,script.slice(1)),'utf8');
const expected=fs.readFileSync('src/version.ts','utf8').match(/APP_VERSION = '([^']+)'/)[1];
if(!bundle.includes(expected))throw new Error('iOS包遊戲版本唔一致');
const config=JSON.parse(fs.readFileSync('ios/App/App/capacitor.config.json','utf8'));
if(config.server?.url)throw new Error('唔可以將開發server網址打入發布包');
if(!fs.existsSync('ios/App/CapApp-SPM/Package.swift'))throw new Error('缺少Swift package工程');
console.log(JSON.stringify({gameVersion:expected,appId:config.appId,bundledAssets:assets.length,localWebAssets:true,signingVerified:false,xcodeCompileVerified:false}));
