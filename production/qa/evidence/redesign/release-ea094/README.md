# EA0.94.0 · 人物與裝備全屏發布

玩家已檢視第三款及全屏前後圖並確認「上線」。發布分支work/person-fullscreen-ea094由EA0.93.0主線抽取人物改動，未將未採用的全遊戲翻頁原型或修煉核心改動一併發布。

- 人物：原創盤坐人物、三個真實裝備欄、戰力／排名／境界／氣血內力／五維心性。
- 換裝：同類真持有物、品質及排序、選中比較、明確確認、兩套獨立保存，取消不換裝。
- 全屏：無全局頂欄／底部過月導覽，左上返回鎮居後恢復導覽；主頁與玩家確認的最後截圖逐像素相同。
- 人物詳情：保留武學、收藏及全部更多入口，原生內容區閱讀，沒有上一頁／下一頁。

## 本次正式分支驗證

完整109檔844項測試通過。原型分支111檔859項包含未發布的修煉條件及分頁邏輯測試；本次沒有刪改任何主線測試，增加兩項裝備純讀取及比較測試。

TypeScript與Vite正式構建通過，既有bundle大小提示維持。narrate hard-fail 0，copy口語／禁句0。

Chromium與WebKit各驗證320×568、390×844、430×932，另測兩引擎短屏空背包及長姓名；完整結果見[report.json](report.json)。全屏、按鈕中心命中、預覽取消不變、確認換上、普通／對戰獨立及返回恢復導覽均檢查。測試存檔隔離且封鎖Supabase及外部字體。

- [發布分支實際人物頁](03-after-person.png)
- [發布分支實際換裝窗](04-after-picker.png)
- [玩家確認的前後對比](../person-fullscreen/comparison.jpg)
- [第三款來源與歷史設計驗收](../person-screen/README.md)

本次core、data、content、interfaces、src/cloud、src/fx、src/styles.css、秘笈閣、修煉、事件、設定及共享流派分類皆與EA0.93.0主線一致。新增人物分類封裝只供人物使用；GachaSheet只在人物context加原生詳情樣式，其他呼叫保持原有行為。

## 發布及實機界線

網頁部署與Mac未簽名Archive由GitHub Actions驗證。Codemagic／Apple沒有本環境可用連線，未宣稱觸發已簽名IPA或TestFlight更新。擁有者可在Codemagic選main及ios-internal-testflight建立內測，Apple build號沿用既有自動遞增腳本。iPhone實機、VoiceOver、前後台及裝置幀率仍待驗收。
