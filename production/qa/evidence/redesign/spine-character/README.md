# Spine 單角色三動作審閱

> 玩家其後以「個頭都係甩咗」否決此v01。以下保留原始證據，不能當人體或動作通過；頭頸連續蒙皮修正見`../spine-neck-v02/README.md`。

2026-11-03；基於EA0.100.0及PR #157。玩家否決舊受控骨架原型後，指定改用Spine Animation AI，並確認持有該skill商用授權及Spine編輯器授權。玩家已接受本輪完整人物母版，三段動作仍待評閱。

## 可操作入口及證據

- 開發版／`VITE_CHARACTER_RIG_LAB=1`內測構建：`?spine-lab=1`或設定→角色動畫驗收。
- 獨立操作副本：[review.html](../../../../../design/art/spine-character/runtime/review.html)。同一資料與官方Runtime，完全內嵌，不依賴CDN；不是新TestFlight。
- `operation.webm`：實際App內測構建完整操作記錄。`motion.webm`／`motion.mp4`為同頁定時按鈕連續播放錄影，`motion-preview.gif`為該錄影擷取人物區域，不是生圖動畫或逐幀合成。觸發方式及有效context屬性見`motion-recording.json`。
- `app-idle.png`、`app-attack.png`、`app-hurt.png`、`app-debug.png`：390×844、DPR2實際App。
- `before-after.png`：舊原型與新Spine審閱頁；相同手機尺寸，鏡頭及角色展示高度不同，不當作等比例數值量測。
- `joints.png`：上述三個姿勢的頭頸肩肘近鏡，只裁切實際截圖。
- `browser-report.json`、`build-gates.json`、`performance.json`與原始量測：結果及範圍。
- `checks.txt`：完整測試／構建／文案檢查及曾發生的重跑原因。

## 真正使用的資料

完整母版、分件原圖、生成提示與安裝／授權確認記錄：`design/art/spine-character/PROJECT.md`。採用指定skill固定來源`702b71689cac826efee942ee4564fef9560d6ef8`，實際使用其SIFT定位、骨架資料生成、圖集及播放器產生腳本。SIFT七件配對後仍人工核對頸肩與腰線，不把分數當成人體通過。

18個骨節、七個真加權網格；頭頸單一圖件、前後手腳獨立來源。真正的骨架與蒙皮由官方Spine 4.2.120 Runtime求解，Vitest亦載入同一Runtime測試，沒有另寫一套假求解器去自證。

原始RGBA／裁切座標、人工對位`layout.json`、親子骨點／每頂點權重／關鍵幀`authoring.json`、匯入用`runtime/character.json`及圖集均保留。JSON的圖片路徑指向同目錄樹的`../parts/`，沒有假裝已交原生`.spine`檔。

## 本輪攔截及修正

1. 官方Player在success回調後自動播放；若只在回調pause會出現兩個時間更新者。審閱頁每幀先pause內建更新，只由1/60固定步更新AnimationState與骨架。最多四步，超大dt丟棄。暫停與逐幀以真track時間及骨架快照檢查。
2. 初版肩部跨胸權重在出拳時造成可見網格翻面。肩袖改跟真上臂骨、肘腕仍用連續網格權重，沒有降低出拳幅度或放寬翻面門檻。三段120Hz取樣檢查全部三角形，包含透明區。
3. 不透明來源WebGL iframe在Chromium錄影／截圖後失去點擊；最小純按鈕iframe未出現、同源Spine iframe恢復，故App採用本地固定同源內容。按鈕操作仍須實測，不能拿程式handler存在當作可以點。此frame不得改為任意外部HTML；存檔保護來自不接資料API及真操作檢查，不把sandbox當安全保證。
4. 中文狀態只在內容改變時寫入DOM；UI採現有宣紙位圖框、朱砂選取及同一毛筆字子集。內建Runtime控制器關閉；畫面不使用SVG。

## 驗收邊界

- 所有戰鬥模式、數值、耗內／回內、經濟、裝備、存檔及實際結果保持原實作；本頁只播放動作，不能推斷一對一已接入。
- 本輪只覆蓋一頭、一衣及三個原地動作；沒有走跑、倒地起身、持武、換裝、多人或自由剛體布娃娃。不能將母版被接受擴張為動畫／全角色被接受。
- 審閱按鈕由各段起點重播；實戰連續混合／中斷、控制及低內力銜接尚未接入。Runtime反覆中斷數值測試不代表這些App流程完成。
- 尚未在原生Spine Editor儲存、重開、匯出；授權確認不等於已執行這些驗收。
- Linux Chromium／WebKit不是Safari真機；visibility事件模擬不是iOS系統前後台。
- 瀏覽器量測仍有慢幀，未通過效能驗收。名義等待最少30秒，包含操作往返的實際區段由raw幀間隔加總，記於`durationSeconds`。不能證明長跑記憶體、耗電、溫度或穩定60fps。幀間隔包括OS及軟件繪圖影響；固定步callback CPU不包括全部GPU繪製。各次量測、撤回試驗及限制見`performance-experiment-notes.txt`。
- 內測審閱模組含完整內嵌資料／後備，約4.7MB未壓縮；普通構建不輸出該模組。正式角色資產載入、快取及真機表現仍須獨立驗收。
- PR保持草稿，未合併、未部署、未上傳新TestFlight；多人及PR #156繼續暫停。
