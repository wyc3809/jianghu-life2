# 過月菱形牌章驗收

seed42、完成新手、103銀兩、600免費玉石；390×844、DPR2。掛機照常累積；50%進度、滿修為及過勞狀態為另外注入嘅QA情境。

- `comparison.png`：改前圓鈕／改後菱形牌章，紅框位置。
- `states.png`：一般「過一月」、滿修為「突破」、過勞停用；直接裁切及放大實際截圖，唔重畫UI。
- `advance.gif`：實際按壓並推進月份。
- `home-320/390/420.png`：手機寬度；`half-390.png`為50%修為進度。
- `baseline.json`：改前演武台位置及尺寸。
- `validation.json`：17項全通過；三個手機寬度、觸控尺寸、任務欄不重疊、實際過月、修為進度、過勞停用、朱砂突破及其原有行為、減少動態、圖片載入；無頁面錯誤或失敗請求。

570項Vitest、build、audit:narrate通過。build仍有原有大chunk提示；未喺實體手機驗證，未上線。

重跑：Vite5175啟動後 `node scripts/qa/captureMonthBadge.mjs`，再 `python scripts/qa/packageMonthBadge.py`。對照字體NotoSansCJK，環境冇文泉驛。
