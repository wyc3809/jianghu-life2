# 動態語言 — 江湖一生

> 一句話：**動如落筆，靜如留白。** 動作要似墨落紙，唔似 App 彈跳。

## 1. 時長四檔（CSS 變數，`src/styles.css` `:root`）

| 變數 | 值 | 用喺 |
|------|-----|------|
| `--motion-quick` | 0.2s | 按後回應、標籤切換、細項淡入 |
| `--motion-base` | 0.36s | 面板／文字入場、卡片展開 |
| `--motion-slow` | 0.7s | 落印、墨暈開、結果揭示 |
| `--motion-ritual` | 1.2s | 翻月、突破、首領現身等儀式時刻 |

例外：
- **< 0.12s 微回饋**（按下縮放、hover 變色）保持原值，唔入檔。
- **無限循環**（呼吸、慢轉、飄動）按物理感自訂，唔入檔。
- **逐字／逐項入場**用延遲疊加（`--i` × 間距），每項本身仍用上表時長。

## 2. 緩動三種

| 變數 | 曲線 | 意象 | 用喺 |
|------|------|------|------|
| `--ease-brush` | `cubic-bezier(0.22, 1, 0.36, 1)` | 落筆：出手快、收筆慢 | 入場、位移、寫出（進度條、題字） |
| `--ease-ink` | `cubic-bezier(0.25, 0.6, 0.3, 1)` | 暈開：墨慢慢化開 | 淡入淡出、模糊收實、霧 |
| `--ease-stamp` | `cubic-bezier(0.2, 0.85, 0.25, 1)` | 蓋印：重按即止 | 印章、確認、命運時刻 |

循環動畫用 `ease-in-out` 或 `linear`（慢轉）。**禁止**彈簧回彈（overshoot > 1.05）、glow 閃爍、彩虹漸變。

## 3. 四個招牌動作

| 動作 | 時機 | 做法 |
|------|------|------|
| **翻頁** | 過一月 | 一道紙影由右掃向左（slow；每月都播，唔用 ritual 以免拖慢節奏） |
| **落墨** | 事件文字、題簽 | 逐句由淡到實，微微上移（base，逐句延遲） |
| **蓋印** | 選擇確認、出生／死亡、得勝 | 朱砂印由空中壓落（1.6→0.94→1）、停一停再淡走（ritual，stamp）；戰鬥標題旁嘅印壓落後留低（`sealPress`） |
| **暈開** | 結果、數值變化 | 由化開嘅墨（blur 6px）收實（slow，ink，`inkBloom`） |

## 4. 可跳過與減少動態（`.claude/rules/ui-code.md`）

- `prefers-reduced-motion: reduce` 或遊戲設定「減少動態」（`html[data-ink-motion='reduce']`）時，四檔時長全部變 1ms：動畫即時到終態，唔會停喺中途。
- 無限循環動畫要逐個喺 reduce 條件下 `animation: none`。
- 儀式時刻（翻月、突破、首領）要可點擊跳過。
- 新加動畫**必須**用上表變數，唔好再寫死秒數。
- CSS 模組（`*.module.css`）唔會自動食到全域設定：每個 `@media (prefers-reduced-motion)` 區塊都要再寫一份 `:global(html[data-ink-motion='reduce'])` 版本。
- JS 計時器（例如落印清除、翻月 class 移除）要長過對應 CSS 時長，否則動畫會被中途截斷。

## 5. 落印字全集

store 嘅 `sealText` 用到嘅字全部有朱砂印位圖（`public/ink/art/seals/`，`src/ui/inkAssets.ts` `SEAL_ID_BY_TEXT`）：
生 終 緣 江湖 招 勝 命 危 定 劍 戰 敗 武 遁（白文為主）· 宗 收 教 晉 月 煉 裝（朱文）。
新增 sealText 時要同步加印（`scripts/art/build_ink_stamps.py` SEALS），`tests/inkSilhouettes.test.ts` 會檢查。
