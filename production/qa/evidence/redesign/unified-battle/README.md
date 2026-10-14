# 統一戰鬥原型實際驗收

先睇圖，未發布；正式版EA0.72.0。固定seed42、黃問天、三套外功。原型唔寫正式存檔／獎勵；演武首領由第2關隔離checkpoint戰報播放，唔係正式演武即時流程。

- `chromium-spar.png`：演武首領原型，秋季直向石庭。
- `chromium-event.png`：江湖交手原型，春季直向石庭。
- `chromium-event-boss.png`：江湖首領原型。
- `prototype.png`：兩種原型排版並列，唔係概念合成UI。
- `before-after.png`：EA0.72.0與原型實際截圖紅框對照。
- `battle.gif`：真Canvas播放，三套外功輪替、血條及七卷同步；兩倍速度、DPR1錄影，按實際截圖時間差製作GIF；靜態圖同尺寸QA係DPR2。原型技能跟真戰報。
- `build-validation.json`：Pages路徑構建仍顯示原開卷頁、未包含原型戰報／入口；605項Vitest、build及narrate hard-fail0。
- `browser-qa.json`：156項通過；Chromium／WebKit、320／390／420×690／844、DPR2；排版、比例、跳過、重播、武功輪替、自然结束、減少動態及素材請求。

重跑：`npm run dev -- --host 127.0.0.1 --port 5177`，再 `PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1 node scripts/qa/captureUnifiedBattle.mjs`、`node scripts/qa/recordUnifiedBattle.mjs`、`python scripts/qa/packageUnifiedBattle.py`。Playwright由工作環境 `/opt/codex/cua_node/lib/node_modules/playwright/` 提供。SKIP設定只略過工具嘅Linux主機依賴預檢，唔略過瀏覽器遊戲檢查。

改前：`origin/main`（1ec5d641099ddc22594a2bfb653957d5fe625aa2）git archive獨立副本，Vite 5181及獨立cacheDir，注入相同隔離fixture。普通交手係正式3D入口；演武首領係正式SparDuel同Canvas，checkpoint第2關、150/261。前後截圖唔係同一時間點，傷害與季節唔用嚟比較平衡。對照板用NotoSansCJK，環境冇文泉驛。

測試係桌面瀏覽器手機尺寸模擬；真iPhone／TestFlight性能未驗收。底部暫按第二圖嘅「當前外功＋七卷」，選項回覆仍待玩家；夏／冬直向圖亦未加入呢個原型。
