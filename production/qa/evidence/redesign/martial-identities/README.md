# 第30項：15門武學動態原型驗收

呢份係代表原型交付，唔係全103門完成或商業品質已獲確認。玩家正式驗收通過仍係0門；88門未製作。

## 先睇呢幾份

- [正常速度實際戰鬥合輯（11外功）](normal-reel.mp4)
- [長河拳正常速度](river-normal.gif)／[四分一慢速](river-slow.gif)
- [EA0.75.0 改前／原型改後紅框](comparison.jpg)
- [三拳法無標籤／同色／無附加特效對比](fists-blind.gif)：左長河拳、中羅漢拳、右裂嶽神拳。
- [兩劍法對比](swords-blind.gif)：左聽雨劍意、右穿風引線劍。
- [兩內功對比](internal-blind.gif)：左鐵布衫、右金剛不壞體。
- [兩身法對比](steps-blind.gif)：左斷橋步、右踏雲九霄。

無標籤影片係同一產品 `SparStage` 呈現器嘅肢體時間線檢視，裁去文字、血條、數字及敵人，唔係另一套動畫播放器。呢啲檢視冇結算攻擊；真正戰鬥見正常合輯及單門 `.mp4`。

主頁持劍、切劍→拳→掌→腿→劍嘅核對片：`art_river_fist-rotation.mp4`。原型全段採用裝備劍作待機，空手招式期間唔疊劍，結束恢復；冇改角色裝備屬性。

## 珍本及支援武學

`pr_mountain_split-{crit,kill}-recovery.mp4`、`pr_wind_thread-{crit,kill}-recovery.mp4` 用真正演武核心seed42結果，再凍結時計、置左慢速檢視不同收勢，避免敵人倒影遮住主角。唔係重複打擊，亦唔冒稱三套完整新攻擊。真暴擊取第十二關，真擊倒取第一關；全部第一卷，證明唔係以高卷數假扮暴擊。來源結果見 `blind-variants-report.json`。

一般8姿勢；珍本兩外功各24姿勢；珍本內功／身法各16姿勢，共168格、21圖集。`art_iron_body.mp4`、`pr_diamond_body.mp4`、`qg_broken_bridge.mp4`、`pr_cloud_step.mp4` 係運氣／步法姿勢檢視，冇虛構攻擊；正式入口只喺實際受擊／落空作視覺回應。

## 驗證及範圍

- 635項Vitest／87檔、TypeScript＋Vite build、narrate hard-fail0；記錄見 `validation.json`。
- 真正主頁、演武首領、江湖普通、江湖首領4入口：`product-entry-report.json`，全部同一產品引擎，新圖集只載入已裝備／涉及武學，五外功及獨立支援欄保留。隔離browser context並阻擋雲端寫入。
- Chromium／WebKit，320、390、420寬、844高、DPR2、減少動態共6情境，無橫向溢出；另全部武學網絡素材404仍用嵌入正確掌法靜態姿勢，見 `browser-report.json`。頁面錯誤0。
- 基準截圖由真正 `8de47b2` 原版呈現器取得，只加DEV驗收入口、獨立核心戰報及控制舞台作固定步進，冇改原版角色素材／動作呈現。見 `baseline.json`。
- 錄影固定步進24fps／盲辨30fps，影片播放時間係遊戲時間；截圖工具花幾耐唔當裝置FPS。音色沿用既有音效及混音limiter，本次影片無錄音，唔宣稱已完成主觀聲音驗收。
- 原型圖集開關前後逐幀結算次數／敵方行動一致；別稱、稀有度、空手不畫裝備劍、低動態、Miss不彈傷害、傷害守恆及核心RNG隔離有測試。

呢次唔代表已跑完全103門、全部敵人、全部中斷／正反方向／連續輪替驗收。冇iPhone真機，未量到真機圖形記憶體峰值，唔宣稱穩定60fps或達到商業完成品。

## 重跑

1. `python scripts/art/prepare_martial_identities.py`
2. `npx vite-node scripts/qa/exportMartialIdentity.mts`
3. 開Vite於5188：`?martial-preview=1` 有選門、正常／慢速、同色／關特效、肢體檢視。呢頁只限DEV，唔入正式包。
4. `node scripts/qa/recordMartialIdentities.mjs`、`node scripts/qa/recordMartialReviewExtras.mjs`、`python scripts/qa/packageMartialReview.py`。
5. `node scripts/qa/checkMartialProductEntries.mjs`。

本環境WebKit缺 `libGLESv2`，以Debian官方 `libgles2_1.6.0-1_amd64.deb` 解包到 `/tmp/martial-webkit/runtime/`，用 `LD_LIBRARY_PATH=/tmp/martial-webkit/runtime/usr/lib/x86_64-linux-gnu`。明確啟動原本已安裝嘅同一WebKit執行檔；系統ldconfig唔會列出user-space函式庫，實際瀏覽器有啟動及執行全部檢查，冇skip測試。

過程有失敗嘅驗收嘗試，冇當通過：開發熱更新中斷；背景頁面舞台輪詢逾時，改前景頁面及定時輪詢後重跑；WebKit函式庫缺少；非生死交手停喺處置門檻，終結情境改用真正演武擊倒。歷史日誌保留 `previous-*-attempt.log`，最終依已完成報告及影片判定。

## 品質仍要精修

人工檢視三拳法已見到長拳連推／馬步短打／升拳重落差別；兩劍法有直刺靜候／交步盤劍差別。呢個係製作方初步觀察，唔係玩家盲辨已通過。

8格主招銜接仍會硬，手形、腳步、服飾比例、接觸端點候選同布料連續性未完成逐門商業精修；珍本追加目前以收勢分支為主，更多完整變體仍待製作。舊停格同即時時計耦合未重寫，未以數值補償；舊3D示範未重製。完整製作計畫見 `production/武學動畫審核與製作計畫.md`。

## 桌面抽樣性能（唔係真機驗收）

| 武學 | 就緒時間 | rAF p95 | 新圖集及FX RGBA估算 |
|---|---:|---:|---:|
| art_river_fist | 2449ms | 33.3ms | 6.75MiB |
| pr_mountain_split | 2215ms | 16.8ms | 17.75MiB |
| pr_wind_thread | 2131ms | 16.8ms | 17.00MiB |

每門180幀樣本。長河拳呢次桌面樣本有掉幀，未達穩定60fps，唔挑好結果冒充通過。JS heap取樣及新圖RGBA估算都唔係整個瀏覽器／GPU記憶體峰值，詳見 `performance.json`；iPhone真機仍待量測。
