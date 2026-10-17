# 六派命名及手機排版證據

玩家確認六派原創命名，並指定最後一派只叫「逍遙遊」。已接入UI，未上線，正式版仍EA0.73.0。

- `comparison.jpg`：390×844、DPR2、seed42真實改前／改後紅框。改前係18420e1嘅截圖，直接引用上一項 `school-gacha/chromium-jianghu-連環.png`；改後係本次實際渲染長河疊浪第三冊。只加標題及紅框，唔拼貼畫面元件。
- `six-schools-crop.jpg`：真正選派區放大，從本次 `chromium-jianghu-pool.png` 裁出，完整六個新名及細字定位。
- `chromium-jianghu-長河疊浪.png`／`chromium-zhenben-逍遙遊.png` 同 WebKit 對應檔：兩種卡池；`*-pool.png` 係實際面板截圖。
- `*-collection.png`／`*-person.png`：家族收藏及人物流派篩選，另有相同fixture嘅改前截圖。
- `*-main-arts.png`：多適性壓力fixture，忘根訣五種適性長名、主修、流派小成／大成及加成排版，唔用省略號隱藏流派。
- `browser-qa.json`：343項全過，無pageerror。Chromium／WebKit，320×690、390×844、420×844，DPR2；完整六名、細字、觸控尺寸、三頁選派、所有卡冊範圍、舊心願／39/40保底、玉石分開扣、真實即裝、分類及固定外框檢查。
- `equip-regression/`：真正WebGL十連揭曉內即裝及領取後即裝回歸，Chromium／WebKit，320／390×690，DPR2，61項全過、無pageerror。保留舊武學／卷、不額外扣款、主修及IndexedDB讀回。
- `catalog.json`：103門分類與21冊。分類及卡冊同18420e1相同，內部ID不變；可同上次JSON直接比較。

主矩陣用減少動態及無WebGL後備（只關閉WebGL context，2D保留），另外跑真正WebGL揭曉；唔當iPhone實機或正常動態性能已驗收。今次只改文字、定位及排版，無新增動畫或遊戲美術，未升版本／未部署網頁或TestFlight。

固定fixture沿用黃青雲、seed42、完整103門收藏，每派一門已學武學。多適性fixture另外設吸脈指、忘根訣、凌虛步作三主修，檢查原有標籤同協同，唔寫正式帳戶。

615項Vitest（85檔）全部過、Pages build過、narrate hard-fail0；合共404項瀏覽器檢查。

重跑（Vite 127.0.0.1:5177）：

```bash
npx vitest run
npm run build:pages
npm run audit:narrate
QA_EVIDENCE_DIR=production/qa/evidence/redesign/school-names npx vite-node scripts/qa/exportSchoolGacha.mts
QA_EVIDENCE_DIR=production/qa/evidence/redesign/school-names PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1 node scripts/qa/captureSchoolGacha.mjs
QA_EVIDENCE_DIR=production/qa/evidence/redesign/school-names/equip-regression PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1 node scripts/qa/captureGachaQuickEquip.mjs
python scripts/qa/packageSchoolNames.py
```

命名及武學神髓：[已確認方案](../../../../流派神髓與命名提案.md)。完整分類：[103門對照](../../../../武學流派對照.md)。
