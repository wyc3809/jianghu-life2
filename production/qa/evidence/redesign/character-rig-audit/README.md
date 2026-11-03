# 人物動畫階段一：主線現況證據

日期：2026-11-01。主線 `9a07caf49b0b05b6d7b39def891a41925391bbed`／EA0.100.0。詳見[審查及方案](../../../../../design/audits/character-animation-phase1.md)。本輪未修改產品動畫，以下全部是修改前基準；沒有新骨架、新多人功能、部署或真機通過聲明。

## 實際播放與操作

| 檔案 | 內容及限制 |
|---|---|
| [appearance-playback.webm](appearance-playback.webm)／[GIF](appearance-playback.gif) | 原有 drawAppearance 三套衣服，連續 idle→walk→attack→hurt→down，反向再播，操作暫停／逐步／轉向。沒有額外畫新動作，run／get-up 根本不存在 |
| [appearance-poses.png](appearance-poses.png) | 同 height=280 的待機、步行、蓄勢、出招、受擊及倒地。相同縮放參數不代表骨長已一致 |
| [appearance-sequence.png](appearance-sequence.png) | 連續影片的抽幀；只供閱讀次序，判斷動作請播放原片 |
| [actual-app-home.webm](actual-app-home.webm)／[畫面](actual-app-home.png) | 真 App、隔離測試存檔，主頁觸發現有演武首領全屏，播至第二回合，沒有多人後端請求 |
| [autobattle-playback.webm](autobattle-playback.webm)／[次序圖](autobattle-sequence.png) | 既有開發入口、真核心固定種子戰報、正式 InkAutoBattle 元件；詳細主角／舊剪影敵人，有走近、出招、擊退等 |
| [detailed-opponent-playback.webm](detailed-opponent-playback.webm)／[畫面](detailed-opponent.png) | 同一隔離事件戰報只換雙方外觀資料，播放、點2倍至結果。161個出招樣本 e.t=9，246個 hitT<.26 樣本沒有 hurt state；人物站姿被整體推移，沒有相應出招／受擊選圖 |
| [legacy-three-duel.webm](legacy-three-duel.webm) | 未被現行產品入口使用的舊 Three 元件，獨立審查入口實播18秒；整張人物平面換三張貼圖，不是蒙皮。沒有加入 App |
| [war-poses-readonly.png](war-poses-readonly.png) | 只讀主線 drawWarCharacter 原有十二姿勢集中的六格對照，並未恢復會武開發或進行多人壓力測試 |
| [head-outfit-matrix.png](head-outfit-matrix.png) | 八頭×三衣，idle／down；另逐一執行六個動作時點及左右方向，共288次現有繪圖呼叫（墨色） |
| [weapon-matrix.png](weapon-matrix.png) | 徒手、指法、暗器、劍、槍及弓；可見 finger 被畫成暗器，弓沒有拉弓動作，腿法仍用同一伸手身體圖 |
| [fallback-320.png](fallback-320.png) | Linux WebKit、320×568，appearance網絡素材全部失敗，仍使用同身份縮圖後備；審查工具畫布本身固定390px，不作320px App排版通過證據 |

## 量測

Linux Chromium、390×844、DPR2、SwiftShader，Vite開發版，loopback；**不是iPhone／TestFlight／正式套件下載速度**。一對一的 update／render 是包裝原方法量到的主執行緒耗時，不含完整 GPU 提交／合成成本。讀取取樣本身亦有成本。

| 情境 | 實測 |
|---|---|
| 原有三個共用造型、無戰鬥特效，連續120秒 | RAF間距 p50 16.7ms、p95 16.8ms、p99 16.8ms、最大216.7ms；7,128個間距樣本 |
| 原有詳細雙人事件播放 | render p50 .3ms、p95 1.2ms、p99 5.8ms、最大108.5ms；1,137次render |
| 同場景update | p50 0ms（計時器精度）、p95 .2ms、p99 1.1ms、最大93ms；2,046個子步 |
| 同場景render間距 | p50 16.7ms、p95 21.6ms、p99 35ms、最大275.1ms；包含首次出招／新幀及切換，未把慢幀刪去 |
| 共用造型載入 | 頭8＋身24＋兵器7＋頸1＝40張；RGBA寬×高×4估算26,868,160bytes（約25.6MiB），不包括調色canvas、DOM、其他素材、GPU複本 |
| appearance 網絡資源 | local dev傳輸合計2,243,566bytes；最後一個appearance responseEnd約908ms。不是完整App TTI或真手機首次載入 |
| 120秒JS heap | 20至120秒每20秒抽樣約4.16–4.84MiB；GC有回落。另記錄embedder／backing storage，但不是完整程序或GPU記憶體；兩分鐘不足以宣稱沒有洩漏 |

原始數據：[performance-summary.json](performance-summary.json)、[performance.json](performance.json)、[detailed-opponent-probe.json](detailed-opponent-probe.json)。不能用低主線程render時間推論人體品質或真機60fps。首次量測曾因審查檔案熱更新而失效，該輪不納入；上表來自停止修改後重新跑完的120秒。

## 驗證範圍

- Chromium連續播放、逐幀／暫停／左右、不同頭及衣、真播放器加速至結果：有影片及記錄。
- Linux WebKit連續播放及左右、全appearance素材失效同身份後備：pageerror 0；減少動態直接選固定strike。不是iOS實機驗收。
- 新骨架的接點／骨長／角度／碰撞：**未實作，不能測成pass**。現有只有錨點，可重現位移跳變；資料在[anchors.json](anchors.json)。
- 真iPhone前後景、暫停恢復、滑步自然度、長時間耗電／溫度／記憶體、完整App素材失效及所有武器動作：仍待後續逐階段驗收。
- 本輪沒有把完整多人戰當成可玩成品重新驗收；#156仍暫停，舊視覺passed不作依據。

記錄：[playback-log.json](playback-log.json)、[matrix-log.json](matrix-log.json)、[webkit.json](webkit.json)。

## 重現

使用測試專用 `qa-fixture.json`（固定種子人物／600免費玉石；不是玩家存檔，沒有帳戶或API憑證）。先在倉庫根啟動 `npx vite --host 127.0.0.1 --port 5270`，**不要設定正式雲端憑證**。

```bash
python3 scripts/qa/recordCharacterAudit.py
python3 scripts/qa/probeCharacterAudit.py
python3 scripts/qa/checkCharacterAuditMatrix.py
```

需要既有Python Playwright、Chromium；WebKit腳本路徑由本環境提供，其他環境應換成自身Playwright WebKit可執行檔。瀏覽器錄影暫存放 `.local-online/rig-audit/raw`，成品在本目錄。量測時不要改動Vite模組、同時構建或跑測試；存檔與回放僅在隔離context內，任何supabase請求被封鎖。審查HTML在scripts/qa，沒有註冊產品路由，正式App入口及玩法不變。

本次原始錄影保留完整成品；接點比較圖是呼叫原有繪圖器生成，沒有另畫假人物或以除錯線代替角色。

## 本輪程式基準檢查

- `npx vitest run`：120檔／928項全部通過，66.15秒。沒有放寬容差、skip或改寫測試。
- `npm run build`：TypeScript及Vite通過；保留既有大chunk提示，未把它說成錯誤已修好。
- `npm run audit:narrate`：hard-fail 0。
- 審查Python腳本 `py_compile` 通過。新增只有審查文件、隔離QA工具與證據；沒有改src／core／interfaces／data或產品路由。測試通過不代表已修正報告列出的動畫缺陷。
