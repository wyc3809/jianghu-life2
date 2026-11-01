# EA0.100.0 · 水彩門派會武

玩家選圖：`design/art/sect-battle/selected-portrait.png`。實際入口：江湖→江湖風雲→門派會武。完整方向已獲玩家授權接入；本輪是門派十人代表戰，幫會十城及經濟獎勵未包含。

## 圖像與播放

- `showcase/playing-390.png`：正式構建、CSS390×844／DPR2，固定種子試演約00:04；畫面明示不計戰績。
- `showcase/battle.gif`、`showcase/battle.mp4`：真瀏覽器完整元件錄影，沒有另造動畫或改寫戰果。GIF匯出12fps不是遊戲或裝置幀率。
- `source-comparison.jpg`：選定原圖與同幅實作對照。
- `before-after.jpg`：舊原型與本次實作，紅框標示主要變更區。
- `live-ui/`：兩個獨立身份，觀看真 Edge 產生的同一份戰報；畫面中的會武驗收姓名為自建測試帳戶。
- `native-branch/`：正式構建強制啟用原生分支，雙引擎從 Blob Worker 解碼同一伺服器時間軸。這是瀏覽器分支模擬，不是 Capacitor 真iPhone測試。

## 核心及雲端

120檔928項 Vitest，包括新增門派名冊／換屆／無效人物／身份與操作驗證、CAS重試／單一戰報／排名不影響本屆、公開快照私隱、時間軸保存／精確氣血內力／JSONB鍵序／損壞拒絕。TypeScript及正式Vite構建通過；narrate hard-fail0、copy口語／禁句0。驗證日為2026-11-01。

`cloud-report.json`：二十個獨立 Supabase 匿名驗收身份，各派十人報名及出戰；並非二十名真人用戶。實際驗證登入JWT、表及RPC對瀏覽器拒絕、偽造勝負拒絕、同指令並發重試、反向挑戰返回同一戰報、雙身份完全相同戰報、門內勝方換位、本屆代表不變、全部人生存檔不被戰爭改寫。沒有新增獎勵或傷亡。

部署：獨立 `jianghu-sect` v3，JWT保持true，部署回傳 ezbr_sha256 `49d6f5a263c9feef902842bff8a7a970ecdb1ceaa42954420ab15b4fcf6bbfcd`（原始 index.ts SHA-256 `dc1691f96a6569c97f64a8f8bb45f347f8d93fe8d62c958f3e3b53939f0b0235`）；已套用遷移 `20261101021243_sect_war`。既有 pair/world 函數未隨本輪重新部署。`http-security.json` 記錄匿名key401及不允許來源403。

發布前，20個測試session全部global logout204；精確移除這20個自建身份及其資料，檢查剩餘QA auth、save、session、member均0，新會武report／receipt均0；刪除後原身份再讀Auth返回403。沒有清空既有人類玩家的世界、存檔或榜單。

## 介面與 App 來源

- `production-ui/browser-report.json`：正式構建，Chromium及WebKit各320×568／390×844／430×932，另各減少動態及素材全部失效；共10例通過。檢查固定一屏、44px控制、二十名冊、暫停像素不變、背景不補播、名冊停畫、跳過與重播一致、存檔及經濟不變、pageerror0。此組封鎖雲端，與真Edge驗收分開。
- `live-ui/browser-report.json`、`native-branch/browser-report.json`：共4個真Edge觀看流程，正式戰報只讀解碼，重播無新mutation或report請求；均pageerror0。
- `navigation/browser-report.json`：完整遊戲點入會武、對戰配搭、返回原頁；會武期間底層inert，離開後解除。
- `showcase/playback.json`：錄影期間的headless Chromium RAF採樣；不是手機效能基準，保留中位及p95，沒有聲稱穩定60fps。渲染限制DPR≤2、調色快取有上限、開戰前分批預熱、背景與彈窗停止RAF、前端不運算正式戰鬥。

## 邊界

本輪沿用原存檔格式及現有對戰配搭；演武／單挑不改規則。正式開戰需要兩派各十名有效真人代表，未齊不填NPC，可先看明示「試演」的獨立示範。封測數值及信任邊界見 `docs/online/sect-war.md`。

程式與網頁按既有流程發布，iOS由同份來源打包。沒有取得Codemagic簽署上傳／Apple權限，也沒有實體iPhone連線；TestFlight上傳、真機前後台／VoiceOver及幀率仍未驗收，Apple checklist保持未勾。Mac CI未簽名Archive與網頁部署均須以該次PR／工作流的實際結果核對，不能當作已上傳新TestFlight。
