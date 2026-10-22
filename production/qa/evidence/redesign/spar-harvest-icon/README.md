# 掛機收成改淨icon（待玩家睇圖）

EA0.84.0基線。玩家要求入口唔要文字同外框，減少遮住演武台。

- 移除入口「掛機收成」文字、長方框、紙色底與陰影；沿用36px香爐位圖icon，透明觸控範圍44×44。
- 有待收成保留6px朱砂提示點；無待收成仍可點開詳情。保留讀屏名稱及鍵盤焦點提示。
- 詳情、收成核心、獎勵、演武台及抽卡機率都無改動。

`comparison.jpg`：390×844 DPR2 前後對照，紅框標改動。`before.png`／`after.png`原圖；同一seed42、玉石free600／paidTest0、QA氣血2000及第6關精英。

`home-*.png`／`details-*.png`：320×568、390×720、390×844、420×896。已驗入口44×44、無可見文字／外框／底色、位圖真載入、可點、無橫向溢出；點開真實詳情、收起後焦點返回，無待收成仍可查看，pageerror0。只用隔離本機QA存檔，阻止雲端請求。

`interaction.mp4`：實際點開／收起流程；`interaction.gif`正常速度節錄（降幀壓縮）。`report.json`保留實際CSS及觸控檢查結果。

重跑：Vite啟動5173；`python3 scripts/qa/checkSparHarvestIcon.py`，前圖用EA0.84.0原始入口及`ICON_QA_MODE=before`。沿用`checkSparHome.py`嘅同一組本機QA場景，唔執行舊全量回歸。比較板用`python3 scripts/qa/buildSparHarvestIconBoard.py`。

驗證紀錄：`tests.txt`／`build.txt`／`narrate.txt`。未發布；未當iPhone真機測試。
