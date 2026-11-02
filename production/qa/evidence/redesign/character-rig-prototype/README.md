# 階段二：單角色App骨架原型

2026-11-01，基於EA0.100.0及階段一審查。這是**待玩家評閱的內測原型**，沒有替換現有戰鬥、發布新版本、恢復多人戰或上傳TestFlight。

## 先操作，再看記錄

- [可操作完整素材預覽](playable.html)（約6.6MB）：下載後用瀏覽器開啟。同一App元件／求解器／renderer，所有角色及紙框素材、題字字體已內嵌；返回鍵使用瀏覽器歷史。這份單檔是審閱副本，App入口另列如下。
- App開發版：`?rig-lab=1`，或設定→「角色動畫驗收」。原生內測構建需`VITE_CHARACTER_RIG_LAB=1`；一般正式構建不啟用。
- [實際App操作影片](app-operation.webm)／[短GIF](app-operation.gif)：可見走、跑、出招、受擊、倒地起身、暫停逐幀、轉向、除錯、換造型及持武。
- [同height參數前後圖](before-after.png)：同頭部／衣著ID、相同地線與鏡頭參數。上列原有完整姿勢圖，下列真部件骨架；出招分別取各自接觸姿勢，並非聲稱兩套動畫同秒數或畫法完全相同。
- [三套衣著動作板](poses-three-outfits.png)／[96組頭、衣、色](appearance-96.png)。

操作：點動作可連續播放；出招有蓄勢與收招，倒地後可起身。可選0.25×／0.5×／1×、暫停、逐幀及定位蓄勢／收招。造型分頁可換八頭／三衣／四色、徒手／劍／刀／槍／棍、單手／長兵雙手／背負。骨架按鈕只開關除錯線，正式人物仍是詳細位圖。固定基準人物及此頁選擇不寫回玩家衣櫥。

## 本輪檢查及結果

| 範圍 | 實際證據／限制 |
|---|---|
| 完整遊戲回歸 | 121檔／941項Vitest通過；新增13項真幾何／時鐘／動作／中斷／減少動態回歸。未skip、未放寬容差 |
| 構建及文字 | TypeScript＋Vite普通正式構建通過；內測flag正式構建亦通過。audit:narrate hard-fail 0；audit:copy口語／禁句0。原有大chunk提示保留 |
| Chromium／Linux WebKit | 320×568、390×844、430×932；共6個完整操作情境，加減少動態及全角色素材網絡失敗4例，共10例，pageerror 0 |
| 實際按鈕 | 慢播、暫停、逐幀、轉向、真造型選擇、雙手持武／背負、模擬visibility通知；控制至少44px，主頁不捲動，選項只在次級dialog內顯示 |
| 核心／存檔隔離 | 原型頁有既存QA人生及祖蔭資料，操作前後localStorage完全相同；不呼叫戰鬥核心或發獎。Supabase請求被隔離 |
| 普通／內測正式包 | 普通包query不開原型；內測包可操作倒地起身、返回遊戲。另由修煉頁真設定按鈕進入，存檔在原型內不變 |
| 素材 | 96組頭／衣／色實際繪圖；48組八頭×三衣×左右伏地，加30組兵器／持握伏地，共78組，實際opaque角色像素沒有落到地線以下 |
| 離線單檔 | Chromium及Linux WebKit經本機HTTP實播同元件，完整42張角色／兵器圖片、外部請求0、pageerror 0；沒有繞過環境file://限制 |

數值守門使用真FK輸出：接點誤差≤1e-6設計單位，獨立骨長測試≤1e-9；角度不得超definition，地面穿入≤0.5、IK腳目標／副手握點誤差≤0.5設計單位。人體／素材畫面評閱另行進行，不能用這些數值代替。

像素檢查固定用alpha>100辨認實體邊緣，前後未降低門檻；半透明水墨邊另保留。檢查是指定伏地姿勢的素材組合，不宣稱已逐像素窮舉所有中間幀。連續動作另有影片及每步骨架檢查。失效姿勢雖有最後有效frame後備，測試仍要求累計異常為0。

