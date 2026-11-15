# 明亮漫畫宣紙 · EA0.112.0

玩家指出開卷、人物等背景太深，要求貼近既有完整漫畫立繪及統一風格。開卷由黑金夜景改為明亮山水宣紙、墨字、直排卷首、既有完整立繪及朱砂主鍵；人物、創角、人物誌、衣櫥／武學卡片、修煉、秘笈等沿用共用淺紙與淡青／桃色環境。人物誌同用真造型頭像，移走舊英文副題並分開關閉鍵與頭像。

共用1024×1536背景只新增一張，runtime WebP 134,300 bytes；source.png保留原生成PNG及metadata，重建／來源／hash／權利註記見design/art/daylight-theme/。技能asset_report尺寸／格式檢查通過，接觸表及實際遊戲檢查完成。舊背景素材保留，不把生成結果直接當成遊戲驗收。

opening-before-after.jpg及person-before-after.jpg為同一隔離存檔390×844前後實畫；overview.jpg展示開卷、創角、鎮居、人物、衣櫥、武學、人物誌、修煉、地圖與秘笈。daylight-art.gif來自真正遊戲操作正常速度錄影，未加速或另造介面。原始QA影片留.local-online/daylight-art，正式圖／報告放本目錄。

browser.json：正式Pages構建，Chromium 320×568、390×844、430×932。開卷完整立繪、主鍵至少44px及短屏可見、真續寫／新創角、深色系統仍用明亮紙色、人物與各冊頁共用背景／材質、真造型人物誌與關閉鍵不互蓋、原生彈窗及返回通過。390尺寸按下墨跡／壓感、原生click僅一次亦通過。三個新創角情境不採用封面外觀、可輸入姓名且未提早寫存檔；真夜雨事件ord_rain仍保留夜間標記／語境，但不疊舊黑底，共7組。

屬性／心性、裝備／配搭、外觀、武學、收藏及玉石在瀏覽／預覽取消／續寫後保持；雲端封鎖，沒有pageerror、破圖或橫向溢出。brightness.json為前後JPEG平均灰度（0–255，僅比較同情境明暗，不作屏幕亮度／色彩校準或正式無障礙認證）。

145檔1,054項、Pages構建、敘事hard-fail 0、文案禁句0處及diff通過。重跑：VITE_ONLINE_PUBLIC=1 npm run build:pages，VITE_BASE=/jianghu-life2/ npm run preview -- --host 127.0.0.1 --port 5313，然後python3 scripts/qa/checkDaylightArt.py；DAYLIGHT_BASE可改正式網址。

瀏覽器theme-color、PWA與iOS WebView／LaunchScreen紙色同步；原有安全區、按壓、聲音、原生Haptics及減少動態保持。江湖地圖保留原圖／四地標座標，只淡底及改朱砂小點；戰鬥、天氣粒子、玩法、數值及存檔不改。沒有真iPhone硬件或Apple上傳驗收結論，TestFlight須從最新main重新建置安裝。
