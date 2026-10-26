# 第48項追加 · 人物全屏

玩家要求人物頁移除底部「過一月」整條導覽，跟江湖地圖採全屏，保留左上返回。之後按功能判斷是否適用，不將所有頁面一律全屏。偏好已寫入根目錄AGENTS.md。

- [修改前後對比及紅框](comparison.jpg)
- [實際390×844人物頁，DPR2](03-after-person.png)
- [換裝視窗](04-after-picker.png)
- [手機路徑驗證](report.json)

人物範圍不再掛載全局導覽，亦不預留底欄高度；標準390×844畫面多出80px內容空間。人物、裝備、真數值、普通／對戰配搭、武學及更多入口保留。左上返回鎮居後恢復原導航，返回不觸發過月或換裝。

沿用原有換裝手機路徑驗證，增加全屏無HUD／底欄、主要按鈕可點及返回後恢復導覽檢查。Chromium與WebKit各測320×568、390×844、430×932；另測短屏長姓名／空背包。只用隔離測試存檔，封鎖Supabase及外部字體，沒有玩家資料讀寫。

重跑：正式build於5199提供預覽，生成原有人物fixtures後，執行：

```sh
PERSON_OUT=production/qa/evidence/redesign/person-fullscreen python3 scripts/qa/checkPersonScreen.py
```

WebKit可用`MARTIAL_WEBKIT_EXECUTABLE`指定本機執行檔。這次沒有新增動畫；前後圖為實際遊戲截圖，不是概念圖。

Vitest111檔859項、正式build、narrate hard-fail 0及copy口語／禁句0。既有bundle大小提示維持。未在iPhone實機驗證；未上線或更新TestFlight，版本仍EA0.93.0。
