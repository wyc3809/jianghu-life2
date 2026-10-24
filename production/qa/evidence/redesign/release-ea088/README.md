# EA0.88.0 發布驗證

2026-10-23。玩家已檢視全畫面江湖地圖並要求上線，對應redesign-scope第36項、PR #137。

本次僅發布江湖地圖獨立全畫面：無人物／貨幣頂欄及底部分卷，左上返回鎮居，四個地標與名稱一屏完整顯示。功能子頁保留原介面與導航。原圖、玩法、抽卡、裝備、獎勵、存檔及多人後端不變。

發布前完整檢查：100檔728項Vitest通過，Pages build含tsc通過，narrate hard-fail0，文案審核9681段／口語禁句0。原始記錄見本目錄四份log。介面六組尺寸、前後對照及48次建築／題字點擊驗收見 `../jianghu-map-fullscreen/README.md`。

正式構建驗收以普通介面建立隔離人物，無存檔注入或開發模組。320×568、390×844、420×896確認四個入口、返回、無頁面捲動、根頁無頂欄／導航、子頁與鎮居恢復導航。另核對真正主bundle與設定版本EA0.88.0；攔截Supabase網絡，不操作真玩家或遠端服務。

本機重跑：以 `VITE_BASE=/jianghu-life2/ npx vite preview --host 127.0.0.1 --port 5175` 啟動預覽，執行 `MAP_EXPECTED_VERSION=EA0.88.0 MAP_BUILT_OUT=production/qa/evidence/redesign/release-ea088/local python scripts/qa/checkJianghuMapFullscreenBuilt.py`。線上使用相同腳本，指定MAP_BUILT_BASE為正式網址、輸出live目錄。結果與截圖分別放local／live，避免覆蓋介面原始證據。

發布已完成並實測：PR #137發布提交b37434acaffb1271aca475966540308ecc330d00，CI 39986149574成功後squash合併為main 5dead178b8f3499e11c76930f90f15aaae3ee42c。main CI 39986501357及Pages發布39986501609成功；gh-pages 3161c025c8af139e7f618ad53982846efb4fe9c7實際Pages部署39986737644的build／report／deploy三項成功，Pages API狀態built。

正式網址主bundle `assets/index-CMm4vjXd.js` 含EA0.88.0；live普通介面三組手機四入口／返回、全圖一屏、無上下欄及設定版本通過，pageerror0／HTTP錯誤0。`live-bundle.json`為無快取參數的正式網址核對，`live/`保留真瀏覽器截圖與結果。已目視390×844正式地圖，返回及四地標名稱清晰。未在實體iPhone測試。

工作分支以非強制方式對齊main並保留歷史。此部署後證據提交只存於工作分支，無額外程式發布。
