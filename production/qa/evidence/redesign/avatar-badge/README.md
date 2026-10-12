# 左上菱形人物入口

seed42、完成新手、103銀兩、600玉石；390×844、DPR2。320／420同情境；掛機／對打正常運行。

- `comparison.png`：真實改前／改後頂欄裁切，紅框左上人物入口。
- `after-390.png`、`home-*`：實際全頁截圖。
- `press.gif`：實際按壓並進入人物頁。
- `validation.json`：10項檢查通過，無頁面錯誤或失敗圖片請求；三個手機尺寸、觸控大小、牌章文字／年齡、入口操作、減少動態及圖片載入。

574項Vitest、build、audit:narrate通過，未上線，先交圖。未喺實體手機驗證。

重跑：Vite5175後 `node scripts/qa/captureAvatarBadge.mjs`、`python scripts/qa/packageAvatarBadge.py`。字體NotoSansCJK，環境冇文泉驛。
