# EA0.75.0 發布驗證

玩家於2026-10-18授權上線。發布內容係五門外功、內功身法各一門獨立欄位，以及「馬上裝備」導向人物自行選欄位。

- validation.json：627項Vitest／86檔、Pages build（含tsc）、narrate hard-fail0及版本／構建內容檢查。
- local/browser.json：正式構建普通UI17項驗證。真實建立隔離新角色、三頁少時抉擇、領取模擬玉石、抽一卷秘笈、導航前不自動裝備、人物選欄位裝備、重新載入保留裝備及手機觸控。冇注入fixture／測試store，冇載入開發模組。
- local/*.png：390×844、DPR2實際截圖；閉關所得係重新載入時正常彈窗，腳本會以真按鈕收取再核對裝備。
- 原型472項手機回歸及存檔轉換證據見 ../external-five-loadout/；屬Chromium／WebKit手機尺寸模擬，未當iPhone實機或TestFlight已驗收。

重跑正式構建UI（本機先開Pages base preview5180）：

```bash
node scripts/qa/checkReleaseEquipment.mjs
QA_BASE_URL=https://wyc3809.github.io/jianghu-life2/ QA_EVIDENCE_DIR=production/qa/evidence/redesign/release-ea075/live node scripts/qa/checkReleaseEquipment.mjs
```

正式網址版本、部署工作流程同線上UI驗證會喺部署完成後另外記錄。
