# ADR-004：DOM 介面動效統一用 anime.js

- **狀態**：Accepted（EA0.51）
- **決策者**：製作人（用戶指定套用 anime.js，範圍：演武台浮層、事件卡、人物／戰力頁、過月翻頁同導航）

## Context

介面動效原本散落喺 63 段 CSS `@keyframes`，節奏同緩動各自為政；逐字題字、數字滾動、殘血追落呢類「要讀實時數值」嘅效果用純 CSS 做唔到或者好難維護。

## Decision

DOM 介面動效（唔包 canvas 演武角色）統一經 `src/ui/inkMotion.ts`，底層用 **anime.js v4**（MIT）：

| 工具 | 用途 |
|------|------|
| `inkShake` | 扣血／受擊震動 |
| `inkTweenVar` | 推 CSS 變數（演武血條白色殘血 `--pct` 延遲追落） |
| `inkRevealChars` | 題字逐字由模糊墨點凝聚（首領名、換景地名、事件標題、結果標題） |
| `inkPopIn` | 列表／格仔／按鈕錯開落筆出場 |
| `inkCountTo` | 數字滾動（戰力頁） |
| `inkCardIn` / `inkPageIn` / `inkHop` / `inkStamp` | 事件卡展開、過月翻頁、導航圖示跳動、蓋印 |

- 節奏 `INK_MS`、緩動 `INK_EASE` 集中定義，同 CSS `--motion-*` 對齊。
- 只 import 用到嘅函數（tree-shake），唔整個庫打包。
- 系統「減少動態」（`prefers-reduced-motion`）時全部直接跳終點。
- 由 anime.js 接手嘅元素要停用舊 CSS 入場動畫（例：`.ink-delta-chips.is-anime`），避免雙重動畫。
- 會被其他程式寫 `transform` 嘅元素（演武血條定位、掃卡）唔可以直接用 anime 改 transform，要動內層元素。

## Alternatives

| 方案 | 唔揀原因 |
|------|----------|
| 繼續純 CSS keyframes | 做唔到逐字、數字滾動、實時殘血；參數分散 |
| GSAP | 已限於 `src/fx/highlight/`（ADR-002）；授權條款同體積唔適合全站 UI |
| 自己寫 tween | 用戶指定 anime.js；重造 stagger／timeline／splitText 唔值得 |

## Consequences

- ✅ 動效一致、易調；新效果只需加一個 helper。
- ⚠️ `splitText` 會改 DOM，組件卸載前要 `revert()`（helper 已回傳 cleanup）。
- ⚠️ 新依賴 `animejs`，加入 technical-preferences 允許清單。

## ADR Dependencies

- ADR-002（高光 3D 演出用 GSAP，範圍唔重疊）。

## Engine Compatibility

- Web（Vite 6 + React 19）；anime.js v4 ESM，瀏覽器原生 API，唔需要 polyfill。

## GDD Requirements Addressed

- `design/gdd/spar-duel.md`：血條、首領名牌、換景題字嘅表現層。
