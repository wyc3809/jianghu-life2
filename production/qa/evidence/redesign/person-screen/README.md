# 第48項 · 第三款人物及裝備頁

玩家已選第三款設計，這份證據係實際接入遊戲的畫面及操作；仍為EA0.93.0本機驗收版，未發布。

玩家其後要求移除人物頁底部整條導覽，改為全屏及左上返回。最新畫面及驗證見[人物全屏追加](../person-fullscreen/README.md)；本目錄保留改動前的設計過程及換裝操作證據。

- [實際人物頁與換裝視窗](implementation-states.jpg)
- [人物主頁前後對比（紅框）](comparison-before-after.jpg)
- [第三款設計與實作同狀態對照](comparison-design-final.jpg)
- [彈窗文字及器物細節對照](comparison-modal-focus.jpg)
- [實際換裝示範GIF](equipment-demo.gif)
- [320×568短屏](09-final-small.png)
- [自動化手機路徑報告](report.json)

## 真正接入

中央盤坐人物與三類裝備同頁。戰力、排名、境界、氣血／內力、根骨／悟性／福緣／魅力／膽識及四項心性來自現行遊戲；預覽圖的數字及示意五維不作新數值。普通與對戰兩套獨立。

底部換裝視窗有真持有物、類型限制、品質篩選、名稱／品質／戰意排序、選中狀態、當前與候選比較、全部詞綴與固定確認操作。圖示按器物種類共用，名稱、品階、詞綴及增減始終讀真資料。點選只預覽，確認才沿用既有換裝核心。成功後返回人物頁顯示短提示，不另開結果窗。

其他人物資訊由「武學／更多」進入。人物範圍內不再顯示上一頁／下一頁；長收藏及資料在獨立內容區閱讀，主頁固定。既有修煉、傳承、人物誌、傷勢、裝備詳情及整裝披掛仍可到達。

## 驗證

- Vitest：111檔、859項全過。
- 正式構建：TypeScript及Vite成功；既有chunk體積／靜動態匯入提示保留。
- `audit:narrate` hard-fail 0；`audit:copy`口語／禁句0。
- Chromium與WebKit，各測320×568、390×844、430×932，共6組。主頁固定、三類欄位可點、主要觸控至少44px、沒有上一頁／下一頁、圖片載入及頁面錯誤檢查均通過。
- 預覽／取消不改裝備、內力／氣血、配搭、資源或修煉次數；確認換裝後不再另開結果窗。連點確認不重送，普通及對戰獨立；篩選排序及詞綴保留。
- 額外測試兩引擎最短屏：空背包及八字長姓名。空背包有真實空狀態，無選中物時不能換上。
- 所有截圖與瀏覽器資料來自隔離測試存檔，Supabase及外部字體請求封鎖；沒有讀取或上傳玩家存檔。錄影暫存留在忽略的`.local-online/`。

## 設計檢查修正

首輪紙紋以不透明圖片鋪滿，遮掩文字；已改為淺紙底及3.5%紙紋。底部舊導航漸層令武學／更多變淡，已在人物頁取消。短屏裝備名稱與相鄰欄位重疊，已保留大圖示及類型標籤，完整名稱改於彈窗閱讀。換裝提示曾蓋住飾品點擊中心，已限制提示範圍、禁止攔截觸控並自動收起。

最後對照及五項視覺檢查見專案根目錄 `design-qa.md`。

## 重跑

安裝專案及Python Playwright依賴後：

```sh
npx vite-node scripts/qa/makeGamePolishFixtures.mts
npx vite-node scripts/qa/makePersonScreenFixtures.mts
npm test
npm run build
npx vite preview --host 127.0.0.1 --port 5199 --strictPort
```

另一終端：

```sh
python scripts/qa/checkPersonScreen.py
```

`MARTIAL_WEBKIT_EXECUTABLE`可指定本機WebKit執行檔；Chromium預設`/usr/bin/chromium`。`PERSON_ENGINES`、`PERSON_SIZES`只供針對失敗案例檢查，最終報告使用兩引擎三尺寸。

## 限制

以上係真瀏覽器手機尺寸驗收，未當作TestFlight實機驗收。iPhone虛擬鍵盤、前後台、VoiceOver及裝置幀率仍待實機檢查。本輪沒有更動戰鬥、機率、裝備規則、消耗、存檔格式或多人服務。
