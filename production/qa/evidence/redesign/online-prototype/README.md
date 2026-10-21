# 第32項：本機雙帳戶多人原型驗收

狀態：本機原型完成，待玩家睇實際畫面；未合併main／未上線。正式版本保持EA0.80.0，未租主機，未接正式登入／多人經濟或TestFlight。

啟動及完整範圍：`docs/online/local-prototype.md`。以真HTTP服務、SQLite及兩個獨立Chromium context驗收，唔用前端改名次或兩份localStorage模擬多人。

## 畫面與動態

- `comparison.jpg`：真正遊戲「江湖」入口前後對照，基線EA0.80.0／0af2826。390×844 DPR2、人生seed42、免費玉石600／付費0；紅框標新增多人試場。
- `login.png`、`loadout.png`、`opponent-offline.png`：獨立身份、真武學配搭及離線對手。
- `victory-offline-defender.png`、`final-ranks.png`、`defeat-protection.png`：直接互換、失敗不變、敗方保護。
- `offline-income.png`：真實時鐘離線超過一分鐘後返嚟領取；未加速伺服器／瀏覽器時計。
- `two-accounts.mp4`：完整兩帳戶操作、失去回覆後恢復、回放、收益及保護；第一場按真UI選兩倍速，唔稱全片正常速度。
- `replay-normal-speed.mp4`／`replay-preview.gif`：最終版正常速度重播，主角卷六「大河落日」及高亮真實可見；GIF 8fps只作預覽，唔當幀率效能證據。
- `hero-volume-six-final.png`／`world-final.png`：最終版收細提示後嘅實際畫面。
- `phone-320.png`、`phone-420.png`：手機窄／闊尺寸，無橫向溢出，主要操作44px。

## 規則與服務結果

`report.json`：

1. B離線後A挑戰成功，伺服器只產生一場戰鬥；刻意攔截已被服務接收嘅開戰回覆，前端由新快照恢復收據，冇重抽結果。
2. 100名勝20名變20／100，雙方讀取同一battleId；重播兩次無額外換位。
3. 真離線一分鐘後收益增加1試場銀兩；連點領取仍只入帳一次。
4. 較低排名挑戰失敗，維持20／100，敗方重新保護，其他玩家不能再襲擊。
5. 重開頁戰報及排名保留，人物狀態未被PvP修改；320／390／420手機及pageerror檢查通過。

`replay-final.json`：最終版正常速度、主角卷六可見、重播前後排名及人物快照完全相同，pageerror0。

## 自動檢查

- `logs/vitest.log`：93檔680項全過，包含18項新多人規則／服務測試。
- `logs/online-service.log`：固定seed42測試SQLite、真HTTP、重啟、斷線、多頁、篡改、領取與保護。
- `logs/build-pages.log`：Pages build含TypeScript通過；另檢查產物無「本機試玩」、`/api/jianghu/`或`node:sqlite`。
- `logs/narrate.log`：hard-fail0。
- `logs/browser.log`、`logs/replay.log`：完整瀏覽器與最終重播通過。

歷史QA工具錯誤保留：首輪用錯武學選擇器名（「雨花劍」→真實「聽雨劍意」）；次輪Playwright Python等待函數漏咗`arg=`。兩輪均未當通過，修正驗收工具後用新獨立QA資料庫完整重跑成功，冇放寬產品規則或測試限制。

## 測試值與限制

- 保護30秒、在線／離線每分鐘10／1試場銀兩、2秒心跳及8秒租約，全部明示測試參數，未定為正式經濟。
- 原型用SQLite與HTTP輪詢；本機帳戶選擇唔係公開正式身份驗證，未作容量、反作弊完整性或高可用承諾。
- 戰鬥只用人物快照與現有武學純核心；全武學PvP特殊效果平衡、對手專屬人物造型、正式成長／抽卡經濟、舊角色遷移及幫會／門派戰仍屬後續。
- Linux Chromium自動化唔當iPhone真機或60fps驗收。

## 沿用素材映射

遊戲UI及演出冇新增生成素材。山路沿用`public/ink/ai/banners/banner-mountain-road.webp`；框沿用`public/ink/art/wuxia-frames/frame-{neutral,selected}.webp`及既有宣紙／icon；人物與武學沿用`src/spar/`及`public/ink/art/martial/`既有資源，來源／授權保留原專案記錄。本文檔截圖與影片係實際產品捕捉，唔係合成產品畫面。
