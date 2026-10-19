# 主角全程細節人物

玩家指出原本出招先由黑影變細節人物，本批統一主角待機、行路、受擊、出招、內功／身法回應及倒地外觀。敵人外觀同玩法未改。

## 真實畫面

- `comparison.jpg`：EA0.78.0（3f374c6）獨立工作區改前／改後待機。390×844、DPR2、seed42、免費600／付費0。係同一產品SparStage嘅固定狀態檢視，暫停畫面update、統一位置及透明度，唔冒稱自然戰鬥截圖。
- `before-idle.png`／`after-idle.png` 及 `walk/hurt/down-inspection.png`：實際頁面，待機用武學自己嘅細節守勢，另外三種狀態用新增同款人物；有獨立透明像素可見性檢查。
- `home.mp4`：真實主頁演武，正常速度，包含行路、出招、收勢待機及內功回應；冇用逐格檢視冒充實戰。
- `event-boss.mp4`：真實江湖首領戰報，測試角色低氣血／僅長河拳，使用核心真正落敗結果，顯示受擊及完整倒地收束；唔假造傷害或勝負。
- `home/spar-boss/event/event-boss-live.png`：四個真正入口。主頁首領經實際過小兵觸發揭幕，唔直接替換敵人。
- `320-fallback-False.png`／`420-fallback-False.png`：短／闊手機減少動態；`390-fallback-True.png`：新人物圖及整個武學圖集網絡失敗，仍有嵌入細節人物，唔退返黑影。

影片無音訊，24fps係影片編碼唔係裝置fps。環境係Linux Chromium／SwiftShader，未做iPhone真機、GPU峰值或長時間效能驗收。

## 驗證方式

`report.json` 記錄真實頁面SparStage每幀畫主角時嘅drawImage來源：舊主角idle、attack、walk、atk、commercial walk／down都列入黑影來源，分別統計行路／待機／出招／內功／受傷／倒地。每個情境要求畫主角有drawImage，舊來源0，唔係只檢查載入咗新圖；固定姿態另檢查實際透明像素，避免畫到空格。外部HTTPS全部阻擋，瀏覽器存檔獨立，唔接觸玩家雲端。

`tests/hero_appearance.test.ts` 核對全狀態幀、基本攻擊、出招回待機、換裝、倒地優先及全網絡失敗後備；既有 `martial_poses.test.ts` 嘅66門外功×900步核心事件比較，啟用新人物路徑亦唔改任何結算或敵方行動。冇改skip、timeout或戰鬥核心。

重跑：主工作區開5173，3f374c6工作區開5174；`python scripts/qa/checkHeroContinuity.py`。可用 `HERO_QA_CASES=event,event-boss,320,390,420` 增量驗入口、`HERO_QA_STATIC_ONLY=1` 只重拍狀態對照；增量會保留其他已完成報告。

歷史工具問題保留喺 `history/`：直接改tab被介面原有導航覆蓋、凍結測試存檔未複製先修改、戰報只載實際使用武學卻錯等全五門、短觀察時間未錄到真正倒地。都已修正驗收腳本，失敗唔當通過。

原圖、生成提示、透明分格、固定比例／腳底、素材hash及處理腳本見 `design/art/hero-continuity/README.md`。本批未升版／未上線，正式版仍EA0.78.0。

最終驗證：652項Vitest／89檔、Pages build（含tsc）、narrate hard-fail0全部通過。七組真入口／手機／缺圖情境共2,534幀主角繪製，舊黑影來源0，無人物drawImage空格，pageerror0；真正落敗61幀倒地及四種固定姿態像素可見性通過。構建只有既有chunk大小提示。

`home-preview.gif`係實際主頁影片第3–11秒、只裁出演武台，12fps預覽；冇補畫或加速。重建：`ffmpeg -y -ss 3 -t 8 -i home.mp4 -filter_complex 'crop=390:354:0:236,fps=12,scale=390:-1,split[a][b];[a]palettegen[p];[b][p]paletteuse' home-preview.gif`。
