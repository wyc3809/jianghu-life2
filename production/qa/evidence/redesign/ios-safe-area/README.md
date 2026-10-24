# iOS主頁安全區及可用高度

玩家提供TestFlight主頁實機截圖，顯示狀態列下方空白過大；已重現原生root及內頁同時計入頂部安全區。此批修正只在html.native-ios作用；維持EA0.89.0原型，不發布網頁或再次上傳Apple。

## 前後依據

改前：`cbf98c1`的既有mobile正式構建在修改前完整複製至忽略目錄`.local-online/ios-safe-area/before/`，獨立HTTP5177。改後：本分支mobile正式構建，HTTP5176。兩者同用`makeSparReleaseFixtures.mts`產生的seed42隔離schema-v1存檔（第一組一卷，姓名改為驗圖少俠／江湖驗圖長名少俠）；核心載入會正常重算血量，不以原fixture的health5000冒稱實際畫面血量。未讀玩家存檔，未連雲端。

`checkIosSafeArea.py`只在HTTP樣式表回覆中把CSS env(safe-area-inset-*)輸入替換為指定數值，不覆寫待測root／內頁padding規則。以webkit bridge標記模擬Capacitor原生識別；不是WKWebView真機。所有字體外部請求阻擋，使用同一系統後備。前後各16組：Chromium／WebKit、320×568、375×667、390×844、393×852、430×932、768×1024、八字人物名與一般網頁。

原舊QA只替root加47px，瀏覽器env仍為0，因而未重現內頁多計一次安全區。新測試對整份CSS環境輸入生效，可以實際重現及防止同類回歸。Linux WebKit缺少的程式庫只下載解壓到忽略目錄，使用保留庫路徑的本機launcher；沒有改遊戲程式以迎合瀏覽器。

## 結果

- `comparison.png`：相同393×852、59／34安全區的實際前後瀏覽器截圖及紅框；不是新實機照片。
- `before/`、`after/`：全部尺寸截圖及完整rect／按鈕命中結果。`summary.json`記錄兩引擎主頁上移51px、姓名上移約71.4px、演武台多51px。
- 主要導航／捷徑／任務操作44px以上，未被遮住或跨入底部手勢區。長姓名不疊貨幣；任務展開、人物頁、全屏地圖及返回正常。兩引擎的普通網頁主區矩形與改前完全相同。pageerror0／本機HTTP錯誤0。
- `tests.log`：102檔758項全部通過。`ios-sync.log`：tsc、mobile build與Capacitor同步。`ios-verify.log`：EA0.89.0及789個資源核對通過。
- `narrate.log`：hard-fail0；`copy-audit.log`：9682段／口語禁句0。

沒有改人物尺寸計算、演武數值、獎勵、抽卡、存檔或遠端服務。沒有新增動畫，故沒有把既有角色動畫當成本次新動效。更新後仍需玩家在原iPhone確認位置、手勢及長時間操作；本批不將瀏覽器測試當作真機通過。
