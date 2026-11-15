# 暫停天賦家傳 · EA0.116.0

2026-11-15，玩家明確要求所有相關機制暫時收走。盤點：design/audits/legacy-paused-ea0116.md；範圍第80項。

- 全套151檔1,083項Vitest通過；新7項測試覆蓋正式store指令、結算、舊檔pending、月收益、新人生、直接事件選項及資料保留。
- Pages構建（含TypeScript）、敘事hard-fail0、玩家文案禁句0、git diff --check通過。
- `scripts/qa/checkLegacyPaused.py`：Chromium 390×844／320×568／430×932，檢查人物更多／境界／人際／舊人生總結。以EA0.115.0正式站擷取修改前，本機最終構建擷取修改後；全部Supabase請求明確攔截503，無新增帳戶或後端寫入。
- 原點數37、天賦根骨2、選取家傳武學及解鎖資料留存；現有attributes／equipment／appearance／skills無變。舊summaryText留檔，但實際畫面用當前規則產生，不再展示繼承承諾。
- 修改前後見compare-menu.jpg、compare-people.jpg、compare-summary.jpg；三尺寸境界見cultivation-*.jpg；navigation.gif為正常操作錄影截段，非新增動畫宣傳。
- 追加原首頁同遊／幫會／門派／地圖返回及創角離線回歸，確認本輪沒有恢復祖祠入口。

暫停不等於刪舊投資；現有人物混合成長不能可靠逆推，未倒扣歷史數值。正常秘笈／玉石／婚姻子女／多人系統保持。CI、iOS未簽署Archive與Pages正式版本在PR／部署記錄另核；本輪沒有Apple簽署上傳、真iPhone或容量驗收。
