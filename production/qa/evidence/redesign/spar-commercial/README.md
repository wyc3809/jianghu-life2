# 演武四季／步行／倒地驗收

本次係可操作本機預覽，未上線。基線取自main EA0.69.0，新改動喺`work/spar-art-ea070`；同iOS打包PR #115分開。

## 實際畫面

- `before-chromium/`：未改引擎、seed42，390×844、DPR2、600免費玉石，完成新手，按月份轉四季。
- `after-chromium/`、`after-webkit/`：同樣條件，新位圖真正喺Canvas播；320／390／420寬×690／844高共6種手機尺寸。季節截圖播放期間戰鬥自然推進，敵人／氣血唔一定相同，唔用嚟推斷平衡有改動。
- `motion/`：同一正式演武引擎嘅受控視覺fixture，固定畫面時間逐幀播步行／倒地，冇改攻擊力、气血或獎勵值。逐款實際載入25種敵人四幀，`validation.json`記錄素材及地面座標；呢段係動畫驗收，唔係平衡示範。
- `regression/`：真正戰鬥／UI流程，驗證首領沿用同一Canvas、結束只過一關、實際落敗後第25關重新挑戰、江湖首領直接自動戰、生死風險確認、固定任務／底欄及五捷徑可點。保留既有QA fixture嘅測試數值，唔入遊戲版本。

## 重跑

```bash
python scripts/art/prepare_spar_commercial.py
npm run dev -- --port 5175
node scripts/qa/captureSparCommercial.mjs after 5175
PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1 node scripts/qa/captureSparCommercial.mjs after 5175 webkit
node scripts/qa/captureSparMotion.mjs
QA_OUT=production/qa/evidence/redesign/spar-commercial/regression node scripts/qa/captureBossTaskRetry.mjs
npx vitest run
npm run build
npm run audit:narrate
```

WebKit環境用本機補裝動態庫；該環境變數只跳過Playwright主機依賴預檢，冇跳過遊戲檢查。實體iPhone未驗證。對照板用NotoSansCJK；臨時frames唔入git。

## 最終檢查結果

583項Vitest／79個測試檔、build、Pages base build、內容audit hard-fail0全部通過。Chromium11項、WebKit11項、戰鬥／UI回歸24項全部通過，頁面錯誤及失敗請求0；受控Canvas實際載入25款四幀倒地，地面錨點一致。Pages正式base下122個WebP全部HTTP200，詳見`validation-summary.json`／`pages-paths.json`。GIF係截幀預覽；倒地片段2倍慢播，原0.62秒結算時序不變。

正式base預覽：`npm run build:pages`後，用`VITE_BASE=/jianghu-life2/ npm run preview -- --port 5185`再跑`node scripts/qa/captureSparPages.mjs`。
