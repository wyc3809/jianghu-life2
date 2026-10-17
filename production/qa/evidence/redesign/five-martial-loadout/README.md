# 五格自由武學裝備原型

未升版本、未上線。工作分支 `work/five-martial-loadout`；正式版仍 EA0.74.0。

- `comparison.jpg`：改前「每類一門」同改後五門跨派配搭，紅框標示裝備區。
- `equip-flow.jpg`：真正十連揭曉「馬上裝備」按鈕，同跳轉人物後由玩家指定欄位。
- `chromium-choose-slot.png`／`chromium-five-equipped.png`：原尺寸手機截圖。五格欄位可喺人物內容區閱讀，外層畫面及底部導航維持固定。
- 改前由 `604a986` 獨立 worktree 真實渲染；改後同 seed42、390×844、DPR2、原三門及同一批十連。截圖用減少動態；揭曉矩陣有真正 WebGL，卡池矩陣只關 WebGL 保留2D後備。
- 對比板用 Pillow 加標題及紅框。規定嘅 wqy 路徑喺環境不存在，改用環境已有 Noto Sans CJK；遊戲字體冇改。

驗證：626項 Vitest／86檔、Pages base build（含 tsc）、narrate hard-fail0。105項真WebGL揭曉、三類跨派指定五格、學習／替換／卸下、唔額外收費、收藏／卷保留、持久化及手機觸控檢查；367項六派／雙池／舊心願保底／收藏及人物分類／多適性／字體檢查，全部通過、無pageerror。詳見 `validation.json`、`browser-qa.json`、`schools/browser-qa.json`。

第一次WebKit390真WebGL揭曉等候45秒逾時，冇計入通過；最終完整重跑105項通過。以上屬Chromium／WebKit手機尺寸模擬，唔當iPhone實機或TestFlight性能驗收。

重跑（先開Vite5177）：

```bash
PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1 node scripts/qa/captureGachaQuickEquip.mjs
QA_EVIDENCE_DIR=production/qa/evidence/redesign/five-martial-loadout/schools QA_TITLE_FONT=1 PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1 node scripts/qa/captureSchoolGacha.mjs
```
