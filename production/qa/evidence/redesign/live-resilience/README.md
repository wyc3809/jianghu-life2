# EA0.113.1 · 同遊穩定性驗收

本輪沿用原同遊玩法及已接受畫風，減少補讀爭全服寫鎖，修限頻重試與網絡恢復。設計及接點見docs/online/live-jianghu.md、第77項。

- validation.json：148檔1,067項通過，Pages構建、敘事hard-fail0、文案禁句0、diff通過。新增核心1,000次並發名冊讀取零寫入／收益僅領一次、100次到期補讀僅一個結算；HTTP驗已驗身份、合併頻道、另一分頁退出及429轉譯，固定編號測試驗斷線／503／429沿用ID、確定拒絕或換內容重新編號。
- resilience-cloud.json：三個真Supabase身份，40個並發view無增世界revision，renew只增一次；同人四個不同發言並發，一成功／三429，已成功原ID重試與限頻後原ID再試均安全。合併私訊第三人不可見；退出後renew正常返回未參與及空對話。
- cloud.json：重跑原公／私訊、直讀拒絕、屏蔽舉報、同一場交鋒、交手中退出拒絕、敗方保護／重入及不新派玉石。
- reconnect-before／after.json：舊正式EA0.113.0實測重連補讀後仍留Failed to fetch；新版正式構建在失聯時實際按送出，保留草稿，網絡online即補回漏收訊息並清除錯誤，沒有自動重送該草稿。恢復請求皆view；Realtime同時追通知可合併後再補讀，不宣稱每次連線恢復永遠只一個請求。快速切頻道不混入私訊，另一分頁退出後正常回加入畫面。
- before-after.jpg：同身份390×844／dpr2，兩次真連線的實畫，紅框標提示區；測試訊息／時間不同，並非比較聊天內容。recovered-before／after-390、offline-390及recovered-320／430為原截圖。
- browser.json：三個分開Chromium context，將五秒心跳延長60秒，仍以真Realtime於2.379秒送到另一頁，不是輪詢冒充推送；私訊隔離、原生確認、雙方自動開同一場、共同時計、敗方保護及三手機尺寸通過，pageerror0。不是延遲SLA。
- controls.json：正常操作console／HTTP／pageerror0；390×500短視窗輸入送出仍可見，返回恢復頂欄／導航，原能力／心性／裝備／配搭／造型／武學保持，深色系統仍淺紙、減少動態通過。刻意斷網的失敗請求不列作正常操作錯誤。
- battle-390／battle-peer-390、default-320／430及keyboard-short-390為本輪正式構建實畫；live-battle.gif取本輪真瀏覽器影片36–45秒，12fps／280px、正常速度，確認原黑影交手仍正常，沒有新增角色動畫。

後端先備份world v4／live v1，再發布world v5／live v2，verify_jwt保持true；migration 20261115090053先BEGIN／ROLLBACK驗整段SQL及authenticated無EXECUTE，再套用。聊天／world私有表RLS保持，沒有新增前端表讀權限。原本匿名身份policy與刻意RLS無前端policy的advisor狀態保持，沒有新SECURITY DEFINER。

本機清快取時誤移除依賴，已npm ci恢復且重跑最終全套；預覽忘設Pages base，瀏覽器載入失敗後已更正VITE_BASE並重跑，失敗沒有算通過。測試憑證／備份只放ignored .local-online，不提交；最終按三個測試UID清資料，保留真玩家。

這些是固定測試群的正確性與請求減省，並非大規模容量、完整反作弊、真iPhone或Apple上傳驗收。原生Archive及正式站版本以PR／部署實錄另核。
