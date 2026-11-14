# AGENTS.md · 江湖一生（Jianghu Life Engine）接手說明

> 寫俾 ChatGPT Codex（或者任何接手嘅 AI 代理）。
> 最後更新：2026-11-12；現行版本及發布狀態以 `src/version.ts` 同 `production/redesign-scope.md` 為準。
> 呢份係操作規則；同 `CLAUDE.md`、`.claude/rules/*`、`.claude/docs/*` 衝突時，以呢份為準。

---

## 1. 專案一句話

瀏覽器直版手機人生模擬遊戲（BitLife × 武俠），事件驅動。
- Repo：`wyc3809/jianghu-life2`，只有呢隻遊戲。`main` 係主線。
- 線上：<https://wyc3809.github.io/jianghu-life2/>（GitHub Pages，`main` 一 push 就自動部署）。

## 2. 同玩家（repo 擁有者）合作

- **用廣東話回覆**（繁體字）。commit、文件都用廣東話。
- **有選擇要佢決定就出選擇題**（2–4 個選項，建議嗰個放第一並標「建議」）。唔好一次問太多。
- **最新發布偏好（2026-10-27，玩家明確授權）**：一般修改、修正及完善，完成並通過相關測試／畫面檢查後，**直接按第8節上線**；不用再逐次等玩家睇圖確認或另講「上線」。照常交代實際改動、截圖／GIF、驗證及發布結果。
- **改動好大先確認**：例如主要玩法／經濟重設、存檔遷移、整體介面重做或跨多個系統的大規模重寫，先同玩家討論方向及範圍。玩家明確要求先看原型／逐步討論的工作，仍按該要求進行。這項授權不代表批准以前未採用的原型。
- **角色動畫分階段驗收（2026-11-01）**：本輪先交單角色App內測原型及證據，正式戰鬥尚未切換；原型需先評閱再接事件一對一，不因一般直接發布偏好而自動合併上線。不得改戰鬥／武學／耗內／回內／經濟／裝備或存檔。
- **人物原型被否決（2026-11-03）**：玩家否決PR #157的頭身比例及接駁，之前測試通過不代表人體通過。玩家指定改用 `GenielabsOpenSource/spine-animation-ai`，並確認持有該skill商用授權及Spine編輯器授權。先評閱完整人體母版，再拆件綁定及三段短動作；詳見 `design/art/spine-character/PROJECT.md`。未評閱前不得接實戰或發布，不得再要求玩家重複授權。
- **Spine頭頸再次被否決**：玩家表示v01仍甩頭；母版接受不代表分件或動作接受。v02改為頭／頸／上胸同一連續蒙皮，加入真材質連通及拉伸守門；不得以骨長正常、鎖死頭或加頸件掩蓋問題。新近鏡仍須玩家評閱，PR #157保持草稿。
- **Spine v02已接受並授權套用／發布（2026-11-03最新）**：玩家看過連續頭頸近鏡後明確表示「Ok!套用哂再上線，以後用呢個標準」。此項取代上面v02待評閱限制；可完成現有單人／非同步一對一及人物造型的共用接入、測試並發布。後續人物以連續頭／頸／胸材質、同一骨架與固定比例為標準；不得恢復逐幀分頭身／補頸或用鎖頭掩蓋。八頭三衣四色、真兵器、存檔及真戰果保持。正式手機畫面用同一Spine資料的離線動作幀及同幀握點，不能另寫人體規則。這項不代表重啟幫會／門派戰或PR #156，也不代表真機效能或原生Spine編輯器回合已通過。
- **戰鬥演出回復舊版（2026-11-07最新）**：玩家否決套用Spine後的打擊與動作，明確要求「改版上線」「做返之前動畫的效果」。正式單人／一對一戰鬥恢復EA0.100.0完整姿勢與原有編排，不再強制播Spine通用出拳；人物頁／衣櫥靜態連續立繪保留。此項取代上面「所有戰鬥必須用Spine輸出」限制。舊姿勢先按原錨點合成完整人物，有界快取後整體播放，固定身高及同姿勢握點，不逐幀獨立更新頭頸。八頭三衣四色、裝備、戰果及存檔不回退；沒有批准重設玩法或恢復多人戰。不得因早前接受Spine接點而忽略最新動作否決。
- **全武學獨立動畫要求（2026-11-07）**：玩家進一步明確要求所有兵器及不同武功均有獨立動畫，範圍103門、19類。不能以共用姿勢、換色、速度／粒子差，或磁碟有103張圖集就宣稱完成。原人物圖集與玩家八頭三衣四色兼容分開驗收；玩家已回覆「保留」：全部獨立動作必須保留所選面孔、衣著及配色，不用固定黑袍人物代替。第60f項已完成103門、19類逐門動作，發布目標EA0.102.0；三衣393段、八頭連續頸面及四色按原存檔套用，七卷仍讀真順序。正式交手共用同幀整體位圖與真握點，保留舊打擊編排及同身份缺圖後備；不能回復通用出拳代替逐門動作。瀏覽器／測試通過不等於玩家已接受畫面，亦不是iPhone或TestFlight驗收。幫會／門派戰仍不重啟。
- **EA0.102.0人物動畫被否決（2026-11-08，最新）**：玩家指出手部斷開錯位、衣服重疊、姿勢不合格，要求重新找根因再修。此前975項測試及發布記錄不代表人體合格。此項取代本輪自動發布及全量套用授權：先修單一角色，交待機／出招一至兩張實際渲染圖；玩家確認比例、接位、衣層與握點後才做短動畫，再確認才擴展。不得批量烘焙103門、合併或上線未確認的修正版。保留既有素材及正式資料，不改戰果、經濟、裝備、存檔或恢復幫會／門派戰。
- **第60g兩張修正版亦被否決（2026-11-08，最新）**：玩家指出人物比例及姿勢縮埋、屈腳、右臂同身體有白縫；PR #160上一版待機／直拳唔合格。先撤回該組拼件姿勢，以已接受完整母版量自然站姿及人體關節，先交一張真骨架自然站姿，未通過唔再做出拳／短動畫或擴展。唔可因蒙皮誤差或979項測試過關當人體獲接受；仍未授權合併／上線。
- **自然站姿v02已接受，續做一人短出拳（2026-11-08，最新）**：玩家看過完整母版原比例的實際站姿後回覆「Ok!」，可用此比例及接位作基準，續做同一束髮旅裝角色嘅蓄勢／出拳／收招短段。抬臂須先處理袖根、被遮衣層及真蒙皮，不可直接拉扯整幅母版或恢復錯位分件。此項取代上一條「唔開始下一段動作」限制；只授權單角色短段製作及評閱，未授權擴展其他武學／造型、合併或上線。保留雙腳方向、連續頭頸、固定比例及真骨架；短動畫仍待玩家接受。
- **短拳v03已接受並授權完成其餘（2026-11-10，最新）**：玩家睇過正常／慢速短拳後回覆「Ok 做哂其他全部」。可依已接受自然站姿與接位續做其餘動作、103門武學、八頭三衣四色，完成實際畫面及相關測試後按第8節發布，唔再逐門要求重複確認。此項取代上面僅單角色待評閱限制；唔代表所有新成品已經通過驗證。保留戰鬥數值、真命中時計、經濟、裝備、存檔與原有兵器；幫會／門派戰及PR #156繼續暫停。
- **EA0.103.0亦被否決，恢復原本黑影（2026-11-12，最新）**：玩家指出成品完全唔啱，明確要求「用返一開始黑影嗰個版本」。正式演武、事件及非同步一對一恢復既有斗笠黑影、原位圖動作與裝備兵器；停止正式細節人物及獨立人體動畫接入，不重新批量製作。此項取代先前全量細節人物套用要求。現有玩法、戰果、裝備、存檔與造型ID保持；舊資料／原型保留，唔因還原畫面刪存檔或重設全遊戲。
- **全功能／介面同步優化（2026-11-12）**：玩家看過skill及處理方向後答覆「改吧」。按第61項盤點及修共用問題，沿用水墨宣紙與斗笠黑影；原生彈窗、動態偏好、文字更新及同步狀態用共用路徑。真修為ticker、演武入帳、戰鬥、概率及經濟不改。偏好改變只更新現有引擎quiet，不能重開戰報／演武。幫會／門派戰仍暫停。檢查對照見 `design/audits/game-unification-ea0104.md`。
- **人物腳位再次被指出有誤（2026-11-14，最新）**：玩家指出檢查截圖「啲腳都係錯哂」，原盤坐圖的腿靴方向不自然，不能以介面測試通過代替人體檢查。玩家對「先用完整自然站姿、交單一角色實際手機圖確認，再擴展」回覆「好 執執佢」。本輪先交霜髮／旅裝／青玉人物頁及衣櫥一致的完整站姿預覽，三尺寸檢查不代表其他造型或姿勢已獲接受；暫不擴展新人體素材、合併或發布。不得拉扯原盤坐腿件或重開已否決的細節戰鬥動畫。黑影沿用原路徑，另作實際幀檢查。第62項及 `production/qa/evidence/redesign/standing-portrait-review/` 記錄具體狀態。
- **幫會／門派戰暫停（2026-11-01）**：保留程式、素材及原型，PR #156維持草稿；玩家明確重啟前不擴充、合併或部署。單角色檢查不代表恢復多人玩法或獎勵開發。
- **刪功能之前一定要問**。大規模改動（跨好多檔案重寫）之前先問。
- 未定嘅數值：放測試參數，同時記低喺 `production/redesign-scope.md`。唔好當定案寫入設計文件（GDD）。
- **引導只自動顯示一次（2026-10-30）**：各步提示保存已讀，離場重入／重開不重複；略過關閉整組。只可由設定手動重看，不能藉重看重設真進度或重派獎勵。
- 玩家講「都唔得」之類：先出選擇題問清楚方向，唔好估。

