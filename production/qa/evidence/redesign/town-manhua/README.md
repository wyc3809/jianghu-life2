# EA0.112.2 · 已確認青綠暖金漫畫晨景

玩家看過修訂示意明確說「好好！就跟住咁整 同埋記住呢種風格」。以design/art/town-manhua/selected.png為唯一接受稿，首頁改清楚漫畫線條與明暗色塊、青綠／米白／暖金及少量朱砂，保留太陽斜光、橋左茶樓右、空舟及金色水面光路；移走淡彩碎花方向。首頁仍無人物／剪影；人物頁、衣櫥、其他背景及玩家資料保持。

風格已保存design/art/STYLE.md及AGENTS.md，未來新環境圖需連同接受圖參考，不代表重畫已接受人物或把門派衣服一律染綠。

- reference-vs-actual.jpg：來源與實作同框，來源852×1846等比縮390×845裁底1px，實作780×1688／390×844 CSS／dpr2等比降390×844，均為可續寫入口且無裝置外框。
- focused-comparison.jpg：題字、卷首與主／次操作放大；before-after.jpg：正式EA0.112.1淡彩與本輪漫畫風，紅框標改動。
- iteration-1-*：第一輪卷首較低、主次鍵偏闊／主字偏細；修正後重新擷取最終同框。根design-qa.md為passed，P3保留授權真字與原姓名提示／原筆觸紙框。
- opening-320/390/430.jpg、fresh-390.jpg、summary-320.jpg：三尺寸、全新開卷與短屏長提示。person-390.jpg確認人物頁保持原背景／立繪。
- entry.gif：正式構建真瀏覽器1.95–5.20秒，12fps、280px寬、正常速度；呈現首頁焦點／按壓墨跡、原續寫與人物頁。
- browser.json：共7組，三續寫／三創角／短屏長提示，原生click一次、390真按下墨跡與壓感、所有按鈕至少44px、深色系統仍淺色，原數值／心性／裝備／造型／武學／收藏保持。其餘尺寸entryInkAndPress:false代表以鍵盤測試，並非按壓失敗。情境用隔離存檔及阻隔雲端，不改真玩家進度。
- console.json：獨立首頁→續寫→人物頁，console error及pageerror均0，另有實際字體／色／邊界。
- asset-report.json：852×1846 RGB WebP格式／尺寸通過；去UI圖另經根代理與接受稿視覺檢查。

完整145檔1,054項、最終Pages構建、敘事hard-fail0、文案禁句0及diff通過。重跑：TOWN_OPENING_BASE=<preview或正式站> python3 scripts/qa/checkTownOpening.py；預設結果.local-online/town-manhua/qa，可用TOWN_OPENING_OUT指定隔離目錄。本機正式構建http://127.0.0.1:5315/jianghu-life2/，正式站發布結果以PR／Pages紀錄為準。

光影是已確認靜態畫稿，不冒稱即時3D或動態水面。真iPhone／VoiceOver及Apple簽署上傳沒有本輪驗收結論；Mac Archive與網頁發布分開，TestFlight需從新main建立新build。
