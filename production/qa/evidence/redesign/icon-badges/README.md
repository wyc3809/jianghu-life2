# 菱形圖示實際驗收

情境：seed42、完成新手、銀兩103、免費玉石600、無待處理事件；390×844、DPR2。其他寬度320／420同情境。掛機會持續累積修為，捲去各分頁拍攝時數值會隨時間更新。

- `comparison.png`：改前／改後實際截圖，紅框圖示改動；字體NotoSansCJK，環境未有文泉驛。
- `pages.png`：主畫面／人物／修煉實際畫面。
- `gacha-390.png`：秘笈閣实际圖示及卡池入口。
- `press.gif`：實際按壓及背景原有動態，唔係動畫概念。
- `validation.json`：26項瀏覽器檢查，全通過，無頁面錯誤或失敗請求。
- `original-390.png`：改之前嘅預設介面，唔係已拒絕A／B。
- `home/person/practice/gacha-320/390/420.png`：手機寬度證據；主畫面390同時保留為`after-390.png`。

重新驗證：Vite5175啟動後 `node scripts/qa/captureIconBadges.mjs`；再 `python scripts/qa/packageIconBadges.py`。原版基線來自改之前；腳本保留原版演武台座標作尺寸比較。

570項Vitest、build、audit:narrate通過；build仍有原有大chunk提示。只係本機瀏覽器驗證，未喺實體手機測試。未上線，演武台保持原樣。
