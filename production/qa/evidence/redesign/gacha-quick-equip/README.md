# 第28項：抽卡原地即學即裝（未上線）

- `comparison.jpg`：左改前 `674ff64`；右修正後。相同seed42、390×690、同批十連，舊版選第一張、新版選最後一張，顯示新舊操作位置。
- `*-reveal-before.png`／`*-reveal-after.png`：喺揭曉選中武學，一按即學即裝，再變成已裝備，唔離開揭曉。
- `*-before-equip.png`／`*-after-equip.png`／`*-results.png`：領取後嘅結果列表，亦可直接裝備。
- `equip-example.gif`：兩張真實Chromium畫面交替，示意按鈕變成已裝備；唔當作連續逐幀錄影。
- `browser-qa.json`：65項實際store／UI檢查。Chromium、WebKit各320與390寬、690高，DPR2；QA主矩陣用減少動態設定，操作仍經真實抽卡／高光揭曉／學習／主修action。正常動態首個Chromium320案例亦驗過，但唔當手機實機性能驗收。

為同一次十連覆蓋三類武學，測試先用純抽卡函數找出含三類嘅固定抽數，再由UI真正抽十次，唔改抽卡機率或偽造裝備結果。每次裝備檢查玉石、抽數、收藏不變；外功卷同步、舊武學保留；讀返真實IndexedDB／本機存檔比對主修。

改前由獨立worktree、port5178渲染；新版port5177。`scripts/qa/captureGachaQuickEquip.mjs`重跑主矩陣。606項Vitest、Pages build、narrate hard-fail0已通過。卡池94門、價格60、40抽心願保底等全部沿用；收斂方案未獲選，未套用。
