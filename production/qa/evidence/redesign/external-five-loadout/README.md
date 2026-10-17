# 五門只計外功：更正原型

玩家指出「武學5門淨係計外功」。外功五格；內功與身法沿用原本各一門獨立欄位，全部跨派自由配搭。外功滿五門仍可另換內功或身法。未升版本、未上線，仍喺草稿PR #121。

- `layout.jpg`：同一人物頁上段五門外功，下段獨立內功／身法。
- `comparison.jpg`：上一版混合五格同本次外功五格紅框對比。改前引用731f03f真實手機圖，改後用專門「五門外功已滿＋內功身法」fixture；兩者seed42，但裝備名單唔相同，唔作數值平衡對比。
- Chromium／WebKit390×844、DPR2原始截圖喺同目錄；減少動態，真WebGL揭曉。卡池矩陣保留2D、關WebGL後備，三種手機尺寸320／390／420。
- 存檔測試包含正式版舊三主修、上一版混合五格、分離後讀回、支援欄明確卸下後不自動填回，以及收藏卷數保留。

627項Vitest／86檔、Pages build（含tsc）、narrate hard-fail0。105項真WebGL揭曉／導向人物／五外功加獨立內功身法／不額外收費／存檔／觸控；367項六派／雙池／保底／收藏／分類手機檢查，全過，無pageerror。屬手機尺寸模擬，唔當iPhone實機／TestFlight已驗收。詳見兩份browser-qa.json及validation.json。

重跑（Vite5177）：

```bash
PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1 node scripts/qa/captureGachaQuickEquip.mjs
QA_EVIDENCE_DIR=production/qa/evidence/redesign/external-five-loadout/schools QA_TITLE_FONT=1 PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1 node scripts/qa/captureSchoolGacha.mjs
```
