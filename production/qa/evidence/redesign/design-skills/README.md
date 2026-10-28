# 第52項 · 雙技能 UI／UX 整理

2026-10-28。以EA0.96.1作前圖；EA0.97.0精修秘笈閣／家藏與共用冊頁。診斷及來源見 `design/ux/design-skills-audit.md`。本輪不是全遊戲介面重做，亦不發布第46／47項未採用原型。

## 可直接檢視

- `before-after.jpg`：同一11門真藏本、1,000書頁的390×844 DPR2前後圖，紅框標示原先佔首屏的說明／選單，以及新入口與藏本。
- `collection-demo.gif`：真瀏覽器點按家藏、詳情、預覽及確認，從完整錄影截取；14fps為GIF取樣，不是裝置幀率。
- `before-*.png`：八個原介面畫面，先截圖再診斷。
- `after-draw-{320,390,430}.png`：小冊改為點選、心願／成本／抽取保留。
- `after-collection-{320,390,430}.png`：家藏與獨立兌換／說明入口，只有藏本內容區捲動。
- `after-manual.png`：真七卷／熟練／升階及舊本轉頁。
- `after-exchange-preview.png`、`after-exchange-receipt.png`：指定卷七，確認前不扣頁、確認後真入藏。
- `after-paid-shortage.png`、`after-pages-shortage.png`、`after-large-wallet.png`、`after-empty.png`：不足、長數字及空狀態。

原始影片及早期中斷／修正迭代放忽略的 `.local-online/design-skills/` 與 `.local-online/tap-navigation/video/`，不隨App打包。執行環境重新啟動過；早期未提供WebKit所需動態庫，以及開發環境HMR重載造成的中斷，不當作通過。正式驗證使用固定Pages構建及既有WebKit啟動設定。

## 驗證與限制

- `ui-report.json`：Chromium及WebKit，各320×568、390×844、430×932，DPR2。真點小冊／流派、珍本池付費額度不足、真身份書封、七卷、預覽／取消、連點只扣一次200頁、不自動學習／換裝、標題／出口／確認可見及返回。
- `state-report.json`：空家藏、免費9,999,999／付費1,234,567及書頁9,999,999、玉石59／書頁199不足，以及真學習／100頁升階／舊本轉20頁／200兩換10頁。
- `person-report.json`：共用標題／收起鍵改為安全分欄後，人物換裝六組回歸；真比較、確認、雙配搭獨立、返回及空／長名稱。
- `ui-final-390.json`：最後補正朱砂選中框後，再以正式390構建完整重播；不取代原六組報告。
- `focus-report.json`：最終構建的選中卷次仍有獨立鍵盤焦點框，收起後可繼續操作。
- `gacha-link.log`：真十連、結果導向欄位、比較確認，不再扣玉石／書頁。
- `test.log`、`build.log`、`narrate.log`、`copy.log`：正式發布檢查。

使用隔離瀏覽器存檔及真資料目錄，封鎖雲端與外部字體；不登入或改動玩家帳戶。人物修為等背景計時可前進；經濟／學習／卷次等斷言針對真正相關欄位。WebKit為Linux測試引擎，不等於真iPhone、VoiceOver或TestFlight驗收。沒有宣稱幀率提高。

## 重現

先按既有腳本建立 `.local-online/character-redesign/fixtures.json`，再 `npx vite-node scripts/qa/makeMartialScreenFixtures.mts`。完整fixture仍取真catalog ID、真卷次及真武學身份。

```
VITE_ONLINE_PUBLIC=1 npm run build:pages
DESIGN_UX_BASE=http://127.0.0.1:5213/jianghu-life2/ MARTIAL_WEBKIT_EXECUTABLE=<已配置的WebKit啟動程式> python scripts/qa/checkDesignSkillsUx.py
DESIGN_UX_BASE=http://127.0.0.1:5213/jianghu-life2/ python scripts/qa/checkDesignSkillsStates.py
PERSON_BASE=http://127.0.0.1:5213/jianghu-life2/ PERSON_OUT=.local-online/design-skills/person-regression MARTIAL_WEBKIT_EXECUTABLE=<已配置的WebKit啟動程式> python scripts/qa/checkPersonScreen.py
python scripts/qa/buildDesignSkillsEvidence.py
```

5213靜態站點的`jianghu-life2`目錄指向dist；正式測試不使用會被HMR更新的開發頁。原圖均DPR2，對照板使用Noto CJK後備字體，因執行環境沒有AGENTS所列的WQY字體。發布後以實際入口版本及隔離線上操作另行核對；TestFlight須在Codemagic從main建置及上傳。
