import type { CapacitorConfig } from '@capacitor/cli';

/** iPhone 版載入隨 App 打包嘅遊戲；唔依賴 Pages 網址先可以開卷。 */
const config: CapacitorConfig = {
  appId: process.env.IOS_BUNDLE_ID || 'com.wyc3809.jianghulife2',
  appName: '江湖一生',
  webDir: 'dist',
  ios: { contentInset: 'never' },
};

export default config;
