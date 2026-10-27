# 第51項 · 武學頁及武學令驗收（EA0.96.0）

玩家已同意建議的武學配搭頁，並要求一併優化「武學令」。已從真程式確認為學新／熟練升階的token，不是秘笈閣翻書；按最新一般修改完成即發布的授權執行。

## 實際畫面與操作

- `before-after.jpg`：同一真武學滿欄存檔，390×844 DPR2，舊直排頁／新一屏配搭及七卷窗；紅框只作QA註記。
- `before-loadout.png`、`before-picker.png`：9598e72原頁；token程式與EA0.95.0逐檔核對無差異。新版`after-loadout-320/390/430.png`、`after-picker-320/390/430.png`、`after-volumes.png`及`after-gacha-link.png`。
- `martial-demo.gif`：正式遊戲元件的真點選／預覽／比較／指定欄位操作；`token-demo.gif`：實際按苦練外功，核心先升階，再正常播放武學令。兩者16fps為GIF取樣，不是裝置幀率。
- `actual-rank-result.png`：本次真修煉由略有小成至駕輕就熟，顯示裂石殘掌及江湖身份；不把演出品階珍品當永久珍本。
- `before-token-{1,3,5}-{idle,result}.png`及`after-token-{0..5}-{idle,transition,result}.png`：390×844 DPR2；transition屬實際過渡截圖，截圖耗時可能跨至揭曉，不聲稱精確某毫秒。
- `before-motion-1dpr/`保留舊多pass在軟體GPU完整正常播放1／3／5階的1DPR截圖，另行標示，不拿低解像靜圖冒充同DPR畫質比較。公平靜圖已另外重拍2DPR。原瀏覽器錄影保留於忽略的.local-online/martial-ui目錄；Git只收短示範GIF。

## 結果

- 112檔860項測試、tsc＋Pages正式構建、narrate hard-fail=0、copy 9980段／口語及禁句0。沒有skip／刪除測試。
- `ui-report.json`：Chromium／WebKit ×320×568、390×844、430×932，滿欄固定一屏、七格與44px操作、候選類型及永久珍本篩選、已學／已得／未得七卷、預覽及Escape取消不學習不寫狀態、確認與連點鎖、普通／對戰獨立、支援各一門及卸下、原收藏與返回；另測空收藏及真最長武學名稱。所有頁面無JS錯誤。只用隔離存檔，雲端請求封鎖。
- `token-report.json`：六階在Chromium軟體GPU／390×844 DPR2正常播放，逐次升階、蓄勢、轉面及揭曉；結果落定後GL呼叫不再增加。`token-webkit.json`另驗WebKit正常1階播放。
- `token-edge-report.json`：320×568直接跳過連點、減少動態完整流程、玉圖缺失及`WEBGL_lose_context.loseContext()`真正失效，均到同一DOM結果，完成鍵可讀可點。
- 真苦練一次、核心只升階一次；演出前後熟練、卷數、配搭、玉石、書頁保持，連按完成不重派。角色自然掛機修為仍照常增加，不將此當成演出重派。另以真十連600→0，選柔絲手「馬上裝備」導向指定欄位及比較確認，預覽不學習、確認不重扣抽卡成本。
- `token-before-budget.json`舊待機中位43 GL draw calls／frame，新版初始待機7；舊數據為1DPR、新為2DPR，**只比較繪製呼叫次數**，不可推算像素負荷倍率或iPhone FPS。新模型高階增加實體刻飾；結果0次連續繪製，不以動態低DPR留作收藏結果。
- 本次Pages base `/jianghu-life2/`正式構建再驗同屏、真家藏預覽／取消、七卷詳情及確認裝備，沒有額外玉石／書頁扣除。

## 重現

```bash
npx vite-node scripts/qa/makeGamePolishFixtures.mts
npx vite-node scripts/qa/makePersonScreenFixtures.mts
npx vite-node scripts/qa/makeMartialScreenFixtures.mts
npx vite --host 127.0.0.1 --port 5208
MARTIAL_WEBKIT_EXECUTABLE=/workspace/jianghu-testflight-setup/.local-online/martial-economy/webkit.sh python3 scripts/qa/checkMartialScreen.py
python3 scripts/qa/checkMartialToken.py
```

新玉紋與舊金屬來源、字體及素材映射見`design/art/martial-ui/README.md`。未操作玩家帳戶，沒有改core/data/content/interfaces/store/cloud、經濟或存檔。沒有真iPhone硬件FPS／VoiceOver驗收宣稱；GitHub未簽名Archive與TestFlight已簽署上傳分開。

比較板可用`python3 scripts/qa/buildMartialEvidence.py`重建；WQY缺席，使用Noto CJK。短屏首輪成本行曾折行，已調整單位短標、減少裝飾留白並保留完整回內用途說明，最後驗證所有格內文字無overflow；過程圖保留於.local-online/martial-ui/iterations，最終圖另列。

真升階及抽取銜接亦可重跑`python3 scripts/qa/checkMartialPromotion.py`及`python3 scripts/qa/checkMartialGachaLink.py`，同樣使用隔離瀏覽器與真按鈕，不呼叫補派獎勵接口。

EA0.96.0 Pages正式構建亦再走一次真苦練升階、完整令牌及連按完成，`promotion-pages.log`通過。版本字串升級沒有改學習、結算或升階觸發。
