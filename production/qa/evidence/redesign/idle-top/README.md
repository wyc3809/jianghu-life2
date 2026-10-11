# 演武台上方收益欄

情境：seed42、完成新手、103銀兩、600免費玉石、待收成128；390×844、DPR2。掛機繼續累積，後續截圖數字可能隨時間增加。滿額及新手／突破係另外注入嘅測試情境。

- `comparison.png`：改前／改後紅框對照，收益由演武台下方移到上方。
- `after-390.png`、`home-320/390/420.png`：實際手機介面。
- `harvest.gif`：實際撳收成，顯示銀兩增加及按鈕更新。
- `claimed-390.png`、`full-390.png`：空／滿待收成。
- `details-*`、`equip-390.png`、`breakthrough-390.png`：底部任務欄及原有操作保留。
- `validation.json`：30項檢查全部通過，包括收益欄位置、高度、收成觸控高度、手機溢出、任務詳情、收成、空／滿提示、換裝及突破；無頁面錯誤或失敗請求。

演武台隨排版下移，尺寸及引擎／玩法不變。570項Vitest、build、audit:narrate通過；build仍有原有大chunk提示。未喺實體手機測試，未上線。

重跑：啟動Vite5175後 `node scripts/qa/captureIdleTop.mjs`，再 `python scripts/qa/packageIdleTop.py`。對照字體NotoSansCJK，環境未有文泉驛。