## 3. 技術棧

| 項目 | 用乜 |
|---|---|
| 構建 | Vite 6，`base` 由 `VITE_BASE` 決定（Pages 用 `/jianghu-life2/`） |
| UI | React 19 + TypeScript（strict） |
| 狀態 | Zustand（`src/store/lifeStore.ts`、`ancestryStore.ts`） |
| 驗證 | Zod（`interfaces/`） |
| 存檔 | IndexedDB，localStorage 後備 |
| 雲端 | Supabase，只限 `src/cloud/`，按需載入（ADR-003） |
| 動效 | animejs，統一經 `src/ui/inkMotion.ts`（ADR-004） |
| 3D 演出 | three + gsap，只限 `src/fx/highlight/`，lazy chunk（ADR-002） |
| 測試 | Vitest（`tests/*.test.ts`） |

路徑別名：`@core/*`、`@interfaces/*`、`@data/*`、`@content/*`。

## 4. 目錄

| 路徑 | 用途 |
|---|---|
| `src/components/ink/` | 所有畫面元件（`InkPlayScreen.tsx` 係主畫面，`Ink*.tsx`） |
| `src/store/` | Zustand store 同 slices |
| `src/spar/` | 演武台 2D 引擎（canvas、剪影、粒子） |
| `src/fx/highlight/` | 高光 3D 演出（three + gsap）；`duel/` 係自動交手 3D |
| `src/fx/ambient/` | 主畫面環境特效粒子邏輯（EA0.64.0） |
| `src/ui/` | icon、素材網址、動效工具 |
| `src/styles.css` | 全部樣式（好大，用搜尋，唔好成份讀） |
| `core/life/` | 遊戲邏輯（事件、戰鬥、修為、抽卡、奇遇、祖蔭…），唔掂 DOM |
| `core/random.ts` | seeded PCG32 |
| `data/` | 數值同資料（`redesign/testParams.ts` 係測試參數） |
| `content/` | 文字內容（武學、珍本等 JSON） |
| `data/events/` | 事件資料庫 |
| `interfaces/` | Zod schema + TS 型別 |
| `public/ink/` | 位圖素材（WebP） |
| `scripts/art/` | 生成素材嘅 Python 腳本（固定 seed，可重跑） |
| `design/gdd/` | 系統設計文件 |
| `design/art/` | 美術文件 |
| `docs/architecture/` | ADR |
| `production/redesign-scope.md` | **改版進度、玩家決定、測試參數總表（最重要）** |
| `production/qa/evidence/redesign/` | 截圖證據 |

