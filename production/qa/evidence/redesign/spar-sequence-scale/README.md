# 演武逐招展示／敵我同身形

基線係EA0.79.0 `0f2c9df`，seed42、390×844 DPR2、免費600／付費0。玩家手機短畫布大小作重現目標；係本批未發布原型，唔係正式版已修好嘅聲稱。

- `before-short.png`、`after-short.png`：同一真正產品頁，固定360×160畫布及中立守勢嘅狀態檢視；唔冒稱自然交手同一幀。`comparison.jpg`只裁出場景方便睇，紅框標示兩人，冇後製縮放人物。
- `before-hero.png`／`before-foe.png`及改後同名檔：直接由產品drawWarrior／drawEnemy畫出透明人物，原CSS比例。實測主角56px維持56px；敵人28px改成55px。
- `all-25-foes.jpg`：25款既有敵人透過同一真正呈現器檢視，保留各自姿勢、兵器及頭飾輪廓；身高校準及來源hash見 `design/art/foe-figure-scale/`。冇生成或改畫敵人。
- `boss-sequence.mp4`／`sequence-preview.gif`：正常速度首領實播，卷一長河崩拳→卷六大河落日→卷一；招名同底部高亮同步。影片用既有鎮上惡霸真資料嘅首領checkpoint，唔冒稱自然打晒小兵；開場先執行一次核心還擊同步真正首領UI，之後全由遊戲跑，冇測試逐幀改結果。
- `report.json`：正常速度、兩倍速及320／390／420闊度真正入口逐次DOM變化及招名停留時間。1x各卷至少有一次350ms、2x至少175ms連續可讀呈現；完整實測毫秒值保留，唔只驗證文字閃過。各頁pageerror0、無水平溢出。
- 390實測卷六正常速度1755ms、兩倍速860ms；`defeat-priority.json`另用1HP真核心還擊檢查，敗退會清除主角高亮並顯示敵人還擊，唔因保留主要招名而蓋住敗退狀態。
- 靜態前後檢視嘅玉石等本機bootstrap完成後固定重設；初版圖曾被新手15玉石提示覆蓋，已重拍，唔當產品經濟改動。

`history/before-callout-priority.mp4`及同名報告保留第一輪：雖然能讀到卷一／卷六／卷一，重睇正常速度發現卷六會被敵人還擊提示過早蓋走。最終修正呈現優先次序，敵人結算／傷害／時間不變，另加連續停留驗證再跑全部手機及倍速。

重跑：5175基線及5173改後Vite各用獨立cacheDir，`python scripts/qa/checkSparSequenceScale.py`；`SPAR_QA_STATIC_ONLY=1`只重拍固定姿勢，`SPAR_QA_BATTLES_ONLY=1`只重跑真正首領並保留另一部分報告。

同門各卷用同一套專屬肢體，演武傷害仍用現行SparDuel規則，唔虛構新增卷數效果／出招結算。影片24fps及GIF10fps係交付編碼，唔當iPhone真機或裝置fps驗收；影片無音訊。

最終驗證：91檔662項Vitest、Pages build含tsc、narrate hard-fail0全過，見 `vitest.log`、`build.log`、`narrate.log`；真正入口記錄 `browser.log`。原有66外功×900步核心事件／敵方行動一致。第一次build發現新測試fixture嘅可選裝備陣列欠類型斷言，修正後重新build；未刪減測試。
