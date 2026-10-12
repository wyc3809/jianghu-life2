# 頂欄對齊及疲勞進度條

seed42、完成新手、103銀兩、600玉石；390×844、DPR2。320／420同情境；對打、掛機照常運行。疲勞半滿／滿額係另外注入嘅QA情境，行動點會照常恢復。

- `comparison.png`：實際改前／改後頂欄，紅框右上文字及三個數值。
- `after-390.png`、`home-*`：實際全頁。
- `fatigue-half-390.png`、`fatigue-full-390.png`：疲勞條與數字同步。
- `hud.gif`：頂欄及原有遊戲動態。
- `validation.json`：15項通過，無頁面錯誤或失敗請求；三種手機闊度、貨幣／設定字位、標籤／條／數字列位、移除墨、疲勞比例、設定／玉石入口及江湖頁疲勞條。

575項Vitest、build、audit:narrate通過。冇改遊戲數值／存檔／演武邏輯；只移除原本DEV頂欄墨按鈕，其他診斷工具仍保留。未喺實體手機驗證，未上線。

重跑：Vite5175後 `node scripts/qa/captureHudAlignment.mjs`、`python scripts/qa/packageHudAlignment.py`。對照字體NotoSansCJK，環境冇文泉驛。