## 5. 硬性規則（一定要守）

### 5.1 唔用 SVG
- 所有畫面（角色、敵人、UI、進度條、框、紋理）都用**位圖 WebP/PNG**。
- 唔准：inline `<svg>`、`.svg` 檔、`data:image/svg+xml`、用 canvas path 畫角色剪影扮 SVG。
- 例外：只有 PWA icon（`public/icon-*.svg`）。
- 要新素材：喺 `scripts/art/` 寫 Python（Pillow + numpy）生成，放 `public/ink/art/...`。AI 圖可以同名同尺寸替換。
- 詳見 `.claude/rules/no-svg-game-art.md`。

### 5.2 隨機要可重現
- 遊戲邏輯入面**唔准 `Math.random()`**，用 `getRng()`（`core/random.ts`）或者呼叫者傳入嘅 RNG。
- 純畫面特效都用自己嘅 seeded RNG（例：`src/fx/ambient/particles.ts` 嘅 `createRng`）。

### 5.3 邏輯同畫面分開
- 故事、分支唔好寫死喺 React 元件，放 `data/events/`。
- 數值放 `data/` 或 `tuning.ts`，唔好寫死喺元件。
- 新系統：純邏輯放 `core/` 或 `src/fx/*/`（冇 DOM），先寫測試。

