# 20%武功／80%書頁驗收（2026-10-22）

玩家確認減少武功命中：非保底抽取20%武功、80%書頁。書頁每份5頁仍係測試參數，沿用200頁兌換一般江湖武功。每抽60玉石／十連600、有效心願40抽保底、六派小冊、兩池付款限制及武功裝備銜接保持原規則。呢版未上線，版本維持EA0.85.0。

## 截圖及錄影

- `comparison.png`：EA0.85.0卡池規則同工作版前後對照，紅框標新增機率、書頁與保底說明。
- `before.png`、`before-rules.png`：修改前；`after.png`、`draw-controls.png`、`rules.png`：修改後及捲到抽取操作區。
- `results-board.png`、`single-pages.png`、`mixed-ten.png`：書頁獨立疊紙圖、每份×5、十連2份武功與40頁；數量來自真正核心結果。
- `last-pages.png`、`pages-wallet.png`：上次結果與家族收藏餘額／200頁兌換入口；5頁未夠兌換，按鈕停用。
- `wish-jianghu.png`、`wish-zhenben.png`：第40抽一般／珍本心願身份及封面。呢兩張用減少動態模式核對結果，唔作高階完整動態驗收。
- `single-flow.mp4`：真實瀏覽器單抽、完整3D啟封、揭曉書頁、完成、查看上次結果同餘額。無跳過首個單抽；`single-reveal.gif`節錄14–22秒。
- `context-loss.png`、`fallback-pages.png`、`reduced-pages.png`：演出失敗、無WebGL與減少動態仍呈現同一份已入帳結果。
- `results-<width>-<height>.png`：320×568、390×720、390×844、420×896十連可選與操作檢查。

原始主截圖用Chromium、390×844、DPR2；固定seed42，免費玉石600、付費0；珍本情境另加付費測試額度600。所有測試用隔離瀏覽器本機QA存檔，攔截Supabase網絡，無修改真玩家或多人後端。實際核心探測固定抽序，唔手造獎勵或繞過核心派獎。對照板以Pillow加標題紅框，原圖另外保留。

## 邏輯及整合檢查

`npx vitest run`：97檔713項全過；`npm run build:pages`含TypeScript全過；`npm run audit:narrate` hard-fail0。原始輸出見`tests.txt`、`build.txt`、`audit.txt`。

新測試覆蓋固定20,000次非保底樣本、書頁直接入帳、兩池第40抽、十連等同十次單抽、舊存檔收藏／書頁往返、事件RNG不變及非法抽數零改動。結果映射覆蓋全書頁／混合心願、卷數、真稀有度、不查假武學及只讀原結果。

瀏覽器可重跑：`python scripts/qa/checkGachaFragments.py`；加`GACHA_RECORD=1`可重錄第一個完整單抽。`report.json`記錄實際通過情境。核心同步入帳後立即比對完整meta，連點、跳過、完成、再次查看、裝備導向及後備流程再比對；唔以畫面文字代替帳目檢查。

## 素材及限制

無新增外來素材。書頁沿用`public/ink/art/gacha/codex-page-right.webp`原創山水內頁，三層疊紙只係排版。原圖、生成提示、來源／授權及處理腳本沿用`design/art/gacha-codex/README.md`、`pages-source.png`、`scripts/art/prepare_gacha_codex.py`；映射見`src/fx/highlight/codexAppearance.ts`。文字全部用真文字，無SVG。

Linux軟件GPU下錄影會降低畫格率，唔代表實機效能量測；一般完整啟封已實播，今次無重做高階動畫，無宣稱用減少動態截圖驗證完整心願演出。抽卡主頁沿用既有共用人物資訊及導航，較短手機仍需捲到操作區；演出結果獨立捲動。
