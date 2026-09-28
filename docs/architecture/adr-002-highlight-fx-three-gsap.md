# ADR-002：高光時刻用 Three.js ＋ GSAP（按需載入）

- 狀態：Accepted（用戶指定規格：「主體物做成真 3D」「用 GSAP 時間線編排」）
- 日期：2026-09-27

## 背景

用戶要求一套對標商業手遊結算演出嘅「高光時刻」：真 3D 主體（厚度、倒角、活動部件）、
後期邊緣描邊、GSAP 時間線、Canvas 2D 粒子、Web Audio 合成音效。原本技術棧只准 react／zustand／zod。

## 決定

- 新增依賴 `three`（WebGL 渲染、卡通材質、後期描邊）同 `gsap`（時間線、彈性緩動）。
- 全部放喺 `src/fx/highlight/`，以 `React.lazy` 按需載入，主包唔包 three／gsap（build 驗證：只喺 `HighlightFx-*.js`）。
- 開局後閒時 `prefetchHighlight()` 預載；冇 WebGL 就退返水墨 `InkMomentFx`／`InkBreakthroughModal`。
- 模擬層（`core/`）只負責入隊 `state.moments`（`loot`／`learn`／`rank`）同突破結果；UI 映射喺 `src/fx/highlight/fromGame.ts`，唔改遊戲狀態。
- 2026-09-28 擴展：主頁 3D 斗笠劍客（`src/fx/highlight/title/`，`TitleHeroLazy`）共用同一套渲染器、粒子、音效；主頁一打開就 lazy 載入，未載好／冇 WebGL 時顯示同角度靜態 WebP（`public/ink/art/title/swordsman.webp`）。設計見 `design/ux/title-hero.md`。
- 視覺上呢個演出係卡通手遊風（用戶選「完全照規格」），同水墨主畫面刻意分開；稱號、受傷、突破失敗仍用水墨特效。

## 代價

- 延遲載入 chunk 約 190 KB gzip。
- 渲染：1.5 倍超採樣＋MSAA×4＋法線／深度 pass；減少動態時唔超採樣、粒子打 35%、唔震屏。

## 替代方案

- CSS 3D：放大加側翻會投影成鋪滿屏嘅平面，規格明確禁止。
- 預渲染影片：唔可以按品階換色、唔可以互動。