### 5.4 演武台
- 演武台（主畫面 `.ink-home-scene` / `InkSparStage`、`src/spar/`）嘅**玩法同數值未經玩家同意唔好改**。
- 可以喺上面疊嘢（例：EA0.64.0 嘅流雲同季節粒子），但唔好郁演武台本身。

### 5.5 美術方向
- 現行：**水墨風淺色**（宣紙底、墨色），`src/styles.css` 原本嘅 ink 主題。
- 玩家試過兩個新方向都**拒絕**：
  - 漆木古銅深色（參考九陰真經）：「太深色」。
  - 宣紙墨色雲紋框：唔要。
- 嗰兩套位圖同腳本已喺 2026-10-14 刪走；A／B 商業 UI 樣板（`?ui-preview`）亦已刪，**唔好再做返**。
- `design/art/art-direction-b.md` 嘅 UI 框部分已經暫停；人物、場景、出圖規格仍然可以參考。
- 唔准：紫色霓虹、科幻光效、網頁式表格同虛線格。
- **全遊戲框架基準（2026-10-26）**：玩家指定 `design/art/person-screen/selected-third.png`「更換武器」作往後全部框框嘅品質基準：明亮宣紙、自然纖維與淡水墨、窄磨邊、朱砂乾筆選取及主按鈕、真正毛筆標題配清晰正文。共用規格及素材映射見 `design/art/parchment-ui/README.md`，執行樣式 `src/components/ink/parchment-ui.css`；唔好另起一套普通網頁卡片／細線方框或舊古銅重框。器物牌章保留本身造型；按用途決定全屏與否，唔改玩法或假造數值以遷就設計圖。

### 5.6 安全
- **唔好 commit 任何 API key 或 token**。用環境變數（例：`HF_TOKEN`、`SPRITECOOK_API_KEY`），唔好寫入 repo。
- **唔好叫玩家喺對話貼 token**。要佢自己喺雲端環境設定加。
- 之前玩家喺對話貼過一條 SpriteCook key，已經建議佢換新嘅。唔好再用舊 key。

### 5.7 Git
- **唔准 force push**、唔准改寫 `main` 歷史。
- Commit 用 Conventional Commits（`feat:`、`fix:`、`chore:`、`docs:`、`test:`、`refactor:`），標題用廣東話，內文寫 `Story: redesign-scope 第 N 項` 或者對應設計文件。
- 唔好喺 commit、PR、程式註解寫 AI 模型名稱或者型號。

## 6. 程式標準

- TypeScript strict；`npx tsc --noEmit -p .` 要過。
- 公開函數要有 doc comment（中文就得）。
- 跟附近程式碼嘅風格：註解密度、命名、寫法。
- 命名：型別 PascalCase；變數、函數 camelCase；事件 id snake_case（例：`life_birth`）。
- 尊重「減少動態」：動畫要檢查 `prefers-reduced-motion`，冇就唔播或者用靜態版。
- 直版手機框寬 420px；觸控為主。
- **全屏頁面偏好（2026-10-26）**：人物／裝備頁同江湖地圖一樣，收起全局頂欄及底部整條導覽（包括「過一月」），保留左上返回鍵，將位置留畀主體。之後按功能判斷：適合集中操作／展示嘅頁面可用全屏；鎮居等需要常駐操作嘅頁面唔好一律移除導航。唔好以此當成所有頁面都要改，亦唔係刪除過月玩法。
- `src/styles.css` 有一條 `.scroll-shell > *:not(...)` 規則會將直接子元素變做 `position: relative`。加全畫面浮層時要加入嗰個 `:not()` 名單（參考 `.ink-ambient`）。

## 7. 測試同驗證標準

每次改動完、commit 之前一定要跑：

```bash
npx vitest run          # 全部要過（EA0.64.0 時 567 個）
npm run build           # tsc + vite build 要過
npm run audit:narrate   # CI 都會跑，hard-fail 要係 0
```

- 新邏輯要有 Vitest 測試，放 `tests/<系統>.test.ts`。
- 測試名格式：`test_<系統>_<情境>_<預期>`。要有清楚嘅準備、執行、驗證三段。
- 測試要 deterministic：固定 seed，唔靠時間。
- **唔准** skip、disable 或者刪測試嚟令 CI 變綠。
- 改存檔格式要加存檔來回（roundtrip）測試；要兼容舊存檔。
- `eslint` / `prettier` 未有設定檔，唔好當佢係檢查標準。

