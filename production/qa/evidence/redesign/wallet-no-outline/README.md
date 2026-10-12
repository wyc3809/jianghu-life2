# 銀兩玉石去描邊

seed42、完成新手、103銀兩、600玉石；390×844、DPR2。320／420同情境；掛機與對打照常运行。

- `comparison.png`：實際改前／改後頂欄，紅框右上銀兩及玉石。
- `after-390.png`、`home-*`：實際全頁。
- `press.gif`：撳玉石後進入秘笈閣。
- `validation.json`：10項通過，無頁面錯誤或失敗請求；手機溢出、無可見外框／底色／陰影、無文字描邊、餘額及入口操作、圖示載入。

575項Vitest、build、audit:narrate通過。鍵盤焦點提示保留；未喺實體手機驗證，未上線。

重跑：Vite5175後 `node scripts/qa/captureWalletNoOutline.mjs`、`python scripts/qa/packageWalletNoOutline.py`。對照字體NotoSansCJK，環境冇文泉驛。
