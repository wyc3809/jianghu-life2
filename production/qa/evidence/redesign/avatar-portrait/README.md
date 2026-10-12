# 無字水墨頭像驗收

seed42、完成新手、103銀兩、600玉石；390×844、DPR2。320／420同情境，掛機及對打照常运行。

- `comparison.png`：實際頂欄裁切；改前有「人物」字樣，改後面部頭像無文字。
- `after-390.png`、`home-*`：真實遊戲全頁。
- `press.gif`：實際按壓及進人物頁。
- `validation.json`：11項通過，無頁面錯誤或失敗圖片請求；包含觸控大小、手機溢出、冇文字、年齡、入口、減少動態、新頭像及圖片載入。

574項Vitest、build、audit:narrate通過。通用頭像，未按角色性別／年齡／門派自動換面；未喺實體手機驗證，未上線。

重跑：Vite5175後 `node scripts/qa/captureAvatarPortrait.mjs`、`python scripts/qa/packageAvatarPortrait.py`。字體NotoSansCJK，環境冇文泉驛。
