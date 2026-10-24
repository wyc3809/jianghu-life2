# EA0.89.0 發布驗證

2026-10-24，玩家已檢視同回合連招及難度調整後要求上線，對應第38項、PR #139。

發布演武台與首領同回合按已學卷序完整連招、末招收勢後才還擊、正確回合號與卷數高亮；採用已確認的敵人成長／首領血量及前三關緩衝。原過關獎勵、非致死敗退、存檔格式、抽卡、裝備與事件／華山／多人規則維持。本批只部署網頁，不部署後端或iOS；iOS準備保留在獨立PR #138。

發布前101檔741項Vitest、Pages build含tsc、narrate hard-fail0及文案審核9682段／口語禁句0通過，原始記錄見四份log。此前一／三／七招、缺卷、完整正常／減少動態首領戰、×2與雙擊跳過獎勵一次的證據在`../spar-rounds/README.md`。

正式構建使用兩種獨立驗證：

- 普通介面建立人物，320×568、390×844、420×896核對江湖全圖、四入口／返回及設定EA0.89.0；沒有存檔注入。重跑既有checkJianghuMapFullscreenBuilt.py，指定MAP_EXPECTED_VERSION及MAP_BUILT_OUT，結果local/navigation與live/navigation。
- 以makeSparReleaseFixtures.mts建立隔離schema-v1存檔（seed42、氣血5000、武學0、無裝備、第一關、七卷已學），載入正式構建／正式網站。沒有DEV模組、引擎替身、私有對打狀態或跳過小兵；真實打完小兵進首領，再從DOM記錄回合一卷一至七及其後一次敵人還擊。氣血5000是fixture輸入值；核心續玩正規化後實際畫面為254／254，沒有繞過該正規化。這組只驗操作與卷序，難度仍用前一輪正常人物矩陣。結果local/spar-browser.json與live/spar-browser.json。

全部瀏覽器以新隔離context操作，攔截Supabase，不操作真玩家或遠端寫入。數值難度比較與正常速度影片仍以前一輪證據為準，不因發布重標成真機／效能已驗收。

本機正式構建兩組驗證均通過：第1回合卷一至七後敵人還擊，三組手機地圖／入口及設定版本正確；pageerror0／HTTP錯誤0。Mac／iPhone真機及TestFlight不包含在此發布。正式CI、Pages部署及線上版本／操作結果完成後補記。
