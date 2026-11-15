# EA0.112.1 · 千燈鎮晨景首頁驗收

玩家已選第三張千燈鎮晨景。只將首頁封面改為已選景物，移除首頁人物；標題、卷首及按鈕用真DOM。人物頁／衣櫥及其餘共用淺色背景保持。來源與重建見design/art/town-opening/，詳細比對見根目錄design-qa.md。

- before-after.jpg：正式EA0.112.0首頁與新首頁390×844前後，紅框標改動。
- reference-vs-actual.jpg及focused-comparison.jpg：已選來源與正式構建同框，整體／標題／主次操作。iteration-1-*保留按鈕字級偏小的首次證據，最終22px已修。
- opening-320/390/430.jpg：三手機尺寸，deviceScaleFactor 2；fresh-390為新開卷，summary-320為本世已結束長提示，person-390確認人物頁保留。
- entry.gif：真瀏覽器正常速度，首頁焦點／按壓／墨跡與續寫、進人物頁；原video的1.35–4.52秒，12fps、280px寬，沒有加速。
- browser.json：checkTownOpening.py正式構建共7組，三尺寸無溢出、按鈕至少44px、深色系統仍淺色、原生click一次、真開卷／續寫、原裝備／數值／造型／武學／收藏保持；390真按下墨跡及壓感。其餘尺寸的entryInkAndPress:false代表該組以鍵盤驗收，不代表按壓失敗。fixture／新開卷情境阻隔雲端，隔離真玩家存檔。
- console.json：獨立正式構建首頁→續寫→人物頁console及pageerror均0，另記真字型／色／尺寸。
- asset-report.json：852×1846 RGB WebP格式與尺寸通過；根代理另檢視來源及無UI背景，沒有文字殘留或人物。

完整145檔1,054項、Pages構建、敘事hard-fail 0、文案禁句0及diff通過。正式構建檢查網址http://127.0.0.1:5315/jianghu-life2/；重跑：TOWN_OPENING_BASE=<正式站或preview網址> python3 scripts/qa/checkTownOpening.py。瀏覽器報告不等於真iPhone／VoiceOver／TestFlight安裝，原生Archive及正式站版本以PR／部署紀錄為準。
