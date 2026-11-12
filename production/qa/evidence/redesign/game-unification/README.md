# 第61項：全遊戲功能／介面／演出同步優化

日期2026-11-12；基準EA0.103.1（`48f26c8`）；發布版本EA0.104.0。玩家已確認工作方向。本機結果記錄如下；合併、CI及Pages以相應PR及GitHub紀錄核對。

功能／來源對照及範圍：[同步檢查](../../../../../design/audits/game-unification-ea0104.md)。保留水墨宣紙及斗笠黑影，無新人物或批量生圖。核心、資料、schema、store及雲端協議未改。

## 畫面及實播

- [祖祠前後對照](ancestry-comparison.png)：修正前開啟已捲到下面，標題／祖蔭點數不見；修正後標題、點數與收起掣固定。
- [13個畫面總覽](after/overview.png)：同一隔離角色逐頁實畫，見`after/inventory.json`；舊版11個有效畫面見`before/`。舊版門派／雅藝精確名稱定位未成功，不當作功能壞掉。
- [正常速度實播GIF](game-unification.gif)：真App黑影、祖祠固定標題及修煉／結果流程。只裁影片時段及縮小輸出，無逐幀重繪。
- [短屏長篇結果](long-result-320.png)：320×568，50段故事與30條消長，標題及「繼續」始終可見；內容自行捲讀。
- [設定／同步](cloud-synced-390.png)、[江湖榜](leaderboard-390.png)：固定標題／收起、內容獨立捲動，沿用紙框及位圖圖示。

## 驗證

| 檢查 | 結果／證據 |
|---|---|
| 完整Vitest | 134檔、998項通過 |
| 正式Pages構建 | TypeScript strict與Vite通過；保留既有chunk大小提示 |
| 敘事／玩家文字 | hard-fail 0；10,550段字串，禁句0 |
| 核心多種人生 | `simulation.json`：24種seed、每種最多180步；1,258次事件、43場戰鬥／359回合、逐步JSON來回及數值界限 |
| 全功能入口 | `browser.json`：Chromium／Linux WebKit各320×568、390×844、430×932，六組逐頁流程＋八組邊界狀態，全無pageerror |
| 換裝／瀏覽 | 真預覽取消不修改，確認只改普通配搭，對戰配搭保持；各功能瀏覽不扣玉石／書頁或自動學習 |
| 修煉／自立門派／生死戰 | 真扣一次修煉、零銀兩攔截、自立門派指點；風險彈窗原生隔離，Escape只退避 |
| 真戰畢重開 | `browser-battle.json`：雙按跳過仍一次結算；進人物停止演武後重開，核對銀兩、裝備、卷次及收藏均不再增加 |
| 動態偏好 | `motion.json`：即時全動態／減少動態、同一主頁引擎、減少動態長文不自動捲動；戰報亦核對同一實例，唔因偏好變更重播 |
| 遮蔽畫面 | `motion.json`：正常畫面350ms有1,027次drawImage呼叫，設定遮住後400ms為0；呢個係繪畫呼叫數，唔係FPS／耗電量測；演武真入帳照舊 |
| 同步及榜單 | `cloud.json`：真正Supabase SDK＋本機HTTP回應器；最新人生／祖蔭上傳、503失敗重試、上傳時停用、雙按單次上傳、切榜先清舊數字、同榜重按保持 |

持續修為預估改用100ms更新，減少動態為1000ms；入帳短滾動仍保留。遊戲權威ticker、獎勵及戰果不由畫面預估決定。

## 重跑

```bash
node_modules/.bin/vite-node scripts/qa/makeGameUnificationFixtures.mts
node_modules/.bin/vite-node scripts/qa/auditGameUnification.mts
VITE_ONLINE_PUBLIC=1 npx vite --host 127.0.0.1 --port 5294
# 另一個shell；WebKit若需本機依賴包，以MARTIAL_WEBKIT_EXECUTABLE指定。
python3 scripts/qa/checkGameUnification.py
python3 scripts/qa/checkGameUnificationMotion.py
python3 scripts/qa/captureGameUnification.py after
python3 scripts/qa/recordGameUnification.py
```

雲端介面隔離驗收另用5295，環境設定`VITE_SUPABASE_URL=https://unification-qa.supabase.co`與`VITE_SUPABASE_ANON_KEY=qa-only-public-placeholder`，再執行`checkGameUnificationCloud.py`；所有該域請求都由測試回應器接住，唔建立真帳戶或寫遠端資料。

`browser-built.json`另外記錄正式Pages輸出在390×844嘅入口與四種邊界狀態。瀏覽器及隔離SDK驗證唔等於真iPhone、真雙裝置登入／還原、新TestFlight、耗電或熱穩定已完成。幫會／門派多人戰繼續暫停。
