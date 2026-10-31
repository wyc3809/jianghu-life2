# 第57項：門派二十人同場會武原型

2026-10-31；正式App版本維持EA0.98.1。本輪承接玩家指定同一畫面多人混戰，按此前每派十名代表先做10對10共二十人。屬隔離原型，沒有合併main、發布網頁玩法或上傳TestFlight。

## 可檢視內容

- `same-field-demo.mp4`：實際瀏覽器錄影，24fps匯出。
- `same-field-demo.gif`：同一錄影節錄16秒，8fps匯出。不是iPhone幀率測量。
- `formation-melee.jpg`：列陣／混戰同場畫面，紅框標示戰場。
- `before-after.jpg`：既有一對一開發示範對比二十人原型，兩套隔離角色，只比較人數與構圖，不比較強度或效能。
- DPR2原圖：`formation-390.png`、`melee-390.png`、`melee-showcase-390.png`、`result-390.png`、`dev-entry-390.png`。
- 可下載HTML以`node scripts/buildSectBattlePreview.mjs`重建；交付檔在`/workspace/deliverables/jianghu-sect-battle-preview.html`，沒有將6MB重複成品加入App或版本庫。

HTML使用相同React／Canvas與戰鬥模擬，不是假截圖按鈕。內嵌原有圖集、紙材及字體／OFL與套件授權，可在瀏覽器操作：開始、暫停、速度、名冊選人、直接結果及重播。不要求登入、存檔或API。

## 已實作與限制

二十名人物共用2.5D空間及固定步長時間軸，自主尋敵、繞側、擊退與轉攻。既有細節人物／八套武學圖集共用，所有角色固定細比例，深度只決定遮擋，沒有逐幀fit或變成黑影。宣紙、毛筆題字及朱砂按鈕沿現有指定框架。

獨立PCG先生成同一戰報；沿既有武學／熟練／裝備、控制、回內、調息與整門一次耗內計算，每卷分時命中。超出射程仍記錄出招及未命中，不偷偷略過卷次。拳掌高卷的有限波及、移速、繞側、擊退與90秒後備均屬`data/redesign/sectBattleTestParams.ts`原型值，未確認為正式平衡。

測試只用二十名隔離示範人物，不是二十個已連線真人。本輪沒有接入幫會十城、門內排名／每週選拔／職位、真人報名、多人資料庫、戰爭結算、權威錢包或獎勵。未改現有演武、一對一模擬、經濟及舊存檔；沒有以演出代替服務端裁決。正式勝負／平手與獎勵仍需確認，原型先以全隊退場判勝、到時未分則平手。

## 驗證

- `tests.log`：115檔903項全部通過，新增8項驗固定種子／不改輸入與玩家RNG、二十人共用幀／多人同時出招、轉火／無友軍傷害、已學卷次／整門一次成本、波及上限、數值／空間界線、真勝負與缺席／重複身份拒絕。
- `simulation.json`：固定種子5707，24.55秒核心時間，654條出招記錄，83條波及，最多18人同時出招、96個攻守組合；勝方為青雲，餘5人。出招記錄包含未命中，不能當作654次有效傷害。
- `browser-report.json`：Chromium／WebKit各320×568、390×844、430×932，共6完整流程；另各有減少動態、個別圖集失效、全部人物圖失效，共12情境。實測暫停及背景期間畫布／時鐘不變，返回不補播；原生名冊暫停與選人、正常播完／跳過／重播同結果，無外部請求／存檔寫入或pageerror。
- `integration-report.json`：真正開發版入口可用，沒有全局HUD／底欄，不啟動雲端；已有隔離人生存檔字串保持，跳過到同一結果。另記既有單挑開發示範作對照。
- `build.log`：TypeScript及公開江湖開關正式Pages構建通過；靜態掃描確認新原型路由、角色、模擬及文字未進正式bundle。
- `narrate.log`／`copy.log`：hard-fail 0；10,177段文字，口語及禁句0。
- `verification.json`保存報告、原型、素材映射及結果雜湊。未宣稱真iPhone FPS、發熱、記憶體長測、VoiceOver或二十人網絡容量已驗收。

## 重建

1. `node scripts/buildSectBattlePreview.mjs`，輸出到`.local-online/organization-wars/sect-battle-preview.html`。
2. `python3 -m http.server 5250 --bind 127.0.0.1 --directory .local-online/organization-wars`。
3. `scripts/qa/checkSectBattlePreview.py`：全手機流程；WebKit可用既有wrapper的MARTIAL_WEBKIT_EXECUTABLE。
4. `scripts/qa/recordSectBattleShowcase.py`及`buildSectBattleEvidence.py`：實際錄影與證據整理。
5. 開發伺服器5251，`checkSectBattleIntegration.py`驗開發入口及對照。

原圖及來源／授權沿用`design/art/parchment-ui/`及現有武學／演武素材文件，沒有新生成美術。`src/prototypes/sectBattle/assets.json`與`asset-map.json`為本原型映射；石庭是原山水位圖地面的執行期透視取樣，不另存壓縮新圖。所有測試均使用隔離瀏覽器及人物，沒有登入或攻擊真玩家。
