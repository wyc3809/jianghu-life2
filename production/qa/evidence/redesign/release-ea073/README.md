# EA0.73.0正式流程驗證

玩家「上線全部」批准統一戰鬥、雙方血條置頂、墨暈揭幕及底部外功七卷。呢次驗證真正InkPlayScreen及store，唔係DEV原型入口。

seed42、黃問天、19歲、261氣血、103銀兩、三套外功。演武第2關首領checkpoint開場150/261；只為隔離畫面／結算測試跳過前面小兵，唔係平衡或正常通關示範。勝局武學200、敗局0，冇改正式數值；過關銀兩103→105、stage2→3、氣血261、sparStageClear一次；敗退stage2、銀兩103、冇過關獎勵，正常出招修為照舊。

正式Canvas、SparStage同SparDuel入／離全屏仍係同一實例，墨暈後開場HP保留150/261。江湖由startCombat開始、實際combatAuto產生戰報，skip後combatAutoCommit一次，氣血／銀兩／處置phase等於真計算結果，演出前唔提早套用結果。

`browser-qa.json`：Chromium／WebKit、320／390／420×690／844／DPR2，三類戰鬥、2倍速度、跳過、血條比例及欄寬、七卷及敗退減少動態。WebKit每個case開獨立程序，避免Linux測試環境跨context關閉造成程序中止。唔當實機幀率驗收。

`release.png`及各browser PNG為正式入口實際圖；GIF為真實時間錄影（DPR1），唔係概念合成，最後畫面停900ms供檢視。原生瀏覽器介面／iPhone未另行驗收。舊原型截圖留喺其他第26項目錄，唔當本次正式流程證據。

重跑：DEV5177，`PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1 node scripts/qa/captureRelease73.mjs`。腳本跟目前App嘅Vite HMR import URL取得同一store，避免測試注入另一份模組。

148項正式手機流程檢查＋12項焦點／背景操作檢查通過；606項Vitest、Pages build、narrate hard-fail0通過。focus-qa.json記錄全屏時主頁inert、焦點落戰鬥、返回後恢復操作。

錄影：`node scripts/qa/recordRelease73.mjs`，再`python scripts/qa/packageRelease73.py`；焦點檢查：`PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1 node scripts/qa/checkRelease73Focus.mjs`。
