# 淺色冊頁藝術框原型證據

玩家要求框可以更有藝術感。新作生成式原畫用喺六派、武學卡、人物主修、收藏及抽卡結果，保留已做楷筆題字。今次先交圖，未升版本／未發布，正式版仍EA0.73.0。

- `comparison.jpg`：真實改前／改後紅框，seed42、390×844、DPR2。改前直接引用c4744b3嘅 `wuxia-typography/chromium-jianghu-長河疊浪.png`；改後本次同一流派／同一冊渲染。
- `main-arts-comparison.jpg`／`collection-comparison.jpg`：人物主修及家族收藏真實對比。新篩選把「全部」獨立成44px細欄，下面六派排三列。
- `chromium-school-tabs.png`／`webkit-school-tabs.png`：真正選派區截圖，正常選中朱砂框。
- `*-keyboard-focus.png`：另外保留鍵盤焦點外框證據；正常預覽截圖會移走鍵盤焦點，唔抹走或重畫圖片。
- 兩種卡池、主修多適性、人物／收藏嘅Chromium／WebKit全頁截圖一併保留；框冇壓住DOM文字，內容仍按原有分頁容器閱讀。
- `browser-qa.json`：355項兩瀏覽器手機檢查通過。320×690、390×844、420×844，DPR2；保留六派全名／楷筆字載入、觸控、舊心願／保底、扣款、原地即裝、分類、主修多適性及固定外框。
- `frames-qa.json`：49項兩瀏覽器檢查通過。四種WebP真實解碼512×512、九宮格及選中框、裝飾層唔攔截點擊、鍵盤焦點／Enter換真卡池、淡紙soft-light而唔係灰色噪點、珍本名單與淡金框一致、320／390排版、故意封鎖框圖片後仍可辨認選中同操作。
- `equip-regression/`：真正WebGL十連揭曉及結果即裝回歸61項通過，無pageerror，結果見同目錄報告。

原始atlas、設計方向及來源：[藝術記錄](../../../../../design/art/wuxia-frames/README.md)。原圖1254×1254；只裁四格、縮至512×512及轉WebP，唔用程式重畫框。四張合共317,592 bytes（約310KiB），九宮格保留角位細節；框圖完整hash見manifest。

主UI矩陣用減少動態／無WebGL後備，另外測真正WebGL即裝。以上係桌面手機尺寸模擬，未當iPhone實機／正常動態性能／TestFlight已驗收。今次無新增動效，無新增動圖；演武台、主頁及遊戲數值不變。615項Vitest（85檔）、465項瀏覽器檢查、Pages build、narrate hard-fail0通過；本機Pages四種框路徑／內容hash檢查亦通過，詳見build-validation.json。

重跑（Vite 127.0.0.1:5177）：

```bash
python scripts/art/prepare_wuxia_frames.py
npx vitest run
npm run build:pages
npm run audit:narrate
QA_TITLE_FONT=1 QA_EVIDENCE_DIR=production/qa/evidence/redesign/wuxia-art-frames PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1 node scripts/qa/captureSchoolGacha.mjs
PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1 node scripts/qa/checkWuxiaFrames.mjs
QA_EVIDENCE_DIR=production/qa/evidence/redesign/wuxia-art-frames/equip-regression PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1 node scripts/qa/captureGachaQuickEquip.mjs
python scripts/qa/packageWuxiaFrames.py
```
