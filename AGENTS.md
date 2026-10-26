# AGENTS.md · 江湖一生（Jianghu Life Engine）接手說明

> 寫俾 ChatGPT Codex（或者任何接手嘅 AI 代理）。
> 最後更新：2026-10-11，線上版本 **EA0.64.0**（PR #109）。
> 呢份係操作規則；同 `CLAUDE.md`、`.claude/rules/*`、`.claude/docs/*` 衝突時，以呢份為準。

---

## 1. 專案一句話

瀏覽器直版手機人生模擬遊戲（BitLife × 武俠），事件驅動。
- Repo：`wyc3809/jianghu-life2`，只有呢隻遊戲。`main` 係主線。
- 線上：<https://wyc3809.github.io/jianghu-life2/>（GitHub Pages，`main` 一 push 就自動部署）。

## 2. 同玩家（repo 擁有者）合作

- **用廣東話回覆**（繁體字）。commit、文件都用廣東話。
- **有選擇要佢決定就出選擇題**（2–4 個選項，建議嗰個放第一並標「建議」）。唔好一次問太多。
- 流程：**問 → 出選項 → 玩家決定 → 做 → 截圖 → 玩家確認 → 先上線**。
- **未經玩家睇圖確認，唔好上線**。玩家講「上線」先發布（見第 8 節）。
- **刪功能之前一定要問**。大規模改動（跨好多檔案重寫）之前先問。
- 未定嘅數值：放測試參數，同時記低喺 `production/redesign-scope.md`。唔好當定案寫入設計文件（GDD）。
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

## 8. 上線流程（玩家講「上線」先做）

1. 升版本（四個位，格式 `EA0.xx.0` / `0.xx.0-ea`）：
   - `src/version.ts` 嘅 `APP_VERSION`
   - `tests/version.test.ts`
   - `package.json` 嘅 `version`
   - `package-lock.json` 頭兩個 `version`
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

## 9. 目前狀態（EA0.64.0）

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
