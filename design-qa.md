# 青綠暖金漫畫首頁 · 設計對照

玩家明確接受design/art/town-manhua/selected.png，並要求照稿製作及記住風格；原稿852×1846。正式Pages構建的production/qa/evidence/redesign/town-manhua/opening-390.jpg為780×1688，CSS390×844，deviceScaleFactor2；來源等比縮390×845再裁底1px空白，實作等比降390×844。同為可續寫入口，沒有裝置外框。

## 發現及修正歷史

- [P2，已修正] 第一輪卷首比接受稿低約18px，主／次操作過闊及主鍵／題眼偏細。iteration-1-compare.jpg與iteration-1-390.jpg保留第一輪實畫；修正卷首top23→5、題眼13→15、主題約54→60px並維持副題位置，主鍵26px／最大330px、次鍵20px／最大280px。短屏保留42px標題與22px操作及安全區。
- 修正後重新構建及操作，已開啟reference-vs-actual.jpg完整同框與focused-comparison.jpg標題／主次操作放大，確認留白、層次及操作份量。沒有未解決P0／P1／P2。
- [P3／既有產品約束] 沿用已授權Jianghu Brush TC與Noto Serif TC真字，不逐筆複製生成稿字形；原姓名提示仍在主鍵內，主／次控制沿用既有位圖筆觸與紙框。這些是操作與字體的一致性保留，不改接受背景的漫畫畫法。

## 五項對照

1. 字體：主題為既有授權毛筆字，墨色#242d2c；題眼15px朱砂、標語14px、卷首15px、主鍵26px／次鍵20px／姓名12px。層次清楚，短屏無文字或操作裁切。
2. 留白／排列：橋左、茶樓右、太陽中上與金色水路位置一致；卷首移回左上淨空，UI不遮主光源或橋面。320／390／430等比例cover，無拉伸或橫向溢出，底鍵至少44px且在螢幕內。
3. 色彩：接受稿的青綠／米白／暖金、少量朱砂保留；深青屋簷／橋底、金色受光邊與水面光路同向，沒有回到淡彩碎花或整體壓暗。深色系統仍維持淺紙。
4. 圖片：852×1846 RGB、212,976-byte WebP僅格式轉換；原PNG、hash與manifest保留。根代理檢視去UI背景與接受稿，光影／構圖一致，無文字殘留、人物或剪影；沒有以CSS／SVG重畫景物。
5. 文案：江湖一生、武俠人生、習武／闖蕩／傳承、少年起於千燈鎮及既有開卷／續寫保持真DOM；實際姓名與本世結束長提示沿真存檔顯示，沒有額外開發標注。

## 操作與驗證

正式構建320×568、390×844、430×932，三續寫、三全新創角及短屏總結提示共7組通過；鍵盤Enter／真指針各只發一次原生click，390按下墨跡及縮放小於.96。無提前存檔，預設造型保持；續寫及人物頁後數值、心性、裝備、造型、武學、收藏保持，人物頁仍是原漫畫立繪與daylight-landscape背景。共用減少動態、聲音及Haptics路徑沒改。

另獨立重跑首頁→續寫→人物頁，console error及pageerror均0；實際字體／色／位置記於console.json。145檔1,054項、最終Pages構建、敘事hard-fail0、禁句0、素材及diff檢查通過。這是既有遊戲正式構建的Chromium實畫驗證，沒有另建Sites原型；不代表真iPhone／VoiceOver／TestFlight安裝驗收。

證據位於production/qa/evidence/redesign/town-manhua/：完整／局部對照、前後圖、三尺寸、新開卷、長提示、人物頁、正常速度entry.gif、browser.json、console.json與asset-report.json。風格已記入design/art/STYLE.md及AGENTS.md，參考原稿持續保存在專案。

final result: passed
