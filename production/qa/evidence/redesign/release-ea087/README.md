# EA0.87.0 發布驗收

2026-10-23，玩家回覆「上線」，批准一併發布第33項書面語／敘事精簡、第34項江湖地圖及第35項取消角色歲數。版本四處同步為EA0.87.0／0.87.0-ea。

三項整合至發布PR #136，以main為目標，不分次部署過渡版本；原前置草稿#134／#135由本次發布取代。全部程式變更見相應改版項目與各自驗收目錄：`written-copy/`、`jianghu-map/`、`remove-age/`。

發布前完整100檔728項Vitest、Pages build含tsc、narrate hard-fail0及文案掃描9681段／口語禁句0全部通過，記錄為 `tests.txt`、`build.txt`、`narrate.txt`、`copy-audit.txt`。

`scripts/qa/checkReleaseEA087.py` 以普通遊戲介面建立隔離人物，不使用開發模組或注入遊戲存檔。檢查實際載入bundle含EA0.87.0、出身不再有歲數進度、頭像與人物無歲數、地圖四個入口及返回、心性歸入人物、原有20%武功／80%書頁與60／600玉石成本、書面語池規、設定版本，以及320×568／390×844／420×896手機可點及短屏城鎮名稱避開導航。

`local-*` 為本機正式構建，`live-*` 為部署後正式網站；對應JSON記錄bundle位址、版本、手機尺寸、HTTP錯誤及pageerror。全部在全新隔離瀏覽器中操作；阻斷Supabase請求，只驗多人未登入入口，不讀寫真玩家、不上傳榜單，也不更改遠端服務。既有240個月高齡存檔、核心年齡門檻及傳承來回測試見第35項。

發布後另記錄主線提交、CI與Pages執行結果、正式bundle及手機驗收。只發布網頁，沒有TestFlight、資料庫或後端部署。

## 正式發布結果

- PR #136已squash合併，主線提交 `c45f8a882e9db04c349d6ef5b929e528d431598a`。#134／#135已標示整合並關閉；工作分支以不改寫遠端歷史的方式對齊主線。
- 發布前CI：`39973856561`，對應發布提交 `be9f234c130e4eb6b97435f5149128feeac5f5c0`，成功。主線CI `39974181814`成功。
- Pages發布工作 `39974181780`第一次停在checkout，取消後以相同主線提交重跑；第二次成功。實際Pages部署 `39975408532`的build／deploy成功，gh-pages提交 `34ac18c4fd8c9d2b89a1fefbeb0ef46134a222f0`，Pages狀態built。
- 正式標準網址 `https://wyc3809.github.io/jianghu-life2/` 實際載入 `assets/index-mz8HobEI.js`，包含EA0.87.0；不是只核對帶查詢參數的網址。記錄見 `live-bundle.json`。
- 正式網站使用普通遊戲介面建立隔離人物，三種手機尺寸的地圖、四個入口／返回、人物心性、無歲數、卡池成本／池規及設定版本驗證成功，pageerror0、HTTP錯誤0。見 `live-browser.json` 與 `live-*.png`。地圖靜態圖等開局提示退場後拍攝。

工作流程原始結果節錄保存在 `pr-ci.json`、`main-ci.json`、`pages-build.json`、`pages-deploy.json`。本段與正式網站截圖為發布後追加證據，不更改已部署的遊戲程式。
