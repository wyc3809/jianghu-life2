# 底部小任務欄驗收

seed42、完成新手、銀兩103、免費玉石600、待收成128；390×844、DPR2。320／420同情境；掛機數值喺驗證過程照常增加。新手換裝及滿修為係另外注入嘅QA情境。

- `comparison.png`：改前大型目標卡／改後底部小任務欄，紅框標示改動。
- `after-390.png`、`home-320/390/420.png`：實際主畫面。
- `details-320/390/420.png`及`details.gif`：任務完整詳情可展開／收起。
- `equip-390.png`、`breakthrough-390.png`：保留換装及突破按鈕。
- `validation.json`：18項全通過，無頁面錯誤或失敗圖片請求。檢查手機無橫向溢出、欄高≤80px、不遮住過月按鈕、詳情、分頁隱藏、收成及換裝行為、突破按鈕。

重跑：Vite5175啟動後 `node scripts/qa/captureTaskBar.mjs`，再 `python scripts/qa/packageTaskBar.py`。原版基線係改之前捕捉；字體因環境冇文泉驛而改用NotoSansCJK。

570項Vitest、build、audit:narrate通過。build仍有原有大chunk提示；未喺實體手機驗證。未上線，演武台冇改。
