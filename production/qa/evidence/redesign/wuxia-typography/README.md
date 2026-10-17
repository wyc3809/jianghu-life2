# 武俠遊戲字體原型證據

玩家要求藝術風格更遊戲化，並補充主要係字體。先交六派／武學題字原型；未升版本／未上線，正式版仍EA0.73.0。

- `comparison.jpg`：真實改前／改後紅框，seed42、390×844、DPR2。改前直接引用772203a嘅 `school-names/chromium-jianghu-長河疊浪.png`；改後本次真實渲染，同一流派／同一小冊。
- `six-schools-crop.jpg`：改後真正選派區放大，只裁出截圖，文字冇重畫。
- `main-arts-comparison.jpg`：同一多適性fixture人物主修字體對比；另外有收藏、人物及兩種貨幣卡池嘅Chromium／WebKit截圖。
- `browser-qa.json`：355項兩瀏覽器手機檢查通過、無pageerror。320×690、390×844、420×844，DPR2；完整繁中題字已載入、定位用UI字款、標籤不截字、觸控尺寸、舊心願／保底、扣款、分類及主修多適性排版。
- `font-loading-qa.json`：37項Chromium／WebKit實際字體檢查通過；新題字從遊戲自身載入、真正font-face loaded狀態、故意封鎖WOFF2後嘅error狀態及可讀後備、390／320不溢出、保留貨幣純數字字款及無描邊。其他原有入口嘅外部Google字款另有記錄，唔假稱整個遊戲已移除外部字體。
- `build-validation.json`：本機Pages構建預覽三項檢查通過；帶 `/jianghu-life2/` base嘅hash字體檔HTTP200、font/woff2、內容同已審閱字體一致、完整OFL授權隨遊戲分發。呢個唔係線上部署驗證。
- `equip-regression/`：真正WebGL揭曉／十連結果原地即裝回歸，61項通過，無pageerror，報告見同目錄JSON。

字體係LXGW WenKai TC Bold嘅654字形子集，210,120 bytes（約205KiB），支援全部103門武學、招式／七卷名、四種武學階位及六派題字。生成前已核對來源SHA256同完整字符覆蓋，輸出後再讀WOFF2確認cmap完整。Vite會為字體檔加內容hash，`font-display: swap`保留後備顯示。授權及來源版本：[美術記錄](../../../../../design/art/wuxia-typography/README.md)。

主UI矩陣用減少動態／無WebGL後備；另外跑真正WebGL即裝。以上係桌面瀏覽器手機尺寸模擬，未當iPhone實機或TestFlight已驗收。今次無新增動效，無新增動圖。615項Vitest（85檔）、453項瀏覽器檢查、Pages build、narrate hard-fail0通過。

重跑（Vite 127.0.0.1:5177）：

```bash
npx vitest run
npm run build:pages
npm run audit:narrate
QA_TITLE_FONT=1 QA_EVIDENCE_DIR=production/qa/evidence/redesign/wuxia-typography PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1 node scripts/qa/captureSchoolGacha.mjs
PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1 node scripts/qa/checkWuxiaTypography.mjs
QA_EVIDENCE_DIR=production/qa/evidence/redesign/wuxia-typography/equip-regression PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1 node scripts/qa/captureGachaQuickEquip.mjs
python scripts/qa/packageWuxiaTypography.py
VITE_BASE=/jianghu-life2/ npm run preview -- --host 127.0.0.1 --port 5180 --strictPort
```
