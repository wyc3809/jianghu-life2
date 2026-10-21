# 第32項二人雲端封測驗證

2026-10-21，玩家確認「上線」範圍為二人版本。Supabase現有專案 + 真Edge Function/Postgres；兩個獨立瀏覽器身份，唔用假回覆或前端決勝。

- `api-report.json`：三個真Auth身份，兩席綁定、滿房／非成員／偽JWT／直接讀表／篡改拒絕、同時重送只有一場、真實62秒離線待領、同時領獎一次入帳、配搭、雙方戰報及互換／失敗名次不變。
- `browser-report.json`：實際雲端 + 本機前端，390×844 DPR2；剪貼簿邀請、朋友加入、第三人拒絕、離線應戰、遺失已處理挑戰回覆後輪詢確認收據、卷六大河落日、重播及重新載入不改結果。320／390／420無橫向溢出，主要觸控至少44px，pageerror0。
- `comparison.jpg`、`landing.png`、`waiting.png`、`two-players.png`、`invitation.png`：公開房間入口與兩人狀態。
- `offline-opponent.png`、`volume-six.png`、`first-result.png`、`reload-same-result.png`：離線挑戰、真逐招、戰果與重開。
- `two-phones.mp4`、`replay.gif`：正常速度真操作與演出；GIF節錄20–31秒，唔加速核心。
- `game-before-after.jpg`、`game-jianghu.png`：同seed42、玉石free600／paidTest0嘅正常江湖頁前後對照，改前沿用EA0.80.0留底。
- `tests.txt`／`build.txt`／`narrate.txt`：95檔692測試、Pages build含tsc、narrate hard-fail0。
- `backend.json`：實際部署版本及RLS／權限核對，無API key、JWT或邀請。

歷史QA工具問題：第一輪Playwright `route.fetch` 直連網絡失敗，改用環境支援嘅urllib發送同一真指令後丟棄回應；第二輪遊戲流程全部通過，但對照板指定wqy字體未安裝，改用Noto並完整重跑成功。失敗trace可能含測試身份headers，原始log只留ignored本機且已遮罩／撤銷該測試session，唔提交。以上唔當產品錯誤，亦唔以未完成run充當最終通過。

未當iPhone真機、60fps、容量或正式MMO營運驗收。封測資料與原有單機／雲端存檔隔離，未做幫會戰、門派戰或舊角色遷移。
