# 江湖一生 Jianghu Life Engine V1.0

> **產品分離**：本分支線是《江湖一生》。同 remote 的 `main` 已是 **WorthBook**
> （净资产 PWA），兩邊**不要互相 merge**。詳見 [`docs/PRODUCT-SEPARATION.md`](docs/PRODUCT-SEPARATION.md)。

**BitLife × 武俠人生模擬** — 玩家體驗可重玩的武俠人生，內容由 **JSON 事件引擎** 驅動。

## 核心循環

出生 → 家庭 → 成長 → 拜師 → 江湖 → 戀愛 → 門派 → 戰鬥 → 財富 → 老年 → 死亡 → 人生總結 → 傳承

## 技術棧

| 層級 | 技術 |
|------|------|
| UI | React + TypeScript + Vite |
| 狀態 | Zustand |
| 校驗 | Zod |
| 存檔 | IndexedDB（localStorage 備援） |
| 隨機 | 種子 PCG32（禁止 `Math.random()`） |
| 測試 | Vitest |

## Codex 模組順序

1. `interfaces/lifeEngine.ts` — GameState、GameEvent、Zod
2. `core/random.ts` — Seeded RNG
3. `core/life/eventEngine.ts` — 事件抽取與選擇結算
4. `core/life/requirements.ts` / `effects.ts` — 條件與效果
5. `core/life/saveIndexedDb.ts` — 存檔
6. `src/components/LifeDebugPanel.tsx` — 除錯面板
7. `data/events/catalog.ts` — 核心 50 個事件（實際事件庫已擴充至 **321** 條，見下方「事件資料規模」）
8. `src/components/ink/InkPlayScreen.tsx` — 直版水墨 UI 主畫面

## 事件資料格式

```ts
GameEvent {
  id,
  title,
  requirements?,
  choices: [{ id, text, outcomes: [{ effects }] }]
}
```

效果類型包含：`narrate`、`attr`、`money`、`health`、`martial`、`joinSect`、`learnSkill`、`lover`、`die` 等。

## 事件資料規模（實際現況，非 MVP 初版）

合計 **321** 條去重事件（跑 `npm run docs:events` 自動生成 `docs/EVENT-CATALOG.md`，該數字以此為準）。分佈於：

| 檔案 | 條數 | 說明 |
|------|------|------|
| `data/events/catalog.ts` | 50 | 核心 MVP 事件（Zod `GameEvent` 格式） |
| `data/events/jianghuExtra100.ts` | 100 | 江湖百事（日常／遊歷） |
| `data/events/jinyongTropes.ts` | 24 | 金庸橋段 tropes |
| `data/events/bossEncounters.ts` | 16 | 首領／宿敵遭遇 |
| `data/events/secretArts.ts` | 12 | 秘傳武學 |
| `data/events/playabilityPack.ts` | 9 | 可玩性補強包 |
| `data/events/ordinary.ts` | 8 | 日常事件 |
| `data/events/roadEncounters.ts` | 6 | 路途遭遇 |
| `data/events/practiceWander.ts` | 5 | 修煉／遊歷 |
| `data/events/jianghu_random_events_100.json` | 100 | Pack v1 格式（`op/path/value`，非 Zod `GameEvent`，見 [ADR-001](docs/architecture/adr-001-unified-event-runtime.md) 雙軌技術債） |

以上皆由 `core/life/jianghuEventRepository.ts` + `core/life/eventEngine.ts` 在執行時合併載入，並非死碼。

## 本地開發

```bash
npm install
npm run dev
npm test
npm run build
```

## 遺留引擎（2.x）

`core/world.ts`、`core/gameplay.ts` 等 tick 模擬引擎仍保留於倉庫，供後續與人生引擎合併或對照；目前 **預設入口為 V1 人生模式**（`src/App.tsx`）。舊版對應的 UI（`GameScreen.tsx`／`LifeGameScreen.tsx`／`StartScreen.tsx`／`LifeStartScreen.tsx`）因 `App.tsx` 已完全改走 `Ink*` 系列元件、無任何引用，已於清理死碼時刪除；如需與 tick 引擎對照，走 `core/world.ts`／`core/gameplay.ts` 本身即可，不需重建舊 UI。

## Claude Code Game Studios

本專案已安裝 [Claude Code Game Studios](https://github.com/Donchitos/Claude-Code-Game-Studios)
（49 agents · 73 skills · hooks · rules）。

```bash
# 需安裝 Claude Code CLI
npm install -g @anthropic-ai/claude-code
claude
# 然後執行 /start 或 /adopt
```

主設定見根目錄 `CLAUDE.md`，代理與技能在 `.claude/`。

## 部署

與先前相同：GitHub Pages（`npm run build:pages`）、Vercel、Netlify、Cloudflare — 見 `vercel.json` / `netlify.toml`。

### 雙產品注意（jianghu vs WorthTracker）

- **本分支／此 repo 根目錄**是 Vite「江湖一生」遊戲。
- `main` 上可能另有 **WorthTracker**（Next.js）；**勿把 WorthTracker 根目錄直接 merge 進遊戲根**。
- GitHub Pages（`gh-pages`）若同時託管兩者：遊戲在 `/App/`，WorthTracker 在 `/App/worthtracker/`。
- 手動部署請用 `bash scripts/deploy-pages.sh`（會 `build:pages` 並在切到 `gh-pages` 時**保留 `worthtracker/`**）。
- CI：`npm test` + `npm run audit:narrate`（禁詞／非 catalog 空洞模板）。
