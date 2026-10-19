# 秘笈書封按真實稀有度分色

玩家要求：做唔同稀有度嘅書唔同色。現行兩類身份，江湖一般用青綠、珍本用古金；心願、首次獲得、重複唔新增永久稀有度。

- `comparison.jpg`：真實改前／改後三屏，左係EA0.77.0（1635b87）珍本待機青封，中係改後江湖青封，右係改後珍本金封。390×844、DPR2、seed42、免費600／付費0。改前開發StrictMode可能因既有forceContextLoss使用原本位圖後備；呢張係真實後備畫面，唔當改前3D性能比較。改後係真Three.js書冊。截圖時背景掛機修為同墨塵時間會自然不同，唔係玩法改動。
- `after-jianghu.png`／`after-zhenben.png`：完整新介面截圖；未改價格或機率，付費0嘅珍本池按鈕正常不可抽。
- `ordinary-result.png`／`premium-result.png`／`wish-ordinary-result.png`：單抽一般、珍本及一般心願結果。一般心願仍青綠，唔用grade5冒充珍本。
- `ten-mixed-result.png`／`fallback-ten-result.png`：同一次十連同時有一般青封及珍本金封；所選詳情縮圖跟住該張身份，唔跟整批最高高光。
- `ten-mixed.mp4`：真實十連正常速度畫面，含結果選取；本片無音訊，24fps係影片編碼，唔係裝置性能測量。
- `report.json`：5種真實抽取，逐張配色／結果等於核心，雙擊只結算一次，關閉後玉石／保底／收藏不再改動。
- `switch-report.json`：連續6次切池，WebGL context保留、GL錯誤0；刻意context loss之後珍本金封及切返江湖青封後備正確，未扣玉石，無pageerror／console error。

重跑：開主分支開發服5173；以1635b87獨立工作區開5174。跑 `python scripts/qa/checkGachaBookColors.py`、`python scripts/qa/checkGachaBookSwitch.py`。測試瀏覽器隔離所有外部HTTPS請求，唔接觸玩家真存檔或雲端。原始錄影保留喺忽略追蹤嘅 `raw-video/`。

歷史嘗試見 `history/`：初次只等canvas，但改前StrictMode觸發既有WebGL關閉後備而逾時；另外一次全測與軟件3D／build同跑，武學動畫核心隔離測試5431ms超過原有5000ms限制。冇刪、skip或改大timeout；停止並行負載後獨立重跑，最終結果以 `vitest.txt` 為準。

本次未升版本／未上線；唔代表iPhone真機、GPU峰值或60fps驗收。原始生成圖、提示、來源、素材映射及處理腳本見 `design/art/gacha-codex/README.md`。

最終驗證：647項Vitest／88檔全部通過、Pages build（含tsc）通過、narrate hard-fail0；5種真實抽卡配色、6次切池與context loss後備全部通過。構建只有既有chunk大小提示。
