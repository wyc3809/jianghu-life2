# 千燈鎮晨景首頁 · 設計對照

玩家已選第三張千燈鎮晨景；唯一參考為[selected.png](design/art/town-opening/selected.png)，852×1846。以正式Pages構建、本機Chromium實際操作及截圖驗收，不另建示範網站。

## 比較證據

- [完整來源／實作同框](production/qa/evidence/redesign/town-opening/reference-vs-actual.jpg)：來源等比例縮至390×845後裁底部1px空白；實際390×844 CSS、deviceScaleFactor 2，原截圖780×1688，降至390×844作密度對齊。兩者均沒有裝置外框，均為可續寫入口。
- [標題與操作放大](production/qa/evidence/redesign/town-opening/focused-comparison.jpg)、[前後對照](production/qa/evidence/redesign/town-opening/before-after.jpg)。
- [320短屏](production/qa/evidence/redesign/town-opening/opening-320.jpg)、[390](production/qa/evidence/redesign/town-opening/opening-390.jpg)、[430](production/qa/evidence/redesign/town-opening/opening-430.jpg)、[新開卷](production/qa/evidence/redesign/town-opening/fresh-390.jpg)、[本世結束長提示](production/qa/evidence/redesign/town-opening/summary-320.jpg)、[人物頁保持](production/qa/evidence/redesign/town-opening/person-390.jpg)。

## 發現及修正

- [P2，已修正] 首次主／次操作字級約14px，比來源約21px實心字高細，視覺份量不足。首頁操作改22px、700字重、1.3行高，主鍵上下6px；保留12px真姓名提示。[首次同框](production/qa/evidence/redesign/town-opening/iteration-1-compare.jpg)與最終同框已重新檢視，兩鍵清楚且留白接近來源，短屏不出界。
- 沒有未解決P0／P1／P2。現有已授權Jianghu Brush TC毛筆字並非來源生成圖的逐筆複製；保留可讀、可選取的真標題及卷首。原有續寫姓名提示亦保留，因此主鍵多一行小字。

## 最終檢查

字型／字重／行高、標題與按鈕間距、淺紙／青山／朱砂色、背景比例／清晰度、文字／位置、真操作及畫面尺寸逐項比對通過。石橋左、茶樓右、日出、柳枝、空舟及桃花與所選構圖一致；背景沒有烘焙文字、按鈕、人物或剪影。只首頁使用新圖，人物頁仍是既有漫畫立繪及共用日景。

正式構建三尺寸320×568、390×844、430×932無橫向或開卷垂直溢出，全部操作至少44px；深色系統仍保持淺紙。真鍵盤Enter／指針續寫各只發一次click；390按下即墨跡、縮放小於.96。新開卷真姓名輸入、預設造型及未提早存檔、續寫／人物頁後原數值／心性／裝備／外觀／武學／收藏保持，長提示短屏亦通過，共7組。[browser.json](production/qa/evidence/redesign/town-opening/browser.json)。

額外獨立檢查首頁→續寫→人物頁，console error與pageerror均0；實際字型／色／尺寸見[console.json](production/qa/evidence/redesign/town-opening/console.json)。完整145檔1,054項、Pages構建、敘事hard-fail 0、文案禁句0及素材尺寸／格式檢查通過。按壓與墨跡沿用原共用減少動態規則。這是瀏覽器驗收，並非真iPhone、VoiceOver或TestFlight安裝驗收。

final result: passed
