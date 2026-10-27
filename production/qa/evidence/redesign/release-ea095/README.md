# EA0.95.0 · 第49–50項發布

玩家檢視已接入的宣紙框／換裝稿與點按水墨示範後確認「上線」。本次承接EA0.94.0，只發布第49及50項：共用宣紙、毛筆題字、朱砂筆觸與指定換裝窗；寶箱／秘笈結果紙框、短屏抽取操作；點墨節奏、有效點按、連點限額、空閒停畫、減少動態及按壓材質修正。

`git diff origin/main -- core data content interfaces src/store src/cloud`為空；不包含第46項修煉核心或第47項未採用的分頁原型。沒有改經濟、戰鬥、抽取結果、保底、存檔schema、API或簽署設定。第49項單件戰力仍只讀現行公式；第50項為純畫面seed。

## 驗證

- 110檔850項測試通過；tsc＋Vite正式Pages構建、narrate hard-fail=0、copy 9935段／口語及禁句0。
- 第49項：六組人物手機流程、十個畫面紙框、真單抽／320短屏十連及開發寶箱示範，見 `../parchment-ui/README.md`。
- 第50項：Chromium／WebKit各三種手機尺寸、墨跡位置、拖動／長按／取消／停用／非主指、30次連點、空閒停止、即時減少動態與高光抑制。兩引擎另做真確認換裝，配搭及扣費邊界正確，見 `../tap-ink/README.md`。
- 本次Pages base `/jianghu-life2/`正式構建再做390×844 DPR2檢查：人物全屏／返回、真持有裝備預覽／取消不改狀態、毛筆font與新紙框載入、原生dialog與主頁點墨位置；`pages-smoke.json`及`pages-picker.png`。
- 測試使用隔離存檔並封鎖雲端，不操作玩家真帳戶。構建保留原有chunk大小提示；不宣稱真iPhone硬件FPS／VoiceOver已驗收。

發布依AGENTS.md經PR、CI及iOS未簽名Archive檢查後squash merge，再核實Pages部署與線上JS的EA0.95.0版本及新素材。已簽署TestFlight上傳與網頁部署分開；本環境沒有Codemagic／App Store Connect可調用能力，GitHub Mac Archive不等於Apple已接收新build。Codemagic工作流仍為`ios-internal-testflight`，以main建置。
