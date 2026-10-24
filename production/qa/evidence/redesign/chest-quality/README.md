# 寶箱畫質與繪製負荷精修原型

2026-10-24；改版第40項。來源為玩家TestFlight精鋼刀結果截圖／開啟及轉動卡頓回報。本次完成遊戲內原型，未發布網頁、未上傳Apple，內容仍EA0.89.0。

## 實際畫面與來源

- `comparison.png`：同seed42、核心grantGear已入帳的精鋼刀良品；393×852／DPR2，Capacitor標記及59／34安全區CSS輸入模擬。左圖正式mobile舊構建cbf98c1（與a87684b寶箱程式相同，差別是body portal以外的主頁安全區）；右圖本次正式mobile構建。兩邊均等題字收實才擷取。
- `chest-opening.mp4`／`chest-opening.gif`：真正正式mobile遊戲由idle、完整良品轉動、蓄勢、開啟至可讀結果／領取／保留裝備；不是離線3D渲染。由Playwright錄下SwiftShader軟件GPU，只裁去最初3.2秒載入等待；播放速度未加速、未補動態幀。GIF只抽10fps縮294寬供檢視，不能用錄影判斷原生幀率。
- `game/`：六品階真實武器結果與跳過、一般完整演出、減少動態、缺圖及延遲圖，`contextlost-debug/`為獨立強制中斷；`motion/`為最後正常開啟錄影及背景暫停／恢復驗證。
- `before/`／`after/`為初次完整DEV正常動態取樣；`before-pure/`／`after-pure/`為關閉錄影的同機390×844 DPR1效能比較。舊版來自a87684b獨立工作樹；後者採本次Lambert／Phong材質。DEV高光頁是實際Three.js／GSAP與WebGL，沒有假GPU或靜態替身。
- 素材原圖、提示、來源／使用條款、四張切圖座標與hash在`design/art/chest-quality/`；`scripts/art/prepare_chest_materials.py`可重建4張512pxWebP，合計368340 bytes。工程包包含原圖與來源，不附私鑰或私人存檔。

## 量度結果與限制

正常開啟每幀GL繪製147→20（約減86.4%），神兵揭曉台座隱藏後17。取消寶箱專用全屏半浮點MSAA render target、法線／深度及描邊合成，改實體細墨薄殼。圖片預載／共用快取，同材質合併不改箱蓋鉸鏈。

| 相同軟件GPU／不錄影 | 良品改前→改後 | 神兵改前→改後 |
|---|---|---|
| 旋轉幀間隔中位 | 225→183.3ms | 216.65→150.1ms |
| 旋轉幀間隔p95 | 283.3→200ms | 266.7→200ms |
| 動態每幀draw | 147→20 | 147→20 |
| 結果持續draw | 147→0 | 143→0 |

此環境沒有原生GPU，SwiftShader動態依然只有約4至7fps。這些數據只支持同環境降低工作量，不能宣稱iPhone達60fps或卡頓完全解決。結果rAF樣本約16.7ms時GL draw為0，代表靜止停止重畫，並非每秒渲染60幀。需新TestFlight安裝後，以實機冷啟／連續開箱、前後台與溫度測量。

## 功能驗收與已知測試停滯

`game/report.json`合併首10個實際正式構建情境，以及獨立重跑的context-loss情境；逐項真武器／品階、三次連點領取、ownedCount1、未自動裝備、比較面板保留真裝備、重載不重播，pageerror0。原批次第11個新context在SwiftShader長時間負荷後，強制context-loss API呼叫停滯，已中止測試進程；沒有把該次停滯當通過。獨立新瀏覽器中斷測試成功，因此report明示contextLossIsolated。

`replay/report.json`另在同一頁及同一圖片快取連續12次重新開啟／跳過／關閉，第12次強制失去WebGL context：12次舊Canvas移除、舊context釋放、下次箱體可用及pageerror0。這不等於排除原生所有GPU問題。

`motion/report.json`正式完整動態另確認：覆蓋期間背景Canvas draw0；離場標記清除、背景繪畫恢復；結果1秒樣本GL draw0。演武更新與玩法未停。延遲紋理在結果補畫一次、缺圖後備與context失效仍可讀真獎勵及領取，沒有重派獎勵。

104檔764項Vitest通過（含合併幾何範圍、鉸鏈、六色、UV／normal、draw預算及覆蓋引用清理）；mobile build含tsc、Capacitor同步、793資源hash與版本驗證、narrate hard-fail0及文案審核通過。完整log在本目錄。本次不更動掉落經濟、核心入帳、裝備、出招或存檔。安全區原型見相鄰`ios-safe-area/`。

## 重跑

先`npx vite-node scripts/qa/makeChestFixtures.mts`建立隔離fixture（只在.local-online），`npm run ios:sync`，開`npx vite preview --host 127.0.0.1 --port 5176`；執行`python3 scripts/qa/checkChestQuality.py`，如軟件GPU中斷批次停滯，保留首10結果、單獨`CHEST_GAME_LABEL=contextlost-debug CHEST_GAME_CASES='[[1,"contextlost"]]'`重跑並如實記錄。影片用`CHEST_GAME_LABEL=motion CHEST_GAME_VIDEO=1 CHEST_GAME_CASES='[[1,"normal"]]'`。

DEV開5180後可用`CHEST_REPLAY_COUNT=12 CHEST_REPLAY_LOSS_AT=11 python3 scripts/qa/checkChestReplay.py`。效能腳本`python3 scripts/qa/profileChestQuality.py`；改前／改後分別設定CHEST_BASE及CHEST_MODE（完整環境名稱見腳本），順序執行、關閉錄影，勿同時壓GPU。全部只用隔離本機測試存檔，不讀玩家存檔或連線Supabase。
