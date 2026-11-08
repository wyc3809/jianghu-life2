# 第60g項兩張靜態評閱

2026-11-08；束髮／旅裝／原色／徒手。**未獲玩家確認、未套用正式戰鬥、未合併或上線。**

- `guard.jpg`：修正版待機，固定鏡頭；`punch.jpg`：同一角色直拳。
- `after-*-raw.png`：官方Spine Runtime 4.2.120直接輸出的透明原幀。宣紙底與標題係其後加嘅證據板，冇修畫人物或另行拼接接位。
- `before-*-raw.png`：原版素材／蒙皮／遮擋順序，同一固定姿勢及鏡頭；唔係EA0.102.0遊戲錄影截格。
- `before-after.jpg`：相同比例前後對照，紅框只標出肩部及腕部檢查位置。

量度、原圖hash、腳本與限制見`design/art/character-bind-review/README.md`及同目錄`measurements.json`。原始圖保留，正式`public/ink/art/independent/`未改。

## 驗證

- 完整Vitest：129檔、979項通過。
- 最後腕錨點校準後，四項針對性守門重跑通過：真材質逆綁定分歧、刻意移走單骨影響負例、兩姿勢袖口／手腕材質點對齊、遠臂三角形分層無重複／遺失。
- `npm run build`：TypeScript及Vite通過；現有大chunk警告仍在，未藉此宣稱效能已改善。
- `npm run audit:narrate`：hard-fail 0。
- Linux Chromium實際載入官方Runtime、按待機／直拳切換並出透明幀，逐張核對肩、袖口、拳頭及完整人物。原畫頭頸334行以上逐像素不變。

程式守門只攔截指定錯誤，唔代表人體、美術或姿勢已被玩家接受。今次冇新連續動畫或多人畫面；真iPhone／TestFlight、效能、其他外觀、兵器及全武學均未驗收。玩家接受兩張先做短動畫。

重跑：`python3 scripts/art/review_character_bind.py`之後`python3 scripts/art/render_character_bind_review.py`。冇修改核心／存檔API，唔用新動作重新計算戰果。
