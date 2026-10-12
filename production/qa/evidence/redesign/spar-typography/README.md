# 演武台字體一致

固定seed42、完成新手、103銀兩、600玉石；390×844、DPR2。320／420同情境。對打及掛機繼續運行，改前後捕圖時間不同，血量／敵人／修為等數字會正常更新。

- `comparison.png`：實際演武區裁切，改後用對打中截圖展示數字；紅框標示演武文字區域。
- `before-390.png`、`after-390.png`、`home-*`：實際全頁。
- `spar-font.gif`：真實對打文字及傷害／暴擊／特性浮字。
- `validation.json`：6項通過，無頁面錯誤或失敗請求；手機溢出、DOM字體、Canvas字體及實際數字繪製記錄。
- `tests/sparTypography.test.ts`另驗證修為／暴擊／受傷／回血／特性五類浮字全部沿用注入嘅UI字體，修為即使有舊字形位圖仍用文字繪製，底圖保留。

575項Vitest、build、audit:narrate通過。未喺實體手機驗證，未上線。

重跑：Vite5175後 `node scripts/qa/captureSparTypography.mjs`、`python scripts/qa/packageSparTypography.py`。對照字體NotoSansCJK，環境冇文泉驛。
