/** 更新 App target 嘅Bundle ID／版本，避免將簽名設定套到第三方framework。 */
import fs from 'node:fs';
const id=process.env.IOS_BUNDLE_ID || 'com.wyc3809.jianghulife2';
const version=process.env.IOS_MARKETING_VERSION || '1.0';
const build=process.env.IOS_BUILD_NUMBER || '1';
if(!/^[A-Za-z][A-Za-z0-9-]*(\.[A-Za-z0-9-]+){2,}$/.test(id)) throw new Error('IOS_BUNDLE_ID格式唔正確');
if(!/^\d+\.\d+(\.\d+)?$/.test(version)) throw new Error('IOS_MARKETING_VERSION格式唔正確');
if(!/^\d+(\.\d+){0,2}$/.test(build)) throw new Error('IOS_BUILD_NUMBER格式唔正確');
const p='ios/App/App.xcodeproj/project.pbxproj';
let s=fs.readFileSync(p,'utf8');
s=s.replace(/PRODUCT_BUNDLE_IDENTIFIER = [^;]+;/g,`PRODUCT_BUNDLE_IDENTIFIER = ${id};`).replace(/MARKETING_VERSION = [^;]+;/g,`MARKETING_VERSION = ${version};`).replace(/CURRENT_PROJECT_VERSION = [^;]+;/g,`CURRENT_PROJECT_VERSION = ${build};`);
fs.writeFileSync(p,s);
console.log(`iOS：${id}；版本${version}；build ${build}`);
