# 第49項 · 換裝稿與全遊戲宣紙框

這批係接入遊戲後的真畫面，仍為EA0.94.0本機待驗收版；未推送、上線或更新TestFlight。

- [實際更換武器](after-picker.png)
- [指定原圖與實作並排](source-comparison.jpg)
- [框邊／題字／比較區細節對照](focus-comparison.jpg)
- [修改前後紅框](before-after.jpg)
- [其他功能的共用框架](shared-frames.jpg)
- [實際換裝、詳情及負差額示範](equipment-demo.gif)
- [寶箱示範結果框](after-chest-demo-result.png)
- [真單抽結果框](after-gacha-result.png)
- [320短屏十連結果](after-ten-320.png)

## 接入內容

原稿仍是 `design/art/person-screen/selected-third.png`。新框架有明亮宣紙纖維、真alpha窄磨邊、極淡水彩遠山格、朱砂乾筆、灰墨題簽及真正毛筆文字；題字並非整張圖片烘字。產物與來源、授權及重建腳本見 `design/art/parchment-ui/README.md`。

更換武器／護甲／飾品維持真持有物、品質／排序、只預覽及明確確認、普通／對戰獨立。比較改成左右器物及全部真差額，點名稱看完整詞綴；多件背包只在窗內捲動。單件裝備戰力沿用既有公式，不混入其他裝備或更改人物。原稿9件示意兵器／128名沒有寫入遊戲。

共用框架覆蓋人物、設定／帳戶、修煉、秘笈閣／收藏／心願／池規、任務／收成、祖祠／名冊、多人框架及獎勵模組。演武只換外框，Canvas及出招不變；人物誌亦沿用新紙材。框架標準已記入AGENTS.md。

## 驗證

- 109個Vitest檔、845項全過。新測試檢查單件裝備戰力不混入其他裝備、不改人物；既有測試沒有停用或刪除。
- TypeScript及Vite正式構建（`VITE_ONLINE_PUBLIC=1`）通過；既有bundle大小提示維持。
- narrate hard-fail0、copy口語／禁句0。
- Chromium／WebKit各320×568、390×844、430×932六組人物路徑，另測最短屏空背包／長姓名。預覽、取消、篩選／排序、確認、防連點、兩套配搭、主要觸控／命中及返回均檢查，pageerror0。見 `report.json`。
- 十個真實畫面逐頁掃描及截圖，見 `frames-audit.json`。保留的兩條帳戶資料分隔線不是外框，其餘已套共用材質；另有收成、華山及祖祠截圖。
- 額外錄影檢查九件格、完整屬性、正負差額及換裝；真單抽只扣60，320短屏十連只扣600，完成按鈕可見。寶箱圖明確使用開發示範，不是向玩家派獎。
- 所有資料均為隔離測試存檔，封鎖Supabase及外部字體，未讀取或上傳玩家存檔。

## 視覺迭代

`first-picker.png`保留首輪顏色／字重及位置問題；`first-gacha-result.png`保留結果模組舊木軸規則覆蓋磨邊的中間狀態。最後修正及同圖對照見根目錄 `design-qa.md`。

演武資源需先載入；主頁示範採資源就緒後的 `after-home-ready.png`／`after-home-moving.png`，不把初始空畫布當完成畫面。未修改演武邏輯。

## 重跑與限制

生成既有人物fixtures、build並在5201提供預覽後，可執行：

```sh
PERSON_BASE=http://127.0.0.1:5201/ PERSON_OUT=production/qa/evidence/redesign/parchment-ui python3 scripts/qa/checkPersonScreen.py
PARCHMENT_BASE=http://127.0.0.1:5201/ python3 scripts/qa/checkParchmentFrames.py
# 寶箱示範另以 npx vite --host 127.0.0.1 --port 5203 啟動開發版
PARCHMENT_BASE=http://127.0.0.1:5201/ python3 scripts/qa/checkParchmentResults.py
```

WebKit執行檔可用 `MARTIAL_WEBKIT_EXECUTABLE`指定。原圖853×1844與實作780×1688（390×844、DPR2）正規化並排；比較板字體以環境已安裝Noto CJK代替缺少的文泉驛。原稿沒有可查證的字體檔，採經字形核對的OFL毛筆字款，不聲稱同一字體。

iPhone實機、VoiceOver、前後台及裝置幀率仍待驗收；這次是本機瀏覽器手機尺寸驗證，未當成TestFlight或雲端瀏覽器驗收。
