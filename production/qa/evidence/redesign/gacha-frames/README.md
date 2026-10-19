# 秘笈閣框及按鈕跟返第28項標準

範圍：秘笈閣全流程，連彈窗及真實抽卡結果。保留PR #125書封分色，未擴展全遊戲頁面，未上線。

沿用EA0.74.0第28項素材 `public/ink/art/wuxia-frames/frame-{neutral,selected,rare,panel}.webp`：平常淡墨、選中朱砂、珍本淡金、大區塊冊頁；主操作用既有 `brush-btn-cinnabar.webp`。原圖、生成提示、來源及處理腳本仍喺 `design/art/wuxia-frames/README.md`、`scripts/art/prepare_wuxia_frames.py`，本批冇新造素材、冇SVG。

- `comparison.jpg`：acf0ef4獨立工作區改前／改後真實對照，390×844、DPR2、seed42、免費600／付費0；紅框指出選池／入口同心願／抽取區。
- `before/after-page.png`、`before/after-school.png`：整頁及選派彈窗，兩邊相同情境。主頁掛機修為／墨塵可能因截圖時刻自然不同。
- `320/390/420-page.png`、對應 `*-fallback.png`：三個手機尺寸嘅入口同十連後備。
- `rare-catalog.png`：珍本名單真實淡金框，普通武學仍淡墨。
- `ten-mixed-result.png`／`ten-mixed.mp4`：真正WebGL十連、一般／珍本選取及入藏流程。影片正常速度、無音訊，20fps係交付編碼，唔當裝置fps。
- `report.json`：三種尺寸檢查實際位圖來源、六派44px觸控及命中、心願、名單、收藏、上次結果、十連切卡及核心入帳一致；真正3D檢查跳過、選取、靜音、裝備及完成觸控。

重跑：主工作區開5173；acf0ef4工作區開5174。`python scripts/qa/checkGachaFrames.py`。隔離瀏覽器存檔，阻擋外部HTTPS，唔寫玩家雲端。三尺寸測試用無WebGL／減少動態，另有正常WebGL十連，唔當iPhone實機／效能驗收。

歷史修正保留喺 `history/`：初次窄屏池規寬42.66px，已補至少44px；珍本名單被中性框CSS優先次序覆蓋，已修正。失敗嘗試唔計通過。

最終驗證：647項Vitest／88檔、Pages build（含tsc）、narrate hard-fail0全部通過。三種尺寸及真正WebGL十連回歸通過；最後另跑 `FRAME_QA_GL_ONLY=1 python scripts/qa/checkGachaFrames.py`，確認選中只留朱砂冊頁框，唔疊舊黑色outline。構建只有既有chunk大小提示。
