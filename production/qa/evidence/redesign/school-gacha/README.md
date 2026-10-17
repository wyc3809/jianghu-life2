# 六流派定向小冊／全武學分類驗證

玩家揀 A，再要求將現有武學分流派。已實作，未升版本／未上線；正式版維持 EA0.73.0。工作分支保留第27項固定主頁同第28項即學即裝。

- `comparison.jpg`：真實改前／改後紅框對比，seed42、390×844、DPR2。改前由 commit a210e2f 獨立工作區渲染；改後展開連環第三冊名單。兩邊係各自同頁嘅實際畫面，唔係拼貼元件。
- `chromium-jianghu-pool.png`／`webkit-jianghu-pool.png`：免費流派小冊預覽。
- `chromium-zhenben-pool.png`／`webkit-zhenben-pool.png`：珍本小冊、配套同心願。
- `chromium-collection.png`／`chromium-person.png`，以及 WebKit 同名檔：家族收藏／人物武學分類。
- `catalog.json` 同 [武學流派對照](../../../../武學流派對照.md)：由真正分類及卡池資料匯出，103門（84江湖＋19珍本）、21冊。舊資料94筆包含10個舊名，唔係94門獨立免費武學。
- `browser-qa.json`：307項檢查全部通過；Chromium／WebKit，320×690、390×844、420×844，DPR2。涵蓋六派／兩種玉石入口、小冊名單、心願範圍、切池保底、舊心願路由、39/40實抽心願、抽取來源、收藏／人物篩選同固定外框。
- `equip-regression/browser-qa.json`：61項檢查全部通過；Chromium／WebKit，320／390×690，DPR2。實際WebGL揭曉十連、原地學習／裝備三類主修、保留舊武學與卷、玉石扣款、觸控及IndexedDB存檔讀回。

主測試用減少動態及無WebGL後備路徑（只關閉WebGL context，2D保留）；另外即裝回歸用真正WebGL揭曉。正常動態WebKit第一次測試曾關閉瀏覽器程序，冇將嗰次當通過或當實機性能驗收。以上係桌面瀏覽器手機尺寸模擬，唔代表真iPhone／TestFlight已驗收；未新增動畫，無新增動圖。

固定角色黃青雲、seed42；分類檢查用完整103門收藏同每派一門已學武學。免費舊心願長河拳12/40，珍本舊心願觀潮步39/40。支援用最少資源fixture重跑，唔寫入正式帳戶。

重跑（先開Vite 5177；改前獨立工作區5178）：

```bash
npx vitest run
npm run build:pages
npm run audit:narrate
npx vite-node scripts/qa/exportSchoolGacha.mts
PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1 node scripts/qa/captureSchoolGacha.mjs
QA_EVIDENCE_DIR=production/qa/evidence/redesign/school-gacha/equip-regression PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1 node scripts/qa/captureGachaQuickEquip.mjs
node scripts/qa/captureSchoolGachaBefore.mjs
python scripts/qa/packageSchoolGacha.py
```

新邏輯測試覆蓋全部103門唯一主派、10個舊名、每冊6–8及全武學可取得、每冊100次實抽範圍／確定性／扣款、換池保底、舊存檔來回及失敗操作唔亂改資料。615項Vitest全部通過、Pages build通過、narrate hard-fail 0。

每抽60玉石、40抽心願保底同原本分支機率設定保留；縮窄名單會提高個別武學抽中機會，唔宣稱每門出貨率不變。6–8門係測試參數。兩門以前冇流派嘅天刀開山／羅漢拳補上主派後會計入既有流派配搭；加成數值同演武台不變。
