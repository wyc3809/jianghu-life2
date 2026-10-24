# 秘笈書冊／啟封畫質與主頁介面風格

2026-10-24；改版第42項。玩家回報書冊／翻開動畫卡頓與粗糙，要求邊框／文字回到主頁按鈕藝術風格。完成可操作原型，沿用第41項全畫面；內容EA0.89.0，未發布網頁或更新TestFlight。

## 前後圖與實際動態

- `comparison.png`：秘笈閣待機與按鈕；`result-comparison.png`：同一次真實普通武學結果。改前正式mobile構建141667b，改後本次正式mobile構建；390×844／DPR2，Capacitor標記及CSS env頂47／底34輸入模擬。固定seed42、免費600／付費測試600玉石，結果由真核心預覽與實際按鈕抽取相互核對。改前等題字／印章收實才擷取，無排版覆寫。
- `codex-opening.mp4`及`codex-opening.gif`：真正正式遊戲選冊、首次chunk準備、蓄勢、封面與八張曲面紙頁翻動、揭曉、完成入藏。從Playwright實錄裁去最初3.2秒主頁啟動等待，沒有加速或補動態幀；GIF只抽10fps縮294寬。軟件GPU實錄包含真實載入等待，不能用來宣稱iPhone幀率。
- `after/`：普通、真正珍本、普通心願、十連及書頁五種真結果；`before-visual/`是同尺寸原版兩種身份。原圖／提示／來源及新尺寸／hash映射見`design/art/gacha-codex/README.md`與`quality-mapping.json`。

## 畫質及效能

沿用原畫，書封從640×960轉回原生1024×1536，內頁從512×768轉回原生724×1086；只從原PNG裁頁／轉WebP quality92，無放大低解像、重畫或假字。四圖共2085942 bytes，約多1.38MiB。本機打包，不依賴圖床；快取、預載、sRGB、mipmap及斜角取樣完整。

封面／頁邊／訂線各自合併，八張20×2分段紙面仍繞固定書脊活動，彎曲及法線連續，UV不漂移。書封／紙頁改較輕材質，待機與揭曉抗鋸齒。雙頁展開取景保持在手機內。待機取消固定30fps節流，離屏／背景／減少動態停繪，彈窗遮擋略過繪畫。秘笈閣不再疊主頁環境墨點；啟封背景墨暈靜態、題字不用逐字模糊。

3D連續三個超過42ms慢幀才降低0.25DPR，最小0.8；超過一秒停頓不算慢幀，避免前後台切換誤降。結果恢復最高2DPR，文字與按鈕全程使用DOM完整解像度。遲圖只要求活躍結果補畫；離場清理GPU及訂閱。

| 同一SwiftShader／DPR1起始，不錄影，順序執行 | 普通改前→改後 | 珍本改前→改後 |
| --- | --- | --- |
| 翻冊每幀draw中位 | 70→17 | 74→18 |
| 翻冊幀間隔中位 | 66.65→33.3ms | 83.2→33.3ms |
| 翻冊幀間隔p95 | 133.3→66.6ms | 83.4→66.6ms |
| 翻冊實際DPR | 1→1 | 1→0.8 |
| 結果DPR | 1 | 1 |

最終對照報告`before-measure/report.json`／`measure-after/report.json`。這是少量軟件GPU樣本，包含自動解像度調節，並非固定畫質benchmark，更不能當原生iPhone30／60fps驗收。`before/`、`after-pure/`及`after-budget/`只保留先前診斷JSON：最初僅高清／抗鋸齒未改善慢幀，故進一步調整負荷；不以初稿代替最終版。結果rAF約16.7ms但GL draw0，表示不重畫，不代表持續渲染60fps。

## 主頁樣式與安全驗收

秘笈頁、池規／收藏等彈窗及結果用主頁紙底墨線；主要按鈕共用原`brush-btn-cinnabar.webp`，文字沿用game-ui-font。結果computed font family與主頁快捷按鈕核對一致；移除原仿古金屬框及額外紋理偽元素。書封顏色仍跟真實isPremium，心願／新得不會把普通武學變成珍本。

五個完整正常動態，加`skip/`十連跳過、`reduce/`減少動態十連、`missing/`缺圖、`late/`延遲圖片、`contextlost/`實際WEBGL_lose_context與`no-webgl/`不支援WebGL，共11情境。每個對照真核心meta的jade／gacha／manuals／pages；同事件迴圈兩次抽取只結算一次，三次完成不重扣。十份結果齊全，結果完整字體、抗鋸齒、DPR恢復及舊Canvas／context離場釋放皆通過。延遲圖到達後有補畫，之後停止重畫。pageerror0。強制中斷與無WebGL沿用可讀DOM結果，不重抽或重派。

`layout/report.json`為Chromium／WebKit各7組：320×568（20／0）、375×667（20／0）、390×844（47／34）、393×852（59／34）、430×932（59／34）、768×1024（24／20）原生識別／安全區輸入模擬，及390×844一般網頁。外層不溢出，主要操作至少44px、在安全範圍可點，返回地圖／鎮居與池規、收藏、選池／流派正常，導航不改帳戶；pageerror0及本地HTTP錯誤0。WebKit此處驗排版，不冒稱已完成iPhone WebGL效能測量。

`small/report.json`另測320×568十連，十張結果逐一實際點選及選取狀態通過；操作列留在結果捲動區底部，完成按鈕至少44px且觸控中心無遮擋，詳情／卡列仍可捲動；圖見small/ten-actions.png。結果停定亦收回印章模糊。

`equip/report.json`另以393×852正式構建測試單抽、人物裝備銜接與十連：第40抽普通心願命中，導向人物後原內功仍在，需明確指定欄位；單抽60／十連600、免費玉石優先及付費補足正確，十份結果／上次結果完整，關閉不重扣。普通網頁對照亦通過。

105檔775項Vitest（含紙頁書脊／UV／法線／重開、繪製預算、稀有度身份與慢幀調節）、mobile build含tsc、Capacitor同步、793資源hash、narrate hard-fail0及文案9685段／禁句0均通過。沒有更動經濟、入帳、裝備、出招、存檔或後端。新TestFlight仍要安裝後驗證實際幀率、冷啟、前後台與長時間表現。

## 重跑

`npx vite-node scripts/qa/makeCodexQualityFixtures.mts`產生.local-online隔離fixture；`npm run ios:sync`，開5176的vite preview。`python3 scripts/qa/checkCodexQuality.py`跑正常五種結果；用CODEX_MODE及CODEX_LABEL選skip／reduce／missing／late／contextlost／no-webgl，CODEX_CASES選fixture名稱。CODEX_DPR控制起始值、CODEX_VIDEO=1才錄影；量度須關錄影，改前後順序執行，不同時壓GPU。

排版沿用`checkGachaFullscreen.py`，GACHA_FULL_EVIDENCE指定本目錄layout；WebKit需要完整依賴或GACHA_WEBKIT_EXECUTABLE啟動器。所有腳本只使用隔離測試存檔並阻擋Supabase／遠端字體，沒有讀取玩家存檔或服務金鑰。
