# EA0.98.1：每步引導只自動展示一次

2026-10-30；redesign-scope第56項，玩家要求引導只出現一次。首次實際展示就保存已讀，當次仍可閱讀到離場；再次進入或重開不重複顯示及標記入口。換裝完成在人物／鎮居共用一次記錄，舊鎮居提示亦各只一次。只有設定的「顯示目前提示」能主動重看，不清進度或重派獎勵。

- `before-after.jpg`：390×844、DPR2，相同試煉後隔離存檔，首次進入人物後返回鎮居，再次進入。之前為線上EA0.98.0；之後為正式構建EA0.98.1。已檢視提示及朱砂入口框消失，而真裝備、人物及原功能保留。
- `before-reenter.png`／`after-reenter.png`：原始截圖。
- `first-ready.png`：真比較確認換裝後首次顯示攻擊4→10；這是兵器值。
- `report.json`：正式Pages構建，Chromium／WebKit ×320×568、390×844共4完整流程；另兩引擎各驗試煉重開及舊鎮居提示，共8情境。首次可讀、重入不重複／不標記、比較窗首次才提示、取消不換裝、確認仍生效、完成跨頁共用一次、重開不重複、略過保存及設定主動重看均通過。任務、玉石、書頁、對戰配搭與領獎收據保持，無pageerror。
- `tests.log`：114檔895項全過，新增3項驗立即保存／只寫一次、JSON往返、不同步驟隔離、手動重看只清提示及略過守門。
- `build.log`／`narrate.log`／`copy.log`：TypeScript及正式Pages構建、敘事hard-fail 0、口語／禁句0。

重建：`scripts/qa/checkGuideOnce.py`，隔離既有真試煉fixture；ONCE_BASE可指定正式／線上根路徑。舊`checkAppMotionGuide.py`亦更新重開期望，保留原比較／跳過／獎勵驗證。沒有改新手獎勵、經濟、戰鬥、schema或動畫，不需要新增動效GIF。沒有登入、改動真帳戶或操作雲端資料；Linux WebKit不等於真iPhone驗收。本次網頁發布，已簽署TestFlight仍需Codemagic新建main。
