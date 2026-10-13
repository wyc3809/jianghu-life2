# EA0.69.0 正式版驗證

玩家批准發布固定欄修正及取消人際「相識的人」；PR #114合併至main dc0f0e16c19b34fb81c162c387c231b1d4cf3932。

578個測試／78檔案、build、audit:narrate hard-fail0、PR及main CI全部通過；GitHub Pages打包部署及pages-build-deployment成功。

正式網址 https://wyc3809.github.io/jianghu-life2/，390×844、DPR2：開卷按鈕正常，無頁面錯誤。index-DRvn0y7b.js HTTP200、包含EA0.69.0、ink-bottom-dock固定欄修正及新人際入口文案，已無鎮中故人列表標題。開卷頁無版本文字，versionVisible false屬預期。

固定欄Chromium37項／WebKit37項、演武24項回歸、人際8項檢查通過；分別見../fixed-dock-ios/、../family-only/。人際頁伴侶、子女、嗣子及傳承保留，舊NPC資料未清空。

限制：固定欄根因屬相容性推斷與裁切模擬，未完全重現玩家真實iPhone消失情境，不能將桌面WebKit等同實機驗收。平衡建議未套用；聯機幫會／門派方向已記錄，今次未新增聯機功能。
