# 第50項 · 點按水墨驗收

本輪接喺第49項本機宣紙框版本之上，版本維持EA0.94.0，未發布。改前參考為9598e72獨立worktree；不是網上舊截圖。只改水墨回饋及按壓時的材質，不改玩法、獎勵、資料與存檔。

## 查看

- `before-after.jpg`：同一固定存檔，390×844、DPR2，實際按住前後及換裝窗；紅框為QA註記。演武台照常運作，戰鬥／掛機數字隨截圖時間不同，不以假數值凍結。
- `before-press.png`／`after-press.png`：按住時的實黑圓移除，器物牌章保留原造型。
- `before-tap.png`／`after-home-tap.png`：放手後的落墨。
- `after-person-tap.png`、`after-dialog-tap.png`：全屏人物及原生dialog內的實際落墨，沒有另疊假特效。
- `tap-demo.gif`：正式構建實際操作錄影，鎮居、人物配搭、換裝候選；圖內預覽不確認換裝。16fps為GIF輸出取樣，不是裝置幀率。
- `report.json`：正式構建Chromium／WebKit ×320×568、390×844、430×932；頁面錯誤、畫布位置、有效點按／無效操作、30次連點、空閒停止、即時減少動態及高光抑制。

## 重現

```bash
ln -s /workspace/jianghu-life2/node_modules node_modules # 只在此工作環境缺依賴時
npx vite-node scripts/qa/makeGamePolishFixtures.mts
npx vite-node scripts/qa/makePersonScreenFixtures.mts
VITE_ONLINE_PUBLIC=1 npm run build
python3 -m http.server 5201 --bind 127.0.0.1 --directory dist
TAP_INK_BASE=http://127.0.0.1:5201/ MARTIAL_WEBKIT_EXECUTABLE=/workspace/jianghu-testflight-setup/.local-online/martial-economy/webkit.sh python3 scripts/qa/checkTapInk.py
```

測試使用隔離瀏覽器、本機存檔及真遊戲元件；Supabase／遠端字體請求封鎖。畫布中心從真alpha像素檢查，點擊後不攔住卡片／導覽，預覽／取消不改普通及對戰配搭、玉石或修煉次數。每組同時只容許一張畫布，墨跡完結後必須移除，繪畫數字不得在空閒增加。單粒alpha≤0.28；模型測試另核對三組上限與清理半徑。

初輪檢查發現QA重新載入後的離線收成會遮住導覽，已按真按鈕先領受再測；按住時截圖亦可能超過650ms長按門檻，因此按壓截圖與快速放手測試分開。WebKit軟體繪製下清理採最多3秒輪詢確認，不把CI固定等待當裝置幀率。沒有因QA調整延長遊戲墨跡或放寬手勢規則。

素材生成、來源及視覺參數見 `design/art/tap-ink.md`；三張新WebP共41,476bytes。全套測試、tsc＋Vite構建、narrate見附錄log。構建原有大型chunk提示保留。本輪不宣稱真iPhone／TestFlight／VoiceOver或硬件FPS已驗收；實機需後續驗收。

最終結果：110檔850項測試、正式構建及narrate hard-fail=0；六組正式手機尺寸流程全部通過，皆一張畫布context、無頁面錯誤。另以Chromium／WebKit實際點選及確認換上精鋼刀，普通配搭正確更新、對戰配搭及玉石／書頁／修煉次數不變，關窗後無殘留畫布。比較板可用 `python3 scripts/qa/buildTapInkEvidence.py` 重建（WQY缺席，使用Noto CJK）。
