# EA0.68.0 後：手機固定欄相容性修正（未上線）

玩家實機圖片顯示主內容仍在、固定任務與底部分頁消失。本次將兩者用body portal移出overflow捲動容器；主頁另用has-task類別保留內容視窗高度，固定任務位置保持喺底bar上。事件／交手、人物等分頁仍按原條件收起任務；演武首領全屏時外部固定欄隱藏，返回主頁後恢復。字體維持統一，唔改遊戲數值／存檔。

578個Vitest、build、audit:narrate hard-fail0。Chromium37項、WebKit37項檢查全部通過：320／390／420 × 690／844，viewport大小變化、捲動、四個分頁及五個捷徑點擊命中、任務展開、人物分頁往返，外加祖先transform＋contain:paint情境嘅可點擊及固定錨點。24項演武／首領回歸檢查亦通過，見spar-regression.json。

重要限制：普通桌面WebKit基線未完全重現玩家手機消失；基線兩個固定欄通常仍可見。比較圖係額外施加祖先transform／contain嘅裁切模擬：舊版固定欄錨點會跟內層容器移位，新版仍錨定視窗底部；不能將模擬當成已確認真實iPhone根因或實機驗收。

seed42、新手完成、免費玉石600。比較及after圖都係真實瀏覽器截圖，數字由持續對打略有變化。comparison.png清楚標明模擬；after-webkit-390-690.png係正常CSS嘅手機尺寸實際畫面。

重跑：node scripts/qa/captureFixedDockIos.mjs chromium after 5175；WebKit工具在此環境缺系統library，依賴解到獨立browser cache才能啟動。此處只跳過host依賴預檢，全部產品驗證仍執行並斷言；無實體iPhone測試。
