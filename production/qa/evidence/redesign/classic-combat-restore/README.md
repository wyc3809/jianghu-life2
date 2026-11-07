# EA0.101.1：舊版戰鬥演出回復

玩家於2026-11-07明確要求「改版上線」「做返之前動畫的效果」。回復基準為套用Spine前的EA0.100.0（`9a07caf49b0b05b6d7b39def891a41925391bbed`）；修改前實播為EA0.101.0（`52e59bdc8e36d839e5fcc7609d3979e7961bd2eb`）。

## 真實改動

- 戰鬥恢復原八格完整姿勢、原蓄勢／接觸／收招選擇及持武角度；不再讓不同兵器都播Spine通用出拳。既有武學特效、停頓、震動與接觸聲保持。
- 舊身體、所選頭頸先按原圖錨點預合成，正式每幀只畫完整人物；固定400設計身高及1.5來源密度，透明裁切保存原點，不按姿勢包圍盒重新縮放。完整姿勢快取最多32張，進場先準備八格。
- 角色與特效共用當前姿勢握點；不再借用另一套各武學人物圖集的握點。敵方保持已修好的撲擊／受擊時鐘，接觸姿勢對齊原本接觸時點。
- 人物頁／衣櫥／頭像保留連續立繪。八頭、三衣、四色、兵器與存檔ID維持；Spine檔案及原型沒有刪除。
- 未改任何core、戰鬥數值、卷序、耗內回內、經濟、裝備或結算。幫會／門派戰及PR #156繼續暫停。

這是回復最近一版完整姿勢，不是新增103套獨有人體動畫。更早的各武學全人物圖會在出招時更換衣著／面孔，本輪沒有重新強制使用它們。預合成可消除分件不同步，不能憑此宣稱所有舊素材人體比例或自然度已獲玩家接受。

## 可播放證據

- `battle-operation.mp4`／`battle-operation.gif`：開發版真正InkAutoBattle／SparStage的seed42事件交手，實時錄製，沒有在影片替換人物；只裁去啟動段並轉碼。
- `before-after.png`：相同seed42事件交手，兩段不同實時錄影按首招挑幀，並非同步比較。紅框標出演出人物。
- `pose-board.png`：八個頭部，依序待機、行走、出招、受擊、倒地。使用正式renderer，不是另外畫的人物。
- `battle-*.png`：演武、事件、首領的實際操作畫面。

原始錄影位於驗收環境`/tmp/classic-combat/`；沒有覆寫舊版證據。素材沿用`src/appearance/asset-map.json`及既有原畫／來源／處理腳本，沒有新增生成素材或授權依賴。

## 驗證

- 完整Vitest：124檔959項通過，原門檻，沒有跳過或刪除測試。
- 新回歸：正式戰鬥與人物頁各自路徑；八格預合成不重複分配、不載入戰鬥Spine圖集；固定身高、左右轉向與同姿勢握點；敵人接觸／收招時間。
- `pose-report.json`：96組×兩朝向×八姿勢實畫，共1536次，無空圖或pageerror。
- `battle-browser-report.json`：Chromium／Linux WebKit各三種真交手元件。兩個外觀快照、加速、雙按跳過及重播通過；操作前後localStorage相同，沒有配對或發獎。
- 普通及Pages正式構建通過；敘事hard-fail 0、文案違規0；衣櫥預覽取消、確認換裝、重開、網絡圖失效同款後備通過。詳見`validation.json`及`wardrobe/browser-report.json`。

`fallback-reduced.json`另驗證舊造型網絡圖全部失效時，所選bun／cloak／cinnabar仍有可見完整人物；減少動態四個不同出招時間輸出相同像素。

重跑：先開Vite於5290，執行`python scripts/qa/checkClassicPoses.py`及`MARTIAL_WEBKIT_EXECUTABLE=<環境的WebKit執行檔> python scripts/qa/checkClassicCombat.py`。都用隔離測試情境，不能當成真玩家或實機結論。

## 發布界線

版本EA0.101.1按正常PR、CI及Pages流程發布；實際合併／部署狀態以GitHub記錄及線上版本核對。GitHub Pages更新不會更新已安裝TestFlight；Codemagic需從main建立新簽署build。這輪沒有真iPhone、溫度／耗電、原生前後台或TestFlight實機驗收，不宣稱穩定60fps。
