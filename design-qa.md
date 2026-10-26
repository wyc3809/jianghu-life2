# 第48項人物頁設計驗收

Source visual truth: `design/art/person-screen/selected-third.png`（玩家選第三款）。
Implementation: 正式構建，本機真瀏覽器Chromium及WebKit，`http://127.0.0.1:5199/`。沒有部署，沒有當作TestFlight實機驗收。

- Viewport：390×844 CSS px；另測320×568、430×932。
- Source：853×1844 px；以等比例縮至約390×844比較，並非拉闊畫面。
- Implementation：780×1688 px，deviceScaleFactor=2，正規化至390×844。
- State：人物主頁開啟底部「更換武器」，候選已選中、尚未確認。來源的裝備及數字為示意；實作使用隔離存檔的真持有物。兩者並非同一套候選資料，不以假資料追求文字逐字相同。
- 全幅同圖比較：`production/qa/evidence/redesign/person-screen/comparison-design-final.jpg`。
- 重要細節同圖比較：`production/qa/evidence/redesign/person-screen/comparison-modal-focus.jpg`。
- 完整人物主頁及實際彈窗：`production/qa/evidence/redesign/person-screen/implementation-states.jpg`。

## Findings 與修正歷史

- [P1，已修正] 首輪紙紋以不透明灰階噪點鋪滿，與來源淺宣紙不同並妨礙文字。
  Evidence：`comparison-design-first.jpg`右側。改為紙色底＋3.5%位圖紙紋，保留圖像材質而不遮資料。Final：`comparison-design-final.jpg`、`comparison-modal-focus.jpg`。
- [P2，已修正] 首輪換裝窗太高，人物露出比例偏離第三款。
  改為一般屏高62dvh的底部冊頁；最短屏改86dvh以保留44px觸控和固定確認區。Final標準屏上緣約321px，接近來源約336px；短屏採明確響應式比例，不把圖硬縮。
- [P2，已修正] 舊導航漸層向上覆蓋，令武學／更多看似停用。
  Evidence：`05-person-390.png`、`05-person-320.png`。人物頁停用這個舊漸層。Final：`03-after-person.png`、`09-final-small.png`。
- [P2，已修正] 短屏護甲名稱與飾品欄接近重疊。
  保留至少52px圖示及類型標籤，短屏完整名稱於底部窗內閱讀；空欄圖示淡色，並提供讀屏描述。Final：`09-final-small.png`，長姓名／空背包另有兩引擎操作驗證。
- [P1，已修正] 換裝成功提示曾蓋住飾品點擊中心。
  提示限制在中央，pointer-events:none，2.4秒自動收起；手機路徑驗收增加主要按鈕中心命中檢查，防止只檢查尺寸卻被透明層遮住。Final六組測試通過。

## 必檢視覺表面

- Fonts/typography：正文沿用主頁`--game-ui-font`（Noto Sans CJK TC及系統fallback），14–16px操作文字，13px輔助資訊；候選名稱14px、比較名稱14px、主操作22px。標題使用主頁粗體而非把生成圖中文字烘成素材。長名稱格內最多兩行，選中後有完整名稱、詞綴及描述；觸控不少於44px。生成圖的題字風格不是新字體規格，玩家已要求跟現有主頁文字。
- Spacing/layout rhythm：中央盤坐、三個器物欄位、同頁戰力排名、主頁固定、底部視窗、三欄背包及固定比較／換上均保留。只有背包格捲動，篩選同窗展開。真實長名稱及觸控尺寸使可見候選比概念圖少；以內捲保留全部物品，不縮細文字硬塞九件。
- Colors/tokens：淺紙、墨綠`#30362e`、少量朱砂`#9c4336`及原主頁筆刷按鈕；稀有度色依現行六階裝備身份。沒有霓虹或深古銅主題。
- Image quality/assets：生成並檢視獨立盤坐人物、淡山水及九款透明器物圖；不是將整張UI圖放作不可操作背景。人物768px、器物256px，WebP真alpha，執行素材合計805250 bytes。原圖、提示、來源、hash、映射及處理腳本保留；沒有SVG、CSS角色繪圖或粗糙佔位圖。
- Copy/content：實際五維仍根骨／悟性／福緣／魅力／膽識，戰力、排名、境界、氣血內力、心性、裝備及所有差額讀真資料。概念圖的128名／1003戰力等未寫死；初期角色如實顯示未列名。不增設裝備槽、等級或年齡系統。裝備戰意明確命名，不冒稱人物總戰力。

## 行為與驗證

- 真持有及同類限制，品質／排序、預覽、取消、關閉、換上、成功提示、更多／武學入口、普通與對戰分開保存。
- 取消不更改人物、資源及修煉；確認沿用既有核心，上限重算照常，沒有重扣或另開結果窗。
- Chromium／WebKit × 三個手機尺寸共6組；空背包／長姓名另驗證。圖片自然尺寸、文件橫溢、主頁垂直溢出、觸控命中、頁面錯誤及舊分頁控制檢查通過。
- 859項Vitest、正式構建、narrate/copy檢查通過。既有chunk大小提示仍在。

## 接受的產品差異與後續

- 概念圖是示意資料，實作不得追逐示意數字或不存在的五維。來源下半人物資料被彈窗遮住；完整人物主頁依已確認功能排版，不對遮擋內容作像素精度聲稱。
- 玩家追加要求人物頁用江湖地圖式全屏：人物範圍不掛載全局導覽，左上返回鎮居後恢復原導航／過月。最新前後圖及驗證見`production/qa/evidence/redesign/person-fullscreen/`；原person-screen截圖保留作本輪前的歷史。
- [P3] 可再按玩家實機手感調整冊頁高度、人物光影及同類裝備圖示的個別差異。暫用按器物種類映射的原創圖，品階／名稱／詞綴由真資料區分。
- 尚未測iPhone實機鍵盤、VoiceOver、前後台或裝置幀率；本報告為真瀏覽器手機尺寸的設計及操作驗收。

## Implementation Checklist

- [x] 第三款來源與真實截圖同圖對比；全幅及細節均已檢視。
- [x] P0/P1/P2已修正並有後續截圖／互動證據。
- [x] 原創素材、主要動作及完整資料入口接入遊戲。
- [x] 主頁固定、三欄位、比較後確認，兩套配搭獨立。
- [x] 保留原規則、存檔及結算；未發布。

final result: passed


發布範圍補充：EA0.94.0只抽取已確認人物頁及其必要依賴，其他模式維持EA0.93.0。完整發布分支驗證另見production/qa/evidence/redesign/release-ea094/；前面的859項為原型歷史，未當成發布分支測試數量。