## 效能量測

| 項目 | 最終120秒實測 |
|---|---|
| update CPU | p50 0.1ms／p95 0.2ms／p99 0.4ms／最大 91.4ms；7079個樣本 |
| draw CPU | p50 0.1ms／p95 0.4ms／p99 1.1ms／最大 100ms；7079個樣本 |
| RAF間距 | p50 16.7ms／p95 16.8ms／p99 16.8ms／最大 400ms；7078個樣本 |
| 頁面可操作時點（本機開發版） | 約2.41秒 |
| 解碼位圖估算 | 42張，18,305,340bytes，約17.46MiB；不含調色canvas／GPU複本 |
| JS heap | 六個20秒取樣約19.68–24.19MiB |
| 骨架累計異常／pageerror | 0／0 |

**仍有最高400ms幀間距；不判作穩定60fps或已消除所有卡頓。** 開發版、GC及宿主排程的影響未分離，正式原生效能仍待profiling與真機驗收。

環境為Linux Chromium headless、Canvas2D、390×844、DPR2、Vite開發版，一個人物，固定traveller／topknot／墨色，輪播八種動作120秒。update及draw是主執行緒包裝量測；不包括完整GPU合成／原生WebView成本。載入為loopback開發伺服器，不當成App冷啟動或手機網絡速度。

[最終數據](performance-summary.json)／[原始取樣](performance-raw.json)。另保留[較早原型量測](performance-initial-summary.json)及其[原始取樣](performance-initial-raw.json)，沒有刪掉慢幀或將單次較佳數字當保證。JS heap只反映V8，不能等同整個程序／解碼圖像／GPU記憶體；兩分鐘亦不足以證明沒有洩漏。

## 待驗收及下一步

- 玩家對比例、接縫、步態、出招及倒地自然度的評閱。
- 真iPhone／WKWebView／TestFlight安全區、觸控、前後台、離線重開、溫度／耗電及長時間記憶體。模擬visibility與Linux WebKit不替代原生實測。
- 事件一對一readonly replay尚未接入；現有SparStage、華山及非同步一對一仍用舊呈現器，原有敵人出招／受擊問題尚未藉本稿遷移。
- 完整剛體布娃娃、複雜自碰撞、獨立柔體衣髮、弓／軟兵／暗器及全部武學動作族尚未製作。現在是受控FK／IK加有限重心彈簧，沒有把它說成完整物理人體。
- 多人及PR #156繼續暫停；二十人壓力場景留階段五。本輪沒有main合併或部署。

## 重現與來源

先開`npx vite --host 127.0.0.1 --port 5271`，不要設定正式雲端憑證：

```bash
npx vitest run
npm run build
npm run audit:narrate
npm run audit:copy
python3 scripts/qa/checkCharacterRig.py
node scripts/qa/buildCharacterRigPreview.mjs
```

單檔用本機HTTP5272提供，再跑`recordCharacterRigEvidence.py`；內測正式包於5273、普通包於5274，再跑`checkCharacterRigBuilds.py`。`measureCharacterRig.py`需獨立執行120秒，期間不改前端、不跑構建／測試或其他瀏覽器檢查。WebKit執行檔可由`MARTIAL_WEBKIT_EXECUTABLE`指定。

[架構與限制](../../../../../design/audits/character-animation-phase2.md)、[素材來源／授權／提示／處理](../../../../../design/art/character-rig/README.md)。單檔保留字體OFL及實際打包依賴的授權文字，不接第三方素材URL或玩家帳戶。

記錄：[browser-report.json](browser-report.json)、[build-gates.json](build-gates.json)、[artwork-scan.json](artwork-scan.json)、[Chromium離線檢查](offline-chromium.json)、[WebKit離線檢查](offline-webkit.json)。
