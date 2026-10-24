/** 同步App識別與版本；保持已安裝App的Bundle ID及儲存origin穩定。 */
import fs from 'node:fs';
const id = process.env.IOS_BUNDLE_ID || 'com.wyc3809.jianghulife2';
const version = process.env.IOS_MARKETING_VERSION || '1.0';
const build = process.env.IOS_BUILD_NUMBER || '1';
if (!/^[A-Za-z][A-Za-z0-9-]*(\.[A-Za-z0-9-]+){2,}$/.test(id)) throw new Error('IOS_BUNDLE_ID格式不正確');
if (!/^\d+\.\d+(\.\d+)?$/.test(version)) throw new Error('IOS_MARKETING_VERSION格式不正確');
if (!/^[1-9]\d*$/.test(build)) throw new Error('IOS_BUILD_NUMBER必須是正整數');
const project = 'ios/App/App.xcodeproj/project.pbxproj';
let text = fs.readFileSync(project, 'utf8');
for (const [key, value] of Object.entries({ PRODUCT_BUNDLE_IDENTIFIER: id, MARKETING_VERSION: version, CURRENT_PROJECT_VERSION: build })) {
  text = text.replace(new RegExp(`${key} = [^;]+;`, 'g'), `${key} = ${value};`);
}
fs.writeFileSync(project, text);
const configPath = 'ios/App/App/capacitor.config.json';
if (fs.existsSync(configPath)) {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  if (config.appId !== id) throw new Error('Capacitor與Xcode Bundle ID不同；請重新執行ios:sync');
}
console.log(`iOS：${id}；Apple版本${version}；build ${build}`);
