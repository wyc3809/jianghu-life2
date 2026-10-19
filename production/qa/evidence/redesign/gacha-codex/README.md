# 秘笈閣 · 線裝啟封原型

已接入真正遊戲江湖分頁，未升版本／未發布；正式版仍EA0.76.0。原型方向係淺色水墨線裝秘笈，供玩家睇圖及動態確認。

- [改前／改後](comparison.jpg)、[完整原型手機圖](after-page.png)、[互動媒體索引](index.html)。
- [珍本精選連原生音效](single-premium-preview.mp4)、[十連精選連原生音效](ten-mixed-preview.mp4)。
- 完整正常速度錄影：[單抽→人物頁](single-new.mp4)、[珍本](single-premium.mp4)、[一般武學心願](wish.mp4)、[混合十連](ten-mixed.mp4)、[十連全重複](ten-duplicates.mp4)、[跳過](skip.mp4)、[無WebGL](no-webgl.mp4)、[減少動態](reduced.mp4)。

## 真實改動

封面、書脊、穿線、厚紙邊、書籤及八張可翻紙頁共用同一3D模型。生成絲織山水封面加兩頁山水內頁，保留原畫、提示與只裁切／縮放／轉WebP嘅腳本。一般一次展頁，珍本先半展再逐頁開，心願另有朱砂回響；稀有度同心願／新得／重複身份分開，唔把一般心願叫珍本或神兵。

頁面收起大幅問號掛軸，六派由現時流派入口開一層選擇；小冊、本冊名單、心願保底、單抽／十連成本、家族收藏及上次結果保留。390×844主要抽卡操作同屏；320×568短屏容許內容捲動。收藏、名單及詳情用自己的內容區，不刪功能塞一屏。

「馬上裝備」只去人物武學頁，選欄位後先習得／裝備。五外功＋獨立內功／身法、六派／小冊、價格、概率、保底、卷、書頁、舊檔及核心RNG不改。雙擊同步鎖，跳過／關閉／GPU故障都只呈現同一筆已入帳結果。無WebGL、lazy失敗或context lost改用可選取／裝備嘅DOM結果。

## 已完成檢查

- 647項Vitest／88檔通過，Pages build（含TypeScript）通過，narrate hard-fail0。原有chunk大小提示仍在，冇當作已消除。
- `browser-report.json`：8個真正入口情境，逐筆結果、玉石、保底及收藏同純核心計算完全相同；每次同事件迴圈連點兩次，仍只結算一次，關閉後資料不再變。
- `layout-report.json`：Chromium／WebKit × 320×568、390×844、420×896共6組；六派、心願、名單、按鈕真正可點、十連後備、缺封面／字體及餘額不足通過。WebKit用官方瀏覽器包及工作區Debian依賴，唔冒稱Safari／iPhone真機。
- `performance-recovery.json`：聚焦靜音掣時Escape可跳過／完成；本機讀檔同入帳資料一致；真正context-lost事件切DOM後備且資料不變，pageerror0。
- `asset-paths.json`：三張新WebP經dev及正式Pages子路徑共6次status、MIME、bytes、SHA256核對，全部一致。
- `pages-build-smoke.json`：真正Pages構建從開卷、立卷、江湖、單抽到結果；600免費玉石只扣60，完成後root可見及inert復原，無pageerror或失敗HTTP。
- 改前係`da52e1f`獨立工作區；兩邊seed42、390×844／DPR2、免費600／付費0。掛機修為隨兩次拍攝時間少量累積，唔係本次改動。

## 效能及聲音嘅實際範圍

Linux Chromium／SwiftShader、DPR2獨立179個RAF樣本：待機p95約16.8ms、結果十連p95約33.3ms，結果最長單幀約216.7ms，未達全情境穩定60fps。JS heap約34／42MB係當時JS heap，唔係GPU峰值。新圖片解碼RGBA尺寸只係素材預算，唔代替裝置記憶體量測。iPhone真機、長時間熱穩定及硬件音訊延遲未測。

原型書冊用單次實體渲染，3D／粒子DPR上限1.5；結果落位後停止3D、次要循環及粒子重畫，演出期間隱藏／inert背後遊戲，離場完整復原。正常DOM文字仍用裝置DPR。以上屬原型視覺參數，唔係永久GDD定案。歷史同步轉碼負載樣本保留於`history/`，唔計最終通過。

8段新錄影捕獲遊戲實際Web Audio輸出，再按page建立／AudioContext開始時鐘合成；冇用另配假音效。影片固定24fps係交付編碼，唔係實測裝置fps；精選只剪掉載入與尾段等待，正常速度，完整片保留。尚未有人手真機音畫主觀驗收。

寶箱基準實際播放grade1及grade5完整流程，`chest-*-complete.json`均到settle；[完整基準片](chest-baseline-lowres.mp4)係Linux為可播放採DPR0.75，冇音軌，唔同新原型手機截圖混作畫質／效能同條件比較。原型只以其結構、重量、節奏及揭曉作品質參照。

## 重跑

`python scripts/art/prepare_gacha_codex.py`；Vite5173，基線獨立工作區Vite5174；`checkGachaCodex.py`、`checkGachaCodexLayout.py`、`profileGachaCodex.py`、`captureGachaCodexComparison.py`喺`scripts/qa/`。需要Playwright、系統Chromium、ffmpeg及Pillow。WebKit依賴／平台路徑按執行環境配置。原始錄影及音軌留工作區`raw-video/`，避免重複提交；正式MP4及報告已交付。

早期缺ffmpeg、WebKit依賴、錄影選擇器錯誤、熱更新中斷及紙頁素材修正記錄保留於`history/attempts.md`；未計作最終通過。