### 畫面改動要交截圖
1. 開 dev server：`npx vite --host 127.0.0.1 --port 5173`
2. 用 Playwright（chromium）影 390×844、deviceScaleFactor 2。
3. 測試情境要固定，例：`useLifeStore.getState().newLife(42)`，設 `flags.newbie_done = true`，`pending = null`，`tab = 'home'`；玉石用 `useAncestryStore` 設 `meta.jade = { free: 600, paidTest: 0 }`。
4. 整「改之前／改之後」對比板：紅框標住改咗嘅位，上面寫標題同測試情境（用 Pillow，字體 `/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc`）。
5. 有郁嘅效果要另外整 GIF。
6. 放 `production/qa/evidence/redesign/`，俾玩家睇。

## 8. 上線流程（一般修改已授權直接發布；大型改動先確認）

1. 升版本（以下位置，格式 `EA0.xx.0` / `0.xx.0-ea`）：
   - `src/version.ts` 嘅 `APP_VERSION`
   - `tests/version.test.ts`
   - `package.json` 嘅 `version`
   - `package-lock.json` 頭兩個 `version`
   - `production/ios/release-readiness.json` 嘅 `gameVersion`（跟 `APP_VERSION`），並同步 `production/ios/testflight-metadata.zh-Hant.md`；版本測試會拒絕漏改，避免Codemagic內測被過期紀錄擋住。
2. `production/redesign-scope.md` 對應項目標「玩家已確認，EA0.xx.0 上線」。
3. 跑測試、build，commit（`chore: 版本 EA0.xx.0`），push 工作分支。
4. 開 PR 去 `main`，標題格式：`江湖一生 · feat: <內容> EA0.xx.0`。內文寫摘要、改動、驗證。
5. 等 CI（`.github/workflows/ci.yml`：`npm test`、`audit:narrate`、build）全綠。
6. **Squash merge**。
7. 確認線上：等 Pages 部署完，打開 `https://wyc3809.github.io/jianghu-life2/`，搵 `assets/index-*.js` 入面有冇新版本字串。
8. 工作分支對齊 `main`（唔使 force push）：
   ```bash
   git fetch origin main <branch>
   git checkout -B <branch> origin/main
   git merge -s ours origin/<branch> -m "chore: merge stale branch history"
   git push -u origin <branch>
   ```
9. 回覆玩家：上咗乜、測試結果、線上已確認。

## 9. 初期已上線摘要（EA0.64.0；現況見 redesign-scope）

已上線（詳細見 `production/redesign-scope.md`）：
- 改版第 1–17 項：離線 48 小時、修為儲備、突破、生死戰、家族傳承、祖蔭里程碑、當前目標、掛機收成、三主修＋流派、玉石抽卡、在線奇遇、外功七卷、自動交手（2D＋3D）等。
- 第 18 項：UI icon 統一（設色＋閃光）。第 19 項：秘笈閣直版。
- 第 20 項：敵人圖鑑（6 區，小兵／精英／首領）＋首領特性（精英弱化版），見 `design/gdd/foe-roster.md`。
- 第 20b 項：首領／精英專屬 AI 剪影 18 張（`data/foes/sprites.json`）。
- 第 21 項：主畫面特效。
  - 場景會動：流雲＋四季粒子（春花瓣、夏雨絲、秋落葉、冬雪）。
  - 墨韻粒子：邊緣墨點、墨暈，點擊濺墨。
  - 實作：`src/components/ink/InkAmbientFx.tsx`、`src/fx/ambient/`；位圖由 `scripts/art/build_ink_fx.py` 生成；測試 `tests/ambient_fx.test.ts`。

## 10. 未做／可以接住做

| 項目 | 狀態 |
|---|---|
| 「按鈕會發光」「貨幣同數字閃」特效 | 玩家上次揀特效時冇揀，可以再提議 |
| 場景 AI 圖（Hugging Face FLUX） | `scripts/art/gen_hf_art.py` 已寫好，要玩家喺雲端環境加 `HF_TOKEN` 先用得；冇 token 會 exit 2 |
| 小兵專屬剪影、四組動作圖 | 等 SpriteCook 額度 |
| 雙榜（D3） | 未做 |
| 突破試煉改做戰鬥 | 現時仍係擲成功率；2D 全身戰鬥要先出方案圖 |
| 祖蔭「新起步路線」 | 內容未定 |
| 配樂 | 曲目未定，音樂聲道暫時冇聲 |
| `foe-roster.md` 截圖驗收 | 未打勾 |

開工前：先讀 `production/redesign-scope.md` 同相關 GDD，再出選擇題問玩家想先做邊樣。
