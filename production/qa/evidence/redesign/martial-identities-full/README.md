# 全103門武學動畫 · 全量接入驗收

玩家已確認首批15門方向，今次完成餘下88門並加強19門珍本。未升版本、未部署；全目錄成品供玩家睇動態，唔當商業最終驗收或iPhone實機認證。

- [新增武學精選：24秒](new-arts-reel.mp4)；[全103門合集：206秒](all-103-reel.mp4)
- [珍本效果GIF](premium-preview.gif)；[掌法隱名墨色對照](palm-blind.gif)
- [實際改前／改後紅框](comparison.jpg)；[逐門正常／四倍慢播／隱名索引](index.html)
- [完整裝備劍→拳→掌→腿→劍](art_river_fist-rotation.mp4)

## 範圍與稀有度

103個canonical身份：66門外功、23門內功、14門身法；10個舊名映射唔重複計。一般84門每門8格；珍本外功11門每門主招8＋真暴擊收勢8＋真擊倒收勢8；珍本內功／身法8門每門16格。合共133圖集、1,064格。

141張獨立識別效果，一般每門1張、珍本每門3張。珍本主效果1.6個身高、真暴擊回響2個身高、擊倒收尾最多2.2個身高，仍保留人物與場景；常態3層、真暴擊5層、真暴擊兼擊倒最多7層。內功／身法只喺自身用主效果與細節，唔播放攻擊型終結效果；第三張收尾素材保存，冇借佢添加攻擊／護盾／回血。

每個新存活圖層保留自己來源，換招唔串圖；上限40層，到期／離場釋放。抽卡、裝備、五門外功＋獨立內功／身法、核心結算、勝負、傷害、敵方行動、RNG、存檔同經濟均不改。

## 動態證據嘅意思

`catalog-browser.json`有全部103門，固定seed42、390×844、DPR2；每門都有正常MP4、780×1688實際截圖，以及隱去文字、關閉特效、統一墨色嘅身體檢視MP4。

- 66門外功：真正SparDuel戰報，使用產品InkAutoBattle／SparStage，控制時計錄影，唔新增攻擊或派獎。
- 37門內功／身法：同一產品呈現器純運氣／步法檢視，唔假裝係外功攻擊；頂部血條及外功欄屬獨立戰報外框。正式受擊／落空觸發另有37門一次性回應測試，以及真遊戲入口覆核。
- `*-slow.mp4`係正常錄影四倍慢放，冇生成補幀；`blind-*.mp4`係產品呈現器姿勢檢視，無攻擊結算。盲辨先將主角置左，避免敵人遮住手形；唔當額外遊戲位移。
- `rare-outcomes.json`共22段：11門珍本外功各有真暴擊、真擊倒。先取得真核心結果，凍結時計，再慢速檢視專屬收勢；實際drawImage來源亦核對為相應crit／kill圖集。
- `weapon-rotation-report.json`記錄完整五段次序，唔只錄開頭。

全103門嘅動態與素材已有覆蓋；辨識度嘅最終判斷仍由玩家睇隱名對照，唔以「檔名不同／映射存在」當作已獲人手商業驗收。

## 檢查

- 645項Vitest、88檔，全過；涵蓋66門外功逐幀結算／敵人行動一致（包含真正啟用新特效層）、103門正常及減少動態持武、11門珍本收勢、37門輔助一次性回應、舊名、傷害、核心RNG隔離、特效上限／到期／換招來源。
- Pages子路徑build通過，narrate hard-fail 0；CI以PR最新HEAD結果為準。
- `raster-audit.json`：133圖集／1,064格逐張解碼、邊界及八格不重複檢查，141張效果hash亦不重複。12張contact-board係逐格人工覆核板。
- `fallback-matrix.json`：Chromium／WebKit共38組，19類持武分配320／390／420寬、844高、DPR2、減少動態、武學網絡素材全404；核對真正解碼嘅內嵌圖片bytes對應正確類型，全部通過，無橫向溢出。
- `product-entry-report.json`：主頁演武、演武首領、江湖一般及首領四個真入口，使用五門新外功加兩門新輔助及實際裝備劍；通過。江湖兩入口另測加速切換、跳過，以及離場圖集／特效引用清理。
- `static-paths.json`：423張WebP分別經開發服及正式Pages子路徑共846次HTTP讀取，status／image MIME／bytes／SHA256均核對。
- `media-manifest.json`保存469個實際媒體嘅hash、尺寸或ffprobe時間／幀數，唔以錄影耗時冒充裝置fps。

## 效能及限制

`performance.json`提供Linux無頭Chromium實際RAF紀錄（每情境180幀）、載入、JS heap及當前新武學圖片RGBA尺寸估算。包含一般弓法、珍本血蓮，以及五門珍本＋兩門珍本輔助。RGBA以Image物件尺寸加總，可能包括同URL共用內容，亦不包括場景／瀏覽器／GPU複本，唔係峰值記憶體。

單獨運行三個情境p95均約16.8ms；另保留`performance-under-validation-load.json`，同步跑完整測試／build時p95約33.4／33.4／50ms，唔將兩種負載混為同一結論。極端七門珍本約113MiB新武學圖片估算，唔當手機記憶體合格證明。手機60fps、iPhone真機GPU峰值及長時間溫度仍未實測。肢體採有限關鍵格，部分握點、銜接同專業音效仍有精修空間；影片無音訊，唔聲稱主觀聲音已驗收。原有停格／慢鏡時計耦合沿用，冇以數值補償；新圖層唔新增停格或慢鏡。

中途發現缺格、錯兵器、黏雙人物、畫面步進跳接觸格，均退回修正後再錄。另有開發服舊快取回傳HTML而非少數新圖片，重啟後逐檔HTTP比對同重錄相關武學。中斷、舊接觸版、舊珍本濃度及失敗錄製報告保留為歷史，唔計入最終通過數。`catalog-browser.json`、`rare-outcomes.json`、各matrix同本目錄最終檢查先係本次結果。

## 重跑

先重建首批素材，再`python scripts/art/prepare_martial_expansion.py`；所有出圖提示、原圖、補製及人工分格喺`design/art/martial-identities/`。開Vite 5188，使用平台Playwright與`/usr/bin/chromium`；WebKit需正常libGLES執行環境。

`recordMartialFullCatalog.mjs`錄全量（可`QA_ARTS=id1,id2`或`QA_RESUME=1`）；`recordMartialFullRareOutcomes.mjs`錄真結果；`recordMartialFullWeaponRotation.mjs`錄完整輪替；`checkMartialFullFallbacks.mjs`及`checkMartialFullProductEntries.mjs`核對後備及真入口。`auditMartialRasters.py`、`verifyMartialStatic.mjs`、`profileMartialFull.mjs`、`packageMartialFull.py`各自產生對應報告。錄製期間避免修改runtime造成HMR中斷。
